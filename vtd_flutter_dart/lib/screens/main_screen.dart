import 'package:flutter/material.dart';
import '../models/node.dart';
import '../services/firestore_service.dart';
import '../theme/scifi_theme.dart';
import '../widgets/menu_icon.dart';
import '../widgets/root_node_sidebar.dart';
import '../widgets/child_node_list.dart';
import '../widgets/folder_view.dart';
import '../widgets/text_editor.dart';
import '../widgets/create_node_modal.dart';
import '../widgets/icon_change_modal.dart';
import '../widgets/node_context_menu.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  final FirestoreService _firestoreService = FirestoreService();
  
  bool _menuOpen = false;
  String? _selectedRootId;
  List<Node> _rootNodes = [];
  List<Node> _childNodes = [];
  bool _loading = true;
  Node? _openedChildNode;
  
  // Context menu state
  bool _contextMenuVisible = false;
  Offset _contextMenuPosition = Offset.zero;
  Node? _selectedNodeForMenu;
  bool _isRootNodeForMenu = false;
  
  // Modal state
  bool _createModalVisible = false;
  String _createModalParentId = '';
  bool _iconChangeModalVisible = false;
  Node? _nodeToEdit;

  @override
  void initState() {
    super.initState();
    _fetchRootNodes();
  }

  Future<void> _fetchRootNodes() async {
    setState(() => _loading = true);
    try {
      final nodes = await _firestoreService.getRootNodes();
      if (mounted) {
        setState(() {
          _rootNodes = nodes;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _fetchChildNodes(String parentId) async {
    try {
      final nodes = await _firestoreService.getChildNodes(parentId);
      if (mounted) {
        setState(() {
          _childNodes = nodes;
        });
      }
    } catch (e) {
      // Handle error
    }
  }

  void _handleMenuPress() {
    setState(() => _menuOpen = !_menuOpen);
  }

  void _handleMenuLongPress() {
    setState(() {
      _createModalParentId = '';
      _createModalVisible = true;
    });
  }

  void _handleRootPress(Node node) {
    setState(() {
      _selectedRootId = node.id;
      _openedChildNode = null; // Clear opened child when switching roots
      _childNodes = []; // Clear child nodes immediately when switching roots
    });
    _fetchChildNodes(node.id);
  }

  void _handleRootLongPress(Node node) {
    setState(() {
      _selectedNodeForMenu = node;
      _isRootNodeForMenu = true;
      _contextMenuPosition = const Offset(100, 200);
      _contextMenuVisible = true;
    });
  }

  void _handleChildPress(Node node) {
    // Toggle: if clicking the same node that's already open, close it
    setState(() {
      if (_openedChildNode?.id == node.id) {
        _openedChildNode = null;
      } else {
        _openedChildNode = node;
      }
    });
  }

  void _handleChildLongPress(Node node) {
    setState(() {
      _selectedNodeForMenu = node;
      _isRootNodeForMenu = false;
      _contextMenuPosition = const Offset(200, 100);
      _contextMenuVisible = true;
    });
  }

  void _handleContextMenuEdit() {
    if (_selectedNodeForMenu != null) {
      setState(() {
        _nodeToEdit = _selectedNodeForMenu;
        _iconChangeModalVisible = true;
        _contextMenuVisible = false;
      });
    }
  }

  void _handleContextMenuCreateChild() {
    if (_selectedNodeForMenu != null) {
      setState(() {
        _createModalParentId = _selectedNodeForMenu!.id;
        _createModalVisible = true;
        _contextMenuVisible = false;
      });
    }
  }

  Future<void> _handleContextMenuDelete() async {
    if (_selectedNodeForMenu == null) return;

    try {
      await _firestoreService.deleteNodeCascade(_selectedNodeForMenu!.id);
      
      // If deleted node was the opened child, close it
      if (_openedChildNode?.id == _selectedNodeForMenu!.id) {
        setState(() => _openedChildNode = null);
      }
      
      // If deleted node was the selected root, clear selection
      if (_selectedRootId == _selectedNodeForMenu!.id) {
        setState(() {
          _selectedRootId = null;
          _openedChildNode = null;
        });
      }
      
      // Refresh lists
      _fetchRootNodes();
      if (_selectedRootId != null && _selectedRootId != _selectedNodeForMenu!.id) {
        _fetchChildNodes(_selectedRootId!);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error deleting node: $e')),
        );
      }
    }
  }

  void _handleNodeCreated() {
    _fetchRootNodes();
    if (_selectedRootId != null) {
      _fetchChildNodes(_selectedRootId!);
    }
  }

  void _handleIconChanged() {
    _fetchRootNodes();
    if (_selectedRootId != null) {
      _fetchChildNodes(_selectedRootId!);
    }
  }

  Future<void> _handleChildDroppedOnRoot(Node childNode, Node rootNode) async {
    try {
      await _firestoreService.updateNode(childNode.id, parent: rootNode.id);
      // Refresh both lists
      _fetchRootNodes();
      if (_selectedRootId != null) {
        _fetchChildNodes(_selectedRootId!);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error moving node: $e')),
        );
      }
    }
  }

  Future<void> _handleRootOrderChange(List<Node> reorderedNodes) async {
    try {
      // Update order in Firestore for all nodes
      final updates = reorderedNodes.asMap().entries.map((entry) => {
        'id': entry.value.id,
        'order': entry.key,
      }).toList();
      
      await _firestoreService.updateNodesOrder(updates);
      
      // Update local state
      setState(() {
        _rootNodes = reorderedNodes;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating order: $e')),
        );
      }
    }
  }

  Future<void> _handleChildOrderChange(List<Node> reorderedNodes) async {
    try {
      // Update local state immediately (optimistic update)
      setState(() {
        _childNodes = reorderedNodes;
      });
      
      // Then update order in Firestore (async, don't block)
      final updates = reorderedNodes.asMap().entries.map((entry) => {
        'id': entry.value.id,
        'order': entry.key,
      }).toList();
      
      // Fire and forget - don't wait for Firestore update
      _firestoreService.updateNodesOrder(updates).catchError((e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error updating order: $e')),
          );
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating order: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: SciFiTheme.bgPrimary,
        body: Center(
          child: CircularProgressIndicator(color: SciFiTheme.neonCyan),
        ),
      );
    }

    return Scaffold(
      backgroundColor: SciFiTheme.bgPrimary,
      body: Stack(
        children: [
          Column(
            children: [
              // Top bar with menu icon and child list
              Container(
                height: 120,
                decoration: const BoxDecoration(
                  border: Border(
                    bottom: BorderSide(color: SciFiTheme.borderDim),
                  ),
                  color: SciFiTheme.bgSecondary,
                ),
                padding: const EdgeInsets.all(8),
                child: Row(
                  children: [
                    MenuIcon(
                      onPress: _handleMenuPress,
                      onLongPress: _handleMenuLongPress,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ChildNodeList(
                        visible: _selectedRootId != null,
                        childNodes: _childNodes,
                        onChildPress: _handleChildPress,
                        onChildLongPress: _handleChildLongPress,
                        onOrderChange: _handleChildOrderChange,
                        openedChildId: _openedChildNode?.id,
                      ),
                    ),
                  ],
                ),
              ),
              // Main content area
              Expanded(
                child: Row(
                  children: [
                    RootNodeSidebar(
                      visible: _menuOpen,
                      rootNodes: _rootNodes,
                      selectedRootId: _selectedRootId,
                      onRootPress: _handleRootPress,
                      onRootLongPress: _handleRootLongPress,
                      onOrderChange: _handleRootOrderChange,
                      onChildDroppedOnRoot: _handleChildDroppedOnRoot,
                    ),
                    Expanded(
                      child: _buildContentArea(),
                    ),
                  ],
                ),
              ),
            ],
          ),
          // Context Menu
          NodeContextMenu(
            visible: _contextMenuVisible,
            onClose: () => setState(() => _contextMenuVisible = false),
            onEdit: _handleContextMenuEdit,
            onCreateChild: _isRootNodeForMenu ? _handleContextMenuCreateChild : null,
            onDelete: _handleContextMenuDelete,
            position: _contextMenuPosition,
            isRoot: _isRootNodeForMenu,
          ),
          // Create Node Modal
          CreateNodeModal(
            visible: _createModalVisible,
            parentId: _createModalParentId,
            onClose: () => setState(() => _createModalVisible = false),
            onNodeCreated: _handleNodeCreated,
          ),
          // Icon Change Modal
          IconChangeModal(
            visible: _iconChangeModalVisible,
            node: _nodeToEdit,
            onClose: () => setState(() {
              _iconChangeModalVisible = false;
              _nodeToEdit = null;
            }),
            onIconChanged: _handleIconChanged,
          ),
        ],
      ),
    );
  }

  Widget _buildContentArea() {
    if (_selectedRootId == null && _openedChildNode == null) {
      return const Center(
        child: Text(
          'Select a root node from the menu to view its children',
          style: TextStyle(color: SciFiTheme.textSecondary),
          textAlign: TextAlign.center,
        ),
      );
    }

    if (_openedChildNode != null) {
      if (_openedChildNode!.type == 'panel') {
        return FolderView(
          parentId: _openedChildNode!.id,
          onNodePress: _handleChildPress,
        );
      } else if (_openedChildNode!.type == 'text') {
        return TextEditor(
          nodeId: _openedChildNode!.id,
        );
      }
    }

    return const SizedBox.shrink();
  }
}

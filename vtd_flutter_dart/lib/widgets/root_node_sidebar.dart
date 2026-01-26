import 'package:flutter/material.dart';
import '../models/node.dart';
import '../theme/scifi_theme.dart';
import 'draggable_node_icon.dart';

class RootNodeSidebar extends StatefulWidget {
  final bool visible;
  final List<Node> rootNodes;
  final String? selectedRootId;
  final Function(Node) onRootPress;
  final Function(Node) onRootLongPress;
  final Function(List<Node>)? onOrderChange;
  final Function(Node, Node)? onChildDroppedOnRoot; // For cross-list drag

  const RootNodeSidebar({
    super.key,
    required this.visible,
    required this.rootNodes,
    this.selectedRootId,
    required this.onRootPress,
    required this.onRootLongPress,
    this.onOrderChange,
    this.onChildDroppedOnRoot,
  });

  @override
  State<RootNodeSidebar> createState() => _RootNodeSidebarState();
}

class _RootNodeSidebarState extends State<RootNodeSidebar> {
  List<Node> _nodes = [];

  @override
  void initState() {
    super.initState();
    _nodes = List.from(widget.rootNodes);
  }

  @override
  void didUpdateWidget(RootNodeSidebar oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Only update if the list actually changed (not just a reorder)
    if (oldWidget.rootNodes.length != widget.rootNodes.length ||
        oldWidget.rootNodes.any((node) => !widget.rootNodes.any((n) => n.id == node.id))) {
      _nodes = List.from(widget.rootNodes);
    }
  }

  void _handleReorder(int oldIndex, int newIndex) {
    if (oldIndex == newIndex) return;
    
    setState(() {
      final item = _nodes.removeAt(oldIndex);
      // When moving forward, we need to account for the removed item
      // When moving backward, insert at the target index directly
      final adjustedNewIndex = oldIndex < newIndex ? newIndex - 1 : newIndex;
      _nodes.insert(adjustedNewIndex, item);
    });
    
    // Persist order changes to parent
    widget.onOrderChange?.call(_nodes);
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.visible) return const SizedBox.shrink();

    return Container(
      width: 120,
      decoration: const BoxDecoration(
        color: SciFiTheme.bgPrimary,
        border: Border(
          right: BorderSide(color: SciFiTheme.borderDim),
        ),
      ),
      child: ListView.builder(
        padding: const EdgeInsets.all(8),
        itemCount: _nodes.length,
        itemBuilder: (context, index) {
          final node = _nodes[index];
          final isSelected = widget.selectedRootId == node.id;
          return Container(
            key: ValueKey(node.id),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: isSelected
                ? BoxDecoration(
                    boxShadow: SciFiTheme.glowStrong,
                  )
                : null,
            child: DragTarget<Node>(
              onWillAccept: (draggedNode) {
                if (draggedNode == null) return false;
                // Accept if dragging from child list to root
                if (draggedNode.parent.isNotEmpty && draggedNode.parent != node.id) {
                  return true;
                }
                // Accept if reordering within root list (same parent, different node)
                if (draggedNode.parent.isEmpty && draggedNode.id != node.id) {
                  return true;
                }
                return false;
              },
              onAccept: (draggedNode) {
                // Handle drop from child list to root
                if (draggedNode.parent.isNotEmpty && draggedNode.parent != node.id && widget.onChildDroppedOnRoot != null) {
                  widget.onChildDroppedOnRoot!(draggedNode, node);
                }
                // Handle reordering within root list
                else if (draggedNode.parent.isEmpty && draggedNode.id != node.id) {
                  // Find the current position of the dragged node
                  final oldIndex = _nodes.indexWhere((n) => n.id == draggedNode.id);
                  if (oldIndex != -1) {
                    // Use the target index where we dropped
                    _handleReorder(oldIndex, index);
                  }
                }
              },
              builder: (context, candidateData, rejectedData) {
                final isHighlighted = candidateData.isNotEmpty;
                return Container(
                  decoration: isHighlighted
                      ? BoxDecoration(
                          border: Border.all(color: SciFiTheme.neonCyan, width: 2),
                          borderRadius: BorderRadius.circular(4),
                        )
                      : null,
                  child: DraggableNodeIcon(
                    node: node,
                    onPress: () => widget.onRootPress(node),
                    onLongPress: () => widget.onRootLongPress(node),
                    size: 100,
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

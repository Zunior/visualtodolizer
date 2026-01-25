import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { Node } from '@/lib/firestore';
import { getRootNodes, getChildNodes, updateNodesOrder, updateNode, deleteNodeCascade } from '@/lib/firestore';
import { SciFiTheme } from '@/constants/scifiTheme';
import MenuIcon from '@/components/MenuIcon';
import RootNodeSidebar from '@/components/RootNodeSidebar';
import ChildNodeList from '@/components/ChildNodeList';
import NodeContextMenu from '@/components/NodeContextMenu';
import CreateNodeModal from '@/components/CreateNodeModal';
import IconChangeModal from '@/components/IconChangeModal';
import FolderView from '@/components/FolderView';
import TextEditor from '@/components/TextEditor';
import LucideIcon from '@/components/LucideIcon';

type DragSource = 'root' | 'child' | null;

export default function MainScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedRootId, setSelectedRootId] = useState<string | null>(null);
  const [rootNodes, setRootNodes] = useState<Node[]>([]);
  const [childNodes, setChildNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedNodeForMenu, setSelectedNodeForMenu] = useState<Node | null>(null);
  const [isRootNodeForMenu, setIsRootNodeForMenu] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createModalParentId, setCreateModalParentId] = useState<string>('');
  const [iconChangeModalVisible, setIconChangeModalVisible] = useState(false);
  const [nodeToEdit, setNodeToEdit] = useState<Node | null>(null);
  const [openedChildNode, setOpenedChildNode] = useState<Node | null>(null);
  
  // Global drag state
  const [draggedNode, setDraggedNode] = useState<Node | null>(null);
  const [dragSource, setDragSource] = useState<DragSource>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const rootSidebarRef = useRef<View>(null);
  const childListRef = useRef<View>(null);

  // Fetch root nodes on mount
  useEffect(() => {
    fetchRootNodes();
  }, []);

  // Fetch child nodes when root is selected
  useEffect(() => {
    if (selectedRootId) {
      fetchChildNodes(selectedRootId);
    } else {
      setChildNodes([]);
    }
  }, [selectedRootId]);

  const fetchRootNodes = async () => {
    setLoading(true);
    try {
      const nodes = await getRootNodes();
      setRootNodes(nodes);
    } catch (e) {
      console.error('Error fetching root nodes:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildNodes = async (parentId: string) => {
    try {
      const nodes = await getChildNodes(parentId);
      setChildNodes(nodes);
    } catch (e) {
      console.error('Error fetching child nodes:', e);
    }
  };

  const handleMenuPress = () => {
    setMenuOpen(!menuOpen);
  };

  const handleMenuLongPress = () => {
    setCreateModalParentId('');
    setCreateModalVisible(true);
  };

  const handleRootPress = (node: Node) => {
    setSelectedRootId(node.id);
    setOpenedChildNode(null); // Clear opened child when switching roots
  };

  const handleRootLongPress = (node: Node) => {
    setSelectedNodeForMenu(node);
    setIsRootNodeForMenu(true);
    setContextMenuPosition({ x: 100, y: 200 }); // Approximate position
    setContextMenuVisible(true);
  };

  const handleChildPress = (node: Node) => {
    // Toggle: if clicking the same node that's already open, close it
    if (openedChildNode?.id === node.id) {
      setOpenedChildNode(null);
    } else {
      setOpenedChildNode(node);
    }
  };

  const handleChildLongPress = (node: Node) => {
    setSelectedNodeForMenu(node);
    setIsRootNodeForMenu(false);
    setContextMenuPosition({ x: 200, y: 100 }); // Approximate position
    setContextMenuVisible(true);
  };

  const handleContextMenuEdit = () => {
    if (selectedNodeForMenu) {
      setNodeToEdit(selectedNodeForMenu);
      setIconChangeModalVisible(true);
    }
  };

  const handleContextMenuCreateChild = () => {
    if (selectedNodeForMenu) {
      setCreateModalParentId(selectedNodeForMenu.id);
      setCreateModalVisible(true);
    }
  };

  const handleContextMenuDelete = async () => {
    if (!selectedNodeForMenu) return;

    try {
      // Delete the node and all its children (cascade delete)
      await deleteNodeCascade(selectedNodeForMenu.id);
      
      // If deleted node was the opened child, close it
      if (openedChildNode?.id === selectedNodeForMenu.id) {
        setOpenedChildNode(null);
      }
      
      // If deleted node was the selected root, clear selection
      if (selectedRootId === selectedNodeForMenu.id) {
        setSelectedRootId(null);
        setOpenedChildNode(null);
      }
      
      // Refresh lists
      fetchRootNodes();
      if (selectedRootId && selectedRootId !== selectedNodeForMenu.id) {
        fetchChildNodes(selectedRootId);
      }
    } catch (e) {
      console.error('Error deleting node:', e);
    }
  };

  const handleNodeCreated = () => {
    fetchRootNodes();
    if (selectedRootId) {
      fetchChildNodes(selectedRootId);
    }
    // If we have an opened child node that's a panel, refresh its children
    if (openedChildNode && openedChildNode.type === 'panel') {
      // FolderView will handle its own refresh via useEffect
    }
  };

  const handleIconChanged = () => {
    fetchRootNodes();
    if (selectedRootId) {
      fetchChildNodes(selectedRootId);
    }
  };

  const handleRootOrderChange = async (newOrder: Node[]) => {
    try {
      // Update order for all root nodes
      const updates = newOrder.map((node, index) => ({
        id: node.id,
        order: index,
      }));
      await updateNodesOrder(updates);
      // Update local state
      setRootNodes(newOrder);
    } catch (e) {
      console.error('Error updating root order:', e);
      // Refresh on error
      fetchRootNodes();
    }
  };

  const handleChildOrderChange = async (newOrder: Node[]) => {
    try {
      // Update order for all child nodes
      const updates = newOrder.map((node, index) => ({
        id: node.id,
        order: index,
      }));
      await updateNodesOrder(updates);
      // Update local state
      setChildNodes(newOrder);
    } catch (e) {
      console.error('Error updating child order:', e);
      // Refresh on error
      if (selectedRootId) {
        fetchChildNodes(selectedRootId);
      }
    }
  };

  // Handle cross-list drag start
  const handleGlobalDragStart = (node: Node, source: DragSource) => {
    setDraggedNode(node);
    setDragSource(source);
  };

  // Handle drag position update
  const handleDragPositionUpdate = (x: number, y: number) => {
    setDragPosition({ x, y });
  };

  // Check if drop position is over root sidebar
  const checkDropOnRootSidebar = (absoluteX: number, absoluteY: number): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!rootSidebarRef.current || !menuOpen) {
        resolve(null);
        return;
      }
      
      rootSidebarRef.current.measure((x, y, width, height, pageX, pageY) => {
        // Check if drop is within root sidebar bounds
        if (absoluteX >= pageX && absoluteX <= pageX + width && 
            absoluteY >= pageY && absoluteY <= pageY + height) {
          // Find which root node was dropped on based on Y position
          const relativeY = absoluteY - pageY;
          const ITEM_HEIGHT = 100 + 12; // size + gap
          const nodeIndex = Math.floor(relativeY / ITEM_HEIGHT);
          if (nodeIndex >= 0 && nodeIndex < rootNodes.length) {
            resolve(rootNodes[nodeIndex].id);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  };

  // Handle cross-list drag end
  const handleGlobalDragEnd = async (dropTarget: 'root' | 'child' | 'none', targetNodeId?: string, absoluteX?: number, absoluteY?: number) => {
    if (!draggedNode || !dragSource) {
      setDraggedNode(null);
      setDragSource(null);
      return;
    }

    // If dropTarget is not specified, check drop zones
    if (dropTarget === 'none' && absoluteX !== undefined && absoluteY !== undefined) {
      // Check if dropped on root sidebar
      if (dragSource === 'child' && menuOpen) {
        const rootNodeId = await checkDropOnRootSidebar(absoluteX, absoluteY);
        if (rootNodeId) {
          // Child dropped on root - assign to that root
          try {
            const oldParentId = draggedNode.parent;
            await updateNode(draggedNode.id, { parent: rootNodeId });
            // Refresh both lists
            fetchRootNodes();
            // Refresh child list if old parent is still selected
            if (selectedRootId === oldParentId) {
              fetchChildNodes(oldParentId);
            }
            // If the target root is selected, refresh its children
            if (selectedRootId === rootNodeId) {
              fetchChildNodes(rootNodeId);
            }
          } catch (e) {
            console.error('Error moving child to root:', e);
          }
          setDraggedNode(null);
          setDragSource(null);
          return;
        }
      }
    }

    // If dragged outside menus, return to initial position
    if (dropTarget === 'none') {
      setDraggedNode(null);
      setDragSource(null);
      return;
    }

    // From child to root: assign child to the root node
    if (dragSource === 'child' && dropTarget === 'root' && targetNodeId) {
      try {
        const oldParentId = draggedNode.parent;
        await updateNode(draggedNode.id, { parent: targetNodeId });
        // Refresh both lists
        fetchRootNodes();
        // Refresh child list if old parent is still selected
        if (selectedRootId === oldParentId) {
          fetchChildNodes(oldParentId);
        }
        // If the target root is selected, refresh its children
        if (selectedRootId === targetNodeId) {
          fetchChildNodes(targetNodeId);
        }
      } catch (e) {
        console.error('Error moving child to root:', e);
      }
    }
    // From root to child: do nothing, return to initial position (handled by dropTarget === 'none')

    setDraggedNode(null);
    setDragSource(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={SciFiTheme.colors.neonCyan} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top bar with menu icon and child list */}
      <View style={styles.topBar}>
        <MenuIcon onPress={handleMenuPress} onLongPress={handleMenuLongPress} />
        <ChildNodeList
          ref={childListRef}
          visible={selectedRootId !== null}
          childNodes={childNodes}
          onChildPress={handleChildPress}
          onChildLongPress={handleChildLongPress}
          onOrderChange={handleChildOrderChange}
          draggedNode={draggedNode}
          dragSource={dragSource}
          onGlobalDragStart={handleGlobalDragStart}
          onGlobalDragEnd={handleGlobalDragEnd}
          onDragPositionUpdate={handleDragPositionUpdate}
          openedChildId={openedChildNode?.id || null}
        />
      </View>

      {/* Main content area */}
      <View style={styles.mainContent}>
        <RootNodeSidebar
          ref={rootSidebarRef}
          visible={menuOpen}
          rootNodes={rootNodes}
          selectedRootId={selectedRootId}
          onRootPress={handleRootPress}
          onRootLongPress={handleRootLongPress}
          onOrderChange={handleRootOrderChange}
          draggedNode={draggedNode}
          dragSource={dragSource}
          onGlobalDragStart={handleGlobalDragStart}
          onGlobalDragEnd={handleGlobalDragEnd}
          onDragPositionUpdate={handleDragPositionUpdate}
        />
        <View style={styles.contentArea}>
          {selectedRootId === null && !openedChildNode && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Select a root node from the menu to view its children
              </Text>
            </View>
          )}
          {openedChildNode && openedChildNode.type === 'panel' && (
            <FolderView 
              parentId={openedChildNode.id} 
              onNodePress={handleChildPress}
            />
          )}
          {openedChildNode && openedChildNode.type === 'text' && (
            <TextEditor nodeId={openedChildNode.id} />
          )}
        </View>
      </View>

      {/* Context Menu */}
      <NodeContextMenu
        visible={contextMenuVisible}
        onClose={() => setContextMenuVisible(false)}
        onEdit={handleContextMenuEdit}
        onCreateChild={isRootNodeForMenu ? handleContextMenuCreateChild : undefined}
        onDelete={handleContextMenuDelete}
        position={contextMenuPosition}
        isRoot={isRootNodeForMenu}
      />

      {/* Create Node Modal */}
      <CreateNodeModal
        visible={createModalVisible}
        parentId={createModalParentId}
        onClose={() => setCreateModalVisible(false)}
        onNodeCreated={handleNodeCreated}
      />

      {/* Icon Change Modal */}
      <IconChangeModal
        visible={iconChangeModalVisible}
        node={nodeToEdit}
        onClose={() => {
          setIconChangeModalVisible(false);
          setNodeToEdit(null);
        }}
        onIconChanged={handleIconChanged}
      />

      {/* Floating dragged icon */}
      {draggedNode && (
        <Animated.View
          style={[
            styles.floatingIcon,
            {
              left: dragPosition.x - 50, // Center icon on pointer (icon is 100px wide)
              top: dragPosition.y - 50, // Center icon on pointer (icon is 100px tall)
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.floatingIconContainer}>
            <LucideIcon
              iconName={draggedNode.style?.icon}
              size={40}
              color={SciFiTheme.colors.neonCyan}
            />
            <Text style={styles.floatingIconTitle} numberOfLines={2}>
              {draggedNode.title}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SciFiTheme.colors.bgPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SciFiTheme.colors.bgPrimary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 120,
    borderBottomWidth: 1,
    borderBottomColor: SciFiTheme.colors.borderDim,
    backgroundColor: SciFiTheme.colors.bgSecondary,
    padding: 8,
    gap: 8,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  contentArea: {
    flex: 1,
    backgroundColor: SciFiTheme.colors.bgPrimary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: SciFiTheme.colors.textSecondary,
    textAlign: 'center',
  },
  floatingIcon: {
    position: 'absolute',
    width: 100,
    height: 100,
    zIndex: 10000,
    elevation: 10000, // Android
    pointerEvents: 'none',
  },
  floatingIconContainer: {
    flex: 1,
    backgroundColor: SciFiTheme.colors.bgSecondary,
    borderWidth: 1,
    borderColor: SciFiTheme.colors.borderPrimary,
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SciFiTheme.effects.glow,
    opacity: 0.9,
    transform: [{ scale: 1.1 }],
  },
  floatingIconTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: SciFiTheme.colors.neonCyan,
    textAlign: 'center',
    width: '100%',
  },
});

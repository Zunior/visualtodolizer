import pb, { Node } from '@/lib/pocketbase';
import { SciFiTheme } from '@/constants/scifiTheme';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DeleteConfirmModal from './DeleteConfirmModal';
import DraggableNode from './DraggableNode';
import IconChangeModal from './IconChangeModal';
import MoveToParentBox from './MoveToParentBox';
import NodeContextMenu from './NodeContextMenu';
import SciFiBackground from './SciFiBackground';
import TextEditor from './TextEditor';

interface FolderViewProps {
    parentId: string;
}

export default function FolderView({ parentId }: FolderViewProps) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTextNodeId, setSelectedTextNodeId] = useState<string | null>(null);
    const [modalSize, setModalSize] = useState({ width: 0, height: 0 });
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedNodeForMenu, setSelectedNodeForMenu] = useState<Node | null>(null);
    const [iconChangeModalVisible, setIconChangeModalVisible] = useState(false);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [deleteConfirmMessage, setDeleteConfirmMessage] = useState('');
    const [nodeToDelete, setNodeToDelete] = useState<Node | null>(null);
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const [draggingNodePosition, setDraggingNodePosition] = useState<{ x: number; y: number } | null>(null);
    const [hoveringParentBox, setHoveringParentBox] = useState(false);
    const router = useRouter();

    // We need a large canvas for dragging.
    const canvasHeight = Math.max(Dimensions.get('window').height, 1000);

    const fetchNodes = async () => {
        setLoading(true);
        try {
            const filter = parentId === 'root' ? 'parent = ""' : `parent = "${parentId}"`;
            const records = await pb.collection('nodes').getList<Node>(1, 50, {
                filter: filter,
                sort: '-created',
            });
            setNodes(records.items);
        } catch (e) {
            console.error("Error fetching nodes:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (id: string) => {
        setDraggingNodeId(id);
    };

    const handleDragUpdate = (id: string, x: number, y: number) => {
        if (draggingNodeId === id) {
            setDraggingNodePosition({ x, y });
            
            // Check if dragging node is over the parent box area (upper center)
            // Parent box is at top center, approximately: x: screenWidth/2 - 100, y: 20, width: 200, height: ~50
            const screenWidth = Dimensions.get('window').width;
            const boxLeft = screenWidth / 2 - 100;
            const boxRight = screenWidth / 2 + 100;
            const boxTop = 20;
            const boxBottom = 80; // Approximate height
            
            const isOverParentBox = (
                x < boxRight &&
                x + 128 > boxLeft && // NODE_SIZE = 128
                y < boxBottom &&
                y + 128 > boxTop
            );
            
            setHoveringParentBox(isOverParentBox);
        }
    };

    const handleDragEnd = (id: string) => {
        if (draggingNodeId === id) {
            setDraggingNodeId(null);
            setDraggingNodePosition(null);
            setHoveringParentBox(false);
        }
    };

    const moveNodeToParent = async (nodeId: string) => {
        try {
            const node = nodes.find(n => n.id === nodeId);
            if (!node) return;
            
            // Move the node to the parent of the current view
            // If parentId is 'root', move to root (empty string)
            // Otherwise, get the parent of the current canvas
            let newParentId = '';
            if (parentId !== 'root') {
                try {
                    const currentCanvas = await pb.collection('nodes').getOne<Node>(parentId);
                    newParentId = currentCanvas.parent || '';
                } catch (e) {
                    console.error('Error getting current canvas parent:', e);
                    newParentId = '';
                }
            }
            
            // Update the node's parent
            await pb.collection('nodes').update(nodeId, {
                parent: newParentId,
                style: {
                    ...node.style,
                    x: 0, // Reset position to 0,0 in parent
                    y: 0,
                }
            });
            
            // Refresh nodes to reflect the change
            await fetchNodes();
        } catch (e) {
            console.error("Error moving node to parent:", e);
            Alert.alert('Error', 'Failed to move node to parent');
        }
    };

    const moveNodeToCanvas = async (nodeId: string, targetCanvasId: string) => {
        try {
            // Update the node's parent to the target canvas
            await pb.collection('nodes').update(nodeId, {
                parent: targetCanvasId,
                style: {
                    ...nodes.find(n => n.id === nodeId)?.style,
                    x: 0, // Reset position to 0,0 in new canvas
                    y: 0,
                }
            });
            
            // Refresh nodes to reflect the change
            await fetchNodes();
        } catch (e) {
            console.error("Error moving node to canvas:", e);
            Alert.alert('Error', 'Failed to move node to canvas');
        }
    };

    const updateNodePosition = async (id: string, x: number, y: number) => {
        try {
            // Optimistic update locally
            setNodes(prev => prev.map(n => n.id === id ? { ...n, style: { ...n.style, x, y } } : n));

            // Persist to DB
            const node = nodes.find(n => n.id === id);
            if (node) {
                await pb.collection('nodes').update(id, {
                    style: { ...node.style, x, y }
                });
            }
        } catch (e) {
            console.error("Error updating position:", e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchNodes();
        }, [parentId])
    );

    const handlePress = (node: Node) => {
        if (node.type === 'panel') {
            router.push(`/folder/${node.id}`);
        } else if (node.type === 'text') {
            setSelectedTextNodeId(node.id);
        }
    };

    const handleLongPress = (node: Node, position: { x: number; y: number }) => {
        setSelectedNodeForMenu(node);
        setContextMenuPosition(position);
        setContextMenuVisible(true);
    };

    const checkNodeHasChildren = async (nodeId: string): Promise<boolean> => {
        try {
            const children = await pb.collection('nodes').getList(1, 1, {
                filter: `parent = "${nodeId}"`,
            });
            return children.items.length > 0;
        } catch (e) {
            console.error('Error checking for children:', e);
            return false;
        }
    };

    const handleDelete = async () => {
        if (!selectedNodeForMenu) {
            return;
        }

        // Save reference before closing menu
        const node = selectedNodeForMenu;
        
        // Close the context menu Modal first
        setContextMenuVisible(false);
        setSelectedNodeForMenu(null);
        
        // Wait a bit for Modal to close
        await new Promise(resolve => setTimeout(resolve, 200));

        // Check if it's a canvas node with children
        if (node.type === 'panel') {
            const hasChildren = await checkNodeHasChildren(node.id);
            if (hasChildren) {
                setNodeToDelete(node);
                setDeleteConfirmMessage('This canvas is not empty. Deleting it will also delete all items inside. Are you sure you want to continue?');
                setDeleteConfirmVisible(true);
                return;
            }
        }

        // For text nodes or empty canvas nodes, show confirmation
        setNodeToDelete(node);
        setDeleteConfirmMessage(`Are you sure you want to delete "${node.title}"?`);
        setDeleteConfirmVisible(true);
    };

    const handleDeleteConfirm = () => {
        if (!nodeToDelete) {
            return;
        }
        setDeleteConfirmVisible(false);
        performDelete(nodeToDelete.id).catch(err => {
            console.error('performDelete threw error:', err);
        });
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmVisible(false);
        setNodeToDelete(null);
    };

    const performDelete = async (nodeId: string) => {
        try {
            // First, delete all children recursively
            const children = await pb.collection('nodes').getList<Node>(1, 100, {
                filter: `parent = "${nodeId}"`,
            });

            for (const child of children.items) {
                // Recursively delete children
                await performDelete(child.id);
            }

            // Then delete the node itself
            await pb.collection('nodes').delete(nodeId);
            
            // Refresh the nodes list
            await fetchNodes();
            setSelectedNodeForMenu(null);
        } catch (e: any) {
            console.error('Error deleting node:', e);
            Alert.alert('Error', `Failed to delete node: ${e.message || 'Unknown error'}`);
        }
    };

    const handleChangeIcon = () => {
        // Close the context menu but keep selectedNodeForMenu for the modal
        setContextMenuVisible(false);
        // Use a small delay to ensure the context menu closes before opening the icon change modal
        // This prevents React Native from trying to render two modals simultaneously
        setTimeout(() => {
            setIconChangeModalVisible(true);
        }, 200);
    };

    const handleIconChanged = () => {
        fetchNodes();
        setIconChangeModalVisible(false);
        setSelectedNodeForMenu(null);
    };

    return (
        <SciFiBackground>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ minHeight: canvasHeight, position: 'relative' }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNodes} tintColor={SciFiTheme.colors.neonCyan} />}
            >
                <MoveToParentBox visible={draggingNodeId !== null} hasHover={hoveringParentBox} />
                
                {nodes.map((node) => (
                    <DraggableNode
                        key={node.id}
                        node={node}
                        otherNodes={nodes}
                        draggingNodeId={draggingNodeId}
                        draggingNodePosition={draggingNodePosition}
                        hoveringParentBox={hoveringParentBox && draggingNodeId === node.id}
                        onDragStart={handleDragStart}
                        onDragUpdate={handleDragUpdate}
                        onDragEnd={async (id, x, y, targetCanvasId) => {
                            handleDragEnd(id);
                            
                            // If hovering over parent box, move to parent
                            if (hoveringParentBox) {
                                await moveNodeToParent(id);
                            }
                            // If dropped over a canvas, move the node into that canvas
                            else if (targetCanvasId) {
                                await moveNodeToCanvas(id, targetCanvasId);
                            } else {
                                // Otherwise, just update position
                                await updateNodePosition(id, x, y);
                            }
                        }}
                        onPress={handlePress}
                        onLongPress={handleLongPress}
                    />
                ))}

                <View style={styles.addButtonContainer}>
                    <Pressable
                        onPress={() => router.push(`/modal?parentId=${parentId}`)}
                        style={styles.addButton}
                    >
                        <Ionicons name="add" size={28} color={SciFiTheme.colors.neonCyan} />
                    </Pressable>
                </View>
            </ScrollView>

            <Modal
                visible={selectedTextNodeId !== null}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setSelectedTextNodeId(null)}
            >
                <Pressable
                    style={{ flex: 1, backgroundColor: SciFiTheme.colors.overlay, justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => setSelectedTextNodeId(null)}
                >
                    <Pressable
                        style={{
                            width: modalSize.width > 0 ? modalSize.width + 32 : Dimensions.get('window').width * 0.8,
                            height: modalSize.height > 0 ? modalSize.height + 100 : Dimensions.get('window').height * 0.8,
                            maxWidth: Dimensions.get('window').width - 40,
                            maxHeight: Dimensions.get('window').height - 40,
                        }}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {selectedTextNodeId && (
                            <TextEditor
                                nodeId={selectedTextNodeId}
                                onClose={() => {
                                    setSelectedTextNodeId(null);
                                    setModalSize({ width: 0, height: 0 });
                                }}
                                onSizeChange={(width, height) => setModalSize({ width, height })}
                            />
                        )}
                    </Pressable>
                </Pressable>
            </Modal>

            <NodeContextMenu
                visible={contextMenuVisible}
                onClose={() => {
                    setContextMenuVisible(false);
                    setSelectedNodeForMenu(null);
                }}
                onDelete={handleDelete}
                onChangeIcon={handleChangeIcon}
                position={contextMenuPosition}
            />

            {selectedNodeForMenu && (
                <IconChangeModal
                    visible={iconChangeModalVisible}
                    node={selectedNodeForMenu}
                    onClose={() => {
                        setIconChangeModalVisible(false);
                        setSelectedNodeForMenu(null);
                    }}
                    onIconChanged={handleIconChanged}
                />
            )}

            <DeleteConfirmModal
                visible={deleteConfirmVisible}
                title={nodeToDelete?.type === 'panel' ? 'Warning' : 'Delete Node'}
                message={deleteConfirmMessage}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
            />
        </SciFiBackground>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    addButtonContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 1000,
    },
    addButton: {
        width: 50,
        height: 50,
        borderRadius: 4,
        backgroundColor: SciFiTheme.colors.bgSecondary,
        borderWidth: 1,
        borderColor: SciFiTheme.colors.borderPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        ...SciFiTheme.effects.glow,
    },
});

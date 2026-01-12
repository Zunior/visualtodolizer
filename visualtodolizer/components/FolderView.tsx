import pb, { Node } from '@/lib/pocketbase';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import DeleteConfirmModal from './DeleteConfirmModal';
import DraggableNode from './DraggableNode';
import IconChangeModal from './IconChangeModal';
import NodeContextMenu from './NodeContextMenu';
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
        setContextMenuVisible(false);
        setIconChangeModalVisible(true);
    };

    const handleIconChanged = () => {
        fetchNodes();
        setIconChangeModalVisible(false);
        setSelectedNodeForMenu(null);
    };

    return (
        <ScrollView
            className="flex-1"
            style={{ backgroundColor: '#B0FFFA' }}
            contentContainerStyle={{ minHeight: canvasHeight, position: 'relative' }}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNodes} />}
        >


            {nodes.map((node) => (
                <DraggableNode
                    key={node.id}
                    node={node}
                    onDragEnd={updateNodePosition}
                    onPress={handlePress}
                    onLongPress={handleLongPress}
                />
            ))}

            <View style={{ position: 'absolute', top: 20, left: 20, zIndex: 1000 }}>
                <Pressable
                    onPress={() => router.push(`/modal?parentId=${parentId}`)}
                    style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: '#3b82f6',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                    }}
                >
                    <Text style={{ color: 'white', fontSize: 30, marginTop: -2 }}>+</Text>
                </Pressable>
            </View>

            <Modal
                visible={selectedTextNodeId !== null}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setSelectedTextNodeId(null)}
            >
                <Pressable
                    style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}
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
        </ScrollView>
    );
}

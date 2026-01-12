import pb, { Node } from '@/lib/pocketbase';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Dimensions, Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import DraggableNode from './DraggableNode';
import TextEditor from './TextEditor';

interface FolderViewProps {
    parentId: string;
}

export default function FolderView({ parentId }: FolderViewProps) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTextNodeId, setSelectedTextNodeId] = useState<string | null>(null);
    const [modalSize, setModalSize] = useState({ width: 0, height: 0 });
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
        </ScrollView>
    );
}

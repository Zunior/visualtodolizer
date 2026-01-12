import pb, { Node } from '@/lib/pocketbase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Pressable, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface TextEditorProps {
    nodeId: string;
    initialContent?: string;
    onClose?: () => void;
    onSizeChange?: (width: number, height: number) => void;
}

export default function TextEditor({ nodeId, initialContent, onClose, onSizeChange }: TextEditorProps) {
    const [content, setContent] = useState(initialContent || '');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    
    // Get window dimensions
    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;
    
    // Initial size: half window width and half window height
    const initialWidth = onClose ? windowWidth * 0.8 : windowWidth / 2;
    const initialHeight = onClose ? windowHeight * 0.8 : windowHeight / 2;
    
    // Resizable dimensions
    const width = useSharedValue(initialWidth);
    const height = useSharedValue(initialHeight);
    
    // Notify parent of initial size
    useEffect(() => {
        if (onSizeChange) {
            onSizeChange(initialWidth, initialHeight);
        }
    }, []);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            try {
                const node = await pb.collection('nodes').getOne<Node>(nodeId);
                setContent(node.content || '');
            } catch (e) {
                console.error('Error fetching node:', e);
                Alert.alert('Error', 'Failed to load content');
            } finally {
                setLoading(false);
            }
        };

        if (!initialContent) {
            fetchContent();
        } else {
            setLoading(false);
        }
    }, [nodeId, initialContent]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await pb.collection('nodes').update(nodeId, { content });
            if (onClose) {
                onClose();
            } else {
                Alert.alert('Success', 'Content saved successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (e) {
            console.error('Error saving:', e);
            Alert.alert('Error', 'Failed to save content. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Resize gesture
    const startWidth = useSharedValue(initialWidth);
    const startHeight = useSharedValue(initialHeight);
    
    const resizeGesture = Gesture.Pan()
        .onStart(() => {
            startWidth.value = width.value;
            startHeight.value = height.value;
        })
        .onUpdate((event) => {
            const newWidth = Math.max(200, Math.min(windowWidth - 20, startWidth.value + event.translationX));
            const newHeight = Math.max(150, Math.min(windowHeight - 100, startHeight.value + event.translationY));
            width.value = newWidth;
            height.value = newHeight;
            if (onSizeChange) {
                onSizeChange(newWidth, newHeight);
            }
        });

    const textBoxStyle = useAnimatedStyle(() => ({
        width: width.value,
        height: height.value,
    }));

    if (loading) {
        return (
            <View className="flex-1 p-4 items-center justify-center" style={{ backgroundColor: '#B0FFFA' }}>
                <Text className="text-lg text-gray-500 dark:text-gray-400">Loading...</Text>
            </View>
        );
    }

    if (onClose) {
        // Modal mode: textbox fills the container, container resizes
        return (
            <Animated.View style={[{ width: '100%', height: '100%', backgroundColor: '#B0FFFA', borderRadius: 12, padding: 16 }, textBoxStyle]}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
                    <Pressable
                        onPress={onClose}
                        style={{
                            padding: 8,
                            borderRadius: 20,
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        <Ionicons name="close" size={24} color="#000" />
                    </Pressable>
                </View>
                <View style={{ flex: 1, marginBottom: 10, position: 'relative' }}>
                    <TextInput
                        className="text-lg text-black border border-gray-300 rounded-md"
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            padding: 16,
                            paddingRight: 40,
                            backgroundColor: '#FFFFFF',
                            color: '#000000',
                        }}
                        multiline
                        value={content}
                        onChangeText={setContent}
                        textAlignVertical="top"
                        placeholder="Enter your text here..."
                        placeholderTextColor="#9CA3AF"
                    />
                    <GestureDetector gesture={resizeGesture}>
                        <Animated.View
                            style={{
                                position: 'absolute',
                                bottom: 2,
                                right: 2,
                                width: 20,
                                height: 20,
                                backgroundColor: '#3b82f6',
                                borderBottomRightRadius: 4,
                                borderTopLeftRadius: 4,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <View
                                style={{
                                    width: 0,
                                    height: 0,
                                    borderLeftWidth: 5,
                                    borderLeftColor: 'transparent',
                                    borderBottomWidth: 5,
                                    borderBottomColor: 'white',
                                }}
                            />
                        </Animated.View>
                    </GestureDetector>
                </View>
                <View style={{ alignSelf: 'center' }}>
                    <Pressable
                        onPress={handleSave}
                        disabled={saving || loading}
                        style={{
                            backgroundColor: saving ? '#9CA3AF' : '#3b82f6',
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                            borderRadius: 8,
                            minWidth: 100,
                        }}
                    >
                        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
                            {saving ? "Saving..." : "Save"}
                        </Text>
                    </Pressable>
                </View>
            </Animated.View>
        );
    }

    // Non-modal mode: original layout
    return (
        <View className="flex-1 p-4" style={{ backgroundColor: '#B0FFFA', borderRadius: 12 }}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Animated.View style={[{ position: 'relative' }, textBoxStyle]}>
                    <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <TextInput
                            className="text-lg text-black border border-gray-300 rounded-md"
                            style={{ 
                                width: '100%', 
                                height: '100%', 
                                padding: 16,
                                paddingRight: 40,
                                backgroundColor: '#FFFFFF',
                                color: '#000000',
                            }}
                            multiline
                            value={content}
                            onChangeText={setContent}
                            textAlignVertical="top"
                            placeholder="Enter your text here..."
                            placeholderTextColor="#9CA3AF"
                        />
                        <GestureDetector gesture={resizeGesture}>
                            <Animated.View
                                style={{
                                    position: 'absolute',
                                    bottom: 2,
                                    right: 2,
                                    width: 20,
                                    height: 20,
                                    backgroundColor: '#3b82f6',
                                    borderBottomRightRadius: 4,
                                    borderTopLeftRadius: 4,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <View
                                    style={{
                                        width: 0,
                                        height: 0,
                                        borderLeftWidth: 5,
                                        borderLeftColor: 'transparent',
                                        borderBottomWidth: 5,
                                        borderBottomColor: 'white',
                                    }}
                                />
                            </Animated.View>
                        </GestureDetector>
                    </View>
                </Animated.View>
            </View>
            <View className="mt-4" style={{ alignSelf: 'center', marginBottom: 10 }}>
                <Pressable
                    onPress={handleSave}
                    disabled={saving || loading}
                    style={{
                        backgroundColor: saving ? '#9CA3AF' : '#3b82f6',
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        borderRadius: 8,
                        minWidth: 100,
                    }}
                >
                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
                        {saving ? "Saving..." : "Save"}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

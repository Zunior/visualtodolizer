import pb, { Node } from '@/lib/pocketbase';
import { SciFiTheme } from '@/constants/scifiTheme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

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

    const copyButtonScale = useSharedValue(1);
    const copyButtonOpacity = useSharedValue(1);

    const handleCopy = async () => {
        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        // Visual feedback animation
        copyButtonScale.value = withSequence(
            withTiming(0.9, { duration: 100 }),
            withTiming(1, { duration: 100 })
        );
        copyButtonOpacity.value = withSequence(
            withTiming(0.6, { duration: 100 }),
            withTiming(1, { duration: 100 })
        );

        try {
            await Clipboard.setStringAsync(content);
            Alert.alert('Success', 'Text copied to clipboard');
        } catch (e) {
            console.error('Error copying to clipboard:', e);
            Alert.alert('Error', 'Failed to copy text to clipboard');
        }
    };

    const copyButtonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: copyButtonScale.value }],
        opacity: copyButtonOpacity.value,
    }));

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
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    if (onClose) {
        // Modal mode: textbox fills the container, container resizes
        return (
            <Animated.View style={[styles.modalContainer, textBoxStyle]}>
                <View style={styles.closeButtonContainer}>
                    <Animated.View style={copyButtonAnimatedStyle}>
                        <Pressable
                            onPress={handleCopy}
                            style={styles.copyButton}
                        >
                            <Ionicons name="copy-outline" size={24} color={SciFiTheme.colors.neonCyan} />
                        </Pressable>
                    </Animated.View>
                    <Pressable
                        onPress={onClose}
                        style={styles.closeButton}
                    >
                        <Ionicons name="close" size={24} color={SciFiTheme.colors.neonCyan} />
                    </Pressable>
                </View>
                <View style={styles.textInputContainer}>
                    <TextInput
                        style={styles.textInput}
                        multiline
                        value={content}
                        onChangeText={setContent}
                        textAlignVertical="top"
                        placeholder="Enter your text here..."
                        placeholderTextColor={SciFiTheme.colors.textSecondary}
                    />
                    <GestureDetector gesture={resizeGesture}>
                        <Animated.View style={styles.resizeHandle}>
                            <View style={styles.resizeHandleIcon} />
                        </Animated.View>
                    </GestureDetector>
                </View>
                <View style={styles.saveButtonContainer}>
                    <Pressable
                        onPress={handleSave}
                        disabled={saving || loading}
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    >
                        <Text style={styles.saveButtonText}>
                            {saving ? "Saving..." : "Save"}
                        </Text>
                    </Pressable>
                </View>
            </Animated.View>
        );
    }

    // Non-modal mode: original layout
    return (
        <View style={styles.container}>
            <Animated.View style={[styles.copyButtonContainerNonModal, copyButtonAnimatedStyle]}>
                <Pressable
                    onPress={handleCopy}
                    style={styles.copyButton}
                >
                    <Ionicons name="copy-outline" size={24} color={SciFiTheme.colors.neonCyan} />
                </Pressable>
            </Animated.View>
            <View style={styles.contentContainer}>
                <Animated.View style={[styles.textBoxWrapper, textBoxStyle]}>
                    <View style={styles.textBoxInner}>
                        <TextInput
                            style={styles.textInput}
                            multiline
                            value={content}
                            onChangeText={setContent}
                            textAlignVertical="top"
                            placeholder="Enter your text here..."
                            placeholderTextColor={SciFiTheme.colors.textSecondary}
                        />
                        <GestureDetector gesture={resizeGesture}>
                            <Animated.View style={styles.resizeHandle}>
                                <View style={styles.resizeHandleIcon} />
                            </Animated.View>
                        </GestureDetector>
                    </View>
                </Animated.View>
            </View>
            <View style={styles.saveButtonContainer}>
                <Pressable
                    onPress={handleSave}
                    disabled={saving || loading}
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                >
                    <Text style={styles.saveButtonText}>
                        {saving ? "Saving..." : "Save"}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: SciFiTheme.colors.bgPrimary,
    },
    loadingText: {
        fontSize: 18,
        color: SciFiTheme.colors.textSecondary,
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: SciFiTheme.colors.bgPrimary,
        borderRadius: 4,
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: SciFiTheme.colors.bgSecondary,
        borderWidth: 1,
        borderColor: SciFiTheme.colors.borderPrimary,
        borderRadius: 4,
        padding: 16,
        ...SciFiTheme.effects.glow,
    },
    closeButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    copyButtonContainerNonModal: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    closeButton: {
        padding: 8,
        borderRadius: 4,
        backgroundColor: SciFiTheme.colors.bgTertiary,
        borderWidth: 1,
        borderColor: SciFiTheme.colors.borderDim,
    },
    copyButton: {
        padding: 8,
        borderRadius: 4,
        backgroundColor: SciFiTheme.colors.bgTertiary,
        borderWidth: 1,
        borderColor: SciFiTheme.colors.borderDim,
    },
    textInputContainer: {
        flex: 1,
        marginBottom: 10,
        position: 'relative',
    },
    textBoxWrapper: {
        position: 'relative',
    },
    textBoxInner: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    textInput: {
        width: '100%',
        height: '100%',
        padding: 16,
        paddingRight: 40,
        backgroundColor: SciFiTheme.colors.bgTertiary,
        borderWidth: 1,
        borderColor: SciFiTheme.colors.borderDim,
        borderRadius: 4,
        color: SciFiTheme.colors.textPrimary,
        fontSize: 16,
    },
    resizeHandle: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 20,
        height: 20,
        backgroundColor: SciFiTheme.colors.bgSecondary,
        borderWidth: 1,
        borderColor: SciFiTheme.colors.borderPrimary,
        borderBottomRightRadius: 4,
        borderTopLeftRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resizeHandleIcon: {
        width: 0,
        height: 0,
        borderLeftWidth: 5,
        borderLeftColor: 'transparent',
        borderBottomWidth: 5,
        borderBottomColor: SciFiTheme.colors.neonCyan,
    },
    saveButtonContainer: {
        alignSelf: 'center',
        marginBottom: 10,
    },
    saveButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: SciFiTheme.colors.borderPrimary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 4,
        minWidth: 100,
        ...SciFiTheme.effects.glow,
    },
    saveButtonDisabled: {
        borderColor: SciFiTheme.colors.borderDim,
        opacity: 0.5,
    },
    saveButtonText: {
        color: SciFiTheme.colors.neonCyan,
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 16,
    },
});

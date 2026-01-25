import { Node, getNode, updateNode } from '@/lib/firestore';
import { SciFiTheme } from '@/constants/scifiTheme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
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

// Helper function to parse text and find Windows paths and URLs
interface TextSegment {
    text: string;
    type: 'text' | 'url' | 'path';
    value: string;
}

function parseTextForLinks(text: string): TextSegment[] {
    const segments: TextSegment[] = [];
    // Regex for Windows paths (C:\..., \\server\..., etc.)
    const windowsPathRegex = /([A-Za-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*)|(\\\\[^\\/:*?"<>|\r\n]+(?:\\[^\\/:*?"<>|\r\n]+)*)/g;
    // Regex for URLs (http://, https://, ftp://, etc.)
    const urlRegex = /(https?:\/\/[^\s]+|ftp:\/\/[^\s]+)/gi;
    
    let lastIndex = 0;
    const matches: Array<{ start: number; end: number; type: 'url' | 'path'; value: string }> = [];
    
    // Find all Windows paths
    let match;
    while ((match = windowsPathRegex.exec(text)) !== null) {
        matches.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'path',
            value: match[0],
        });
    }
    
    // Find all URLs
    while ((match = urlRegex.exec(text)) !== null) {
        matches.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'url',
            value: match[0],
        });
    }
    
    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);
    
    // Remove overlapping matches (prefer URLs over paths)
    const filteredMatches: typeof matches = [];
    for (const currentMatch of matches) {
        const overlaps = filteredMatches.some(
            existing => currentMatch.start < existing.end && currentMatch.end > existing.start
        );
        if (!overlaps) {
            filteredMatches.push(currentMatch);
        }
    }
    
    // Build segments
    for (const match of filteredMatches) {
        if (match.start > lastIndex) {
            segments.push({
                text: text.substring(lastIndex, match.start),
                type: 'text',
                value: '',
            });
        }
        segments.push({
            text: text.substring(match.start, match.end),
            type: match.type,
            value: match.value,
        });
        lastIndex = match.end;
    }
    
    if (lastIndex < text.length) {
        segments.push({
            text: text.substring(lastIndex),
            type: 'text',
            value: '',
        });
    }
    
    return segments.length > 0 ? segments : [{ text, type: 'text', value: '' }];
}

// Component to render text with clickable links
function LinkedText({ content, style }: { content: string; style: any }) {
    const segments = parseTextForLinks(content);
    
    const handleLinkPress = async (value: string, type: 'url' | 'path', event?: any) => {
        // Stop propagation to prevent triggering edit mode when clicking URLs
        if (event) {
            event.stopPropagation?.();
        }
        
        // Only handle URLs, paths are not clickable
        if (type === 'url') {
            try {
                await Linking.openURL(value);
            } catch (e) {
                console.error('Error opening URL:', e);
                Alert.alert('Error', 'Failed to open URL');
            }
        }
    };
    
    return (
        <Text style={style} selectable>
            {segments.map((segment, index) => {
                if (segment.type === 'text') {
                    return <Text key={index}>{segment.text}</Text>;
                } else if (segment.type === 'url') {
                    // URLs are clickable (regular click, no Ctrl needed)
                    return (
                        <Text
                            key={index}
                            style={{ 
                                textDecorationLine: 'underline', 
                                color: SciFiTheme.colors.neonCyan,
                                ...(Platform.OS === 'web' && { cursor: 'pointer' }), // Hand cursor for URLs
                            }}
                            onPress={(e) => {
                                e?.stopPropagation?.();
                                handleLinkPress(segment.value, segment.type, e);
                            }}
                        >
                            {segment.text}
                        </Text>
                    );
                } else {
                    // Windows paths are underlined but not clickable
                    return (
                        <Text
                            key={index}
                            style={{ 
                                textDecorationLine: 'underline', 
                                color: SciFiTheme.colors.neonCyan,
                            }}
                        >
                            {segment.text}
                        </Text>
                    );
                }
            })}
        </Text>
    );
}

export default function TextEditor({ nodeId, initialContent, onClose, onSizeChange }: TextEditorProps) {
    const [content, setContent] = useState(initialContent || '');
    const [savedContent, setSavedContent] = useState(initialContent || '');
    const [isEditing, setIsEditing] = useState(!initialContent); // Start editing if no content
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
                const node = await getNode(nodeId);
                const fetchedContent = node.content || '';
                setContent(fetchedContent);
                setSavedContent(fetchedContent);
                setIsEditing(!fetchedContent); // Edit mode if no content, view mode if content exists
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
            setSavedContent(initialContent);
            setIsEditing(!initialContent); // Edit mode if no content, view mode if content exists
        }
    }, [nodeId, initialContent]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateNode(nodeId, { content });
            setSavedContent(content);
            setIsEditing(false);
            if (onClose) {
                onClose();
            } else {
                Alert.alert('Success', 'Content saved successfully');
            }
        } catch (e: any) {
            console.error('Error saving:', e);
            Alert.alert('Error', e.message || 'Failed to save content. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Save without closing or navigating (used when exiting edit by clicking outside)
    const handleSaveStay = async () => {
        setSaving(true);
        try {
            await updateNode(nodeId, { content });
            setSavedContent(content);
            setIsEditing(false);
        } catch (e: any) {
            console.error('Error saving:', e);
            Alert.alert('Error', e.message || 'Failed to save content. Please try again.');
        } finally {
            setSaving(false);
        }
    };
    
    const handleEdit = () => {
        setIsEditing(true);
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
                {isEditing && (
                    <TouchableWithoutFeedback onPress={handleSaveStay}>
                        <View style={StyleSheet.absoluteFill} />
                    </TouchableWithoutFeedback>
                )}
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
                        {isEditing ? (
                            <TextInput
                                style={styles.textInput}
                                multiline
                                value={content}
                                onChangeText={setContent}
                                onBlur={handleSaveStay}
                                textAlignVertical="top"
                                placeholder="Enter your text here..."
                                placeholderTextColor={SciFiTheme.colors.textSecondary}
                            />
                        ) : (
                            <Pressable 
                                style={styles.textDisplay}
                                onPress={handleEdit}
                                {...(Platform.OS === 'web' && {
                                    onMouseDown: (e) => {
                                        e.preventDefault();
                                        handleEdit();
                                    }
                                })}
                            >
                                <ScrollView style={{ flex: 1 }}>
                                    <LinkedText 
                                        content={savedContent || 'Click to edit...'} 
                                        style={styles.textDisplayContent}
                                    />
                                </ScrollView>
                            </Pressable>
                        )}
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
            {isEditing && (
                <TouchableWithoutFeedback onPress={handleSaveStay}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>
            )}
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
                            {isEditing ? (
                                <TextInput
                                    style={styles.textInput}
                                    multiline
                                    value={content}
                                    onChangeText={setContent}
                                    onBlur={handleSaveStay}
                                    textAlignVertical="top"
                                    placeholder="Enter your text here..."
                                    placeholderTextColor={SciFiTheme.colors.textSecondary}
                                />
                            ) : (
                                <Pressable 
                                    style={styles.textDisplay}
                                    onPress={handleEdit}
                                    {...(Platform.OS === 'web' && {
                                        onMouseDown: (e) => {
                                            e.preventDefault();
                                            handleEdit();
                                        }
                                    })}
                                >
                                    <ScrollView style={{ flex: 1 }}>
                                        <LinkedText 
                                            content={savedContent || 'Click to edit...'} 
                                            style={styles.textDisplayContent}
                                        />
                                    </ScrollView>
                                </Pressable>
                            )}
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
    textDisplay: {
        width: '100%',
        height: '100%',
        padding: 16,
        paddingRight: 40,
        backgroundColor: SciFiTheme.colors.bgTertiary,
        borderWidth: 1,
        borderColor: SciFiTheme.colors.borderDim,
        borderRadius: 4,
        ...(Platform.OS === 'web' && { cursor: 'text' }), // Edit cursor in view mode
    },
    textDisplayContent: {
        color: SciFiTheme.colors.textPrimary,
        fontSize: 16,
        lineHeight: 24,
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

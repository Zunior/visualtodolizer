import { Node } from '@/lib/pocketbase';
import { SciFiTheme } from '@/constants/scifiTheme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import LucideIcon from './LucideIcon';

interface DraggableNodeProps {
    node: Node;
    onDragEnd: (id: string, x: number, y: number) => void;
    onPress: (node: Node) => void;
    onLongPress: (node: Node, position: { x: number; y: number }) => void;
}

export default function DraggableNode({ node, onDragEnd, onPress, onLongPress }: DraggableNodeProps) {
    // Use existing coordinates or default to 0,0 (or maybe random/scattered in parent to avoid stack).
    // For now 0,0 if undefined.
    const startX = node.style?.x || 0;
    const startY = node.style?.y || 0;

    const translationX = useSharedValue(startX);
    const translationY = useSharedValue(startY);
    const isDragging = useSharedValue(false);

    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            runOnJS(onPress)(node);
        });

    const longPress = Gesture.LongPress()
        .minDuration(500)
        .onEnd((event) => {
            // Calculate screen position: node position + gesture position
            const screenX = startX + event.x;
            const screenY = startY + event.y;
            runOnJS(onLongPress)(node, { x: screenX, y: screenY });
        });

    const dragGesture = Gesture.Pan()
        .onStart(() => {
            isDragging.value = true;
        })
        .onUpdate((event) => {
            translationX.value = startX + event.translationX;
            translationY.value = startY + event.translationY;
        })
        .onEnd((event) => {
            isDragging.value = false;
            const finalX = startX + event.translationX;
            const finalY = startY + event.translationY;
            runOnJS(onDragEnd)(node.id, finalX, finalY);
        });

    const composedGesture = Gesture.Race(dragGesture, doubleTap, longPress);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translationX.value },
                { translateY: translationY.value },
                { scale: isDragging.value ? 1.1 : 1 },
            ],
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: isDragging.value ? 100 : 1,
        };
    });

    return (
        <GestureDetector gesture={composedGesture}>
            <Animated.View style={animatedStyle}>
                <View style={styles.nodeContainer}>
                    <View style={styles.nodeBorder}>
                        <View style={styles.nodeContent}>
                            <LucideIcon iconName={node.style?.icon} size={40} color={SciFiTheme.colors.neonCyan} />
                            <Text style={styles.nodeTitle} numberOfLines={1}>
                                {node.title}
                            </Text>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    nodeContainer: {
        width: 128,
        height: 128,
    },
    nodeBorder: {
        flex: 1,
        backgroundColor: SciFiTheme.colors.bgSecondary,
        borderWidth: 1,
        borderColor: SciFiTheme.colors.borderPrimary,
        borderRadius: 4,
        padding: 2,
        ...SciFiTheme.effects.glow,
    },
    nodeContent: {
        flex: 1,
        backgroundColor: SciFiTheme.colors.bgTertiary,
        borderRadius: 2,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
    },
    nodeTitle: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '600',
        color: SciFiTheme.colors.textPrimary,
        textAlign: 'center',
        width: '100%',
    },
});

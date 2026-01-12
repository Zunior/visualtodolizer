import { Node } from '@/lib/pocketbase';
import React from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import ShapeIcon from './ShapeIcon';

interface DraggableNodeProps {
    node: Node;
    onDragEnd: (id: string, x: number, y: number) => void;
    onPress: (node: Node) => void;
}

export default function DraggableNode({ node, onDragEnd, onPress }: DraggableNodeProps) {
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

    const composedGesture = Gesture.Race(dragGesture, doubleTap);

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
                <View className="bg-white dark:bg-gray-800 p-4 rounded-xl items-center justify-center shadow-sm w-32 h-32">
                    <ShapeIcon shape={node.style?.shape} color={node.style?.color} />
                    <Text className="mt-2 text-center font-medium text-gray-800 dark:text-gray-200" numberOfLines={1}>
                        {node.title}
                    </Text>
                </View>
            </Animated.View>
        </GestureDetector>
    );
}

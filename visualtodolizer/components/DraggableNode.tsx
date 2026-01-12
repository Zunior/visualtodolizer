import { Node } from '@/lib/pocketbase';
import { SciFiTheme } from '@/constants/scifiTheme';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import LucideIcon from './LucideIcon';
import LightningEffect from './LightningEffect';

interface DraggableNodeProps {
    node: Node;
    otherNodes: Node[];
    draggingNodeId: string | null;
    draggingNodePosition: { x: number; y: number } | null;
    hoveringParentBox: boolean;
    onDragStart: (id: string) => void;
    onDragUpdate: (id: string, x: number, y: number) => void;
    onDragEnd: (id: string, x: number, y: number, targetCanvasId?: string) => void;
    onPress: (node: Node) => void;
    onLongPress: (node: Node, position: { x: number; y: number }) => void;
}

const NODE_SIZE = 128; // Width and height of each node

export default function DraggableNode({ 
    node, 
    otherNodes, 
    draggingNodeId,
    draggingNodePosition,
    hoveringParentBox,
    onDragStart,
    onDragUpdate,
    onDragEnd, 
    onPress, 
    onLongPress 
}: DraggableNodeProps) {
    // Use existing coordinates or default to 0,0 (or maybe random/scattered in parent to avoid stack).
    // For now 0,0 if undefined.
    const startX = node.style?.x || 0;
    const startY = node.style?.y || 0;

    const translationX = useSharedValue(startX);
    const translationY = useSharedValue(startY);
    const isDragging = useSharedValue(false);
    const [hasCollision, setHasCollision] = useState(false);

    // Check collision with other nodes and return the overlapped node if it's a canvas
    const checkCollision = (x: number, y: number): { hasCollision: boolean; canvasNodeId: string | null } => {
        for (const otherNode of otherNodes) {
            if (otherNode.id === node.id) continue;
            
            // If this other node is being dragged, use its current position
            let otherX = otherNode.style?.x || 0;
            let otherY = otherNode.style?.y || 0;
            
            if (draggingNodeId === otherNode.id && draggingNodePosition) {
                otherX = draggingNodePosition.x;
                otherY = draggingNodePosition.y;
            }

            // Check if rectangles overlap
            if (
                x < otherX + NODE_SIZE &&
                x + NODE_SIZE > otherX &&
                y < otherY + NODE_SIZE &&
                y + NODE_SIZE > otherY
            ) {
                // If the overlapped node is a canvas (panel), return it
                if (otherNode.type === 'panel') {
                    return { hasCollision: true, canvasNodeId: otherNode.id };
                }
                return { hasCollision: true, canvasNodeId: null };
            }
        }
        return { hasCollision: false, canvasNodeId: null };
    };

    // Check if this node is being overlapped by the dragging node
    const isBeingOverlapped = (): { overlapped: boolean; isCanvas: boolean } => {
        if (!draggingNodeId || !draggingNodePosition || draggingNodeId === node.id) {
            return { overlapped: false, isCanvas: false };
        }

        const thisX = node.style?.x || 0;
        const thisY = node.style?.y || 0;
        const dragX = draggingNodePosition.x;
        const dragY = draggingNodePosition.y;

        const overlapped = (
            dragX < thisX + NODE_SIZE &&
            dragX + NODE_SIZE > thisX &&
            dragY < thisY + NODE_SIZE &&
            dragY + NODE_SIZE > thisY
        );

        return { overlapped, isCanvas: overlapped && node.type === 'panel' };
    };

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

    const [overlappedCanvasId, setOverlappedCanvasId] = useState<string | null>(null);
    const overlappedCanvasIdRef = React.useRef<string | null>(null);

    // Handler for drag end that captures the canvas ID (must be defined before dragGesture)
    const handleDragEndWithCanvas = (finalX: number, finalY: number) => {
        const canvasId = overlappedCanvasIdRef.current;
        setHasCollision(false);
        setOverlappedCanvasId(null);
        overlappedCanvasIdRef.current = null;
        onDragEnd(node.id, finalX, finalY, canvasId || undefined);
    };

    // Wrapper function to check collision and update state (must be defined before dragGesture)
    const checkCollisionAndUpdate = (x: number, y: number) => {
        const result = checkCollision(x, y);
        // Show collision if overlapping with another node OR hovering over parent box
        setHasCollision(result.hasCollision || (draggingNodeId === node.id && hoveringParentBox));
        setOverlappedCanvasId(result.canvasNodeId);
        overlappedCanvasIdRef.current = result.canvasNodeId;
        onDragUpdate(node.id, x, y);
    };

    // Update collision state when dragging node position changes (for non-dragging nodes)
    // Note: Non-dragging nodes should NOT show lightning, only visual border feedback
    React.useEffect(() => {
        if (draggingNodeId !== node.id && draggingNodePosition) {
            const result = isBeingOverlapped();
            // Don't show lightning on stationary nodes - only border feedback
            setHasCollision(false);
            // If this is a canvas being overlapped, highlight it differently
            if (result.isCanvas) {
                setOverlappedCanvasId(node.id);
                overlappedCanvasIdRef.current = node.id;
            } else {
                setOverlappedCanvasId(null);
                overlappedCanvasIdRef.current = null;
            }
        } else if (draggingNodeId !== node.id) {
            setHasCollision(false);
            setOverlappedCanvasId(null);
            overlappedCanvasIdRef.current = null;
        }
    }, [draggingNodePosition, draggingNodeId, hoveringParentBox]);

    const dragGesture = Gesture.Pan()
        .onStart(() => {
            isDragging.value = true;
            onDragStart(node.id);
        })
        .onUpdate((event) => {
            const newX = startX + event.translationX;
            const newY = startY + event.translationY;
            translationX.value = newX;
            translationY.value = newY;
            
            // Check for collisions on JS thread
            runOnJS(checkCollisionAndUpdate)(newX, newY);
        })
        .onEnd((event) => {
            isDragging.value = false;
            const finalX = startX + event.translationX;
            const finalY = startY + event.translationY;
            runOnJS(handleDragEndWithCanvas)(finalX, finalY);
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
                    <View style={[
                        styles.nodeBorder,
                        // Make panels circular, text nodes square
                        node.type === 'panel' && styles.nodeBorderCircle,
                        // Show collision border if this node is being dragged and colliding or hovering parent box
                        (draggingNodeId === node.id && (hasCollision || hoveringParentBox)) && styles.nodeBorderCollision,
                        // Show canvas target border if this is a canvas being overlapped (but not dragged)
                        overlappedCanvasId && node.type === 'panel' && draggingNodeId !== node.id && styles.nodeBorderCanvasTarget
                    ]}>
                        <View style={[
                            styles.nodeContent,
                            node.type === 'panel' && styles.nodeContentCircle
                        ]}>
                            <LucideIcon 
                                iconName={node.style?.icon} 
                                size={40} 
                                color={
                                    overlappedCanvasId && node.type === 'panel' && draggingNodeId !== node.id
                                        ? SciFiTheme.colors.neonGreen 
                                        : (draggingNodeId === node.id && (hasCollision || hoveringParentBox))
                                        ? SciFiTheme.colors.neonGreen 
                                        : SciFiTheme.colors.neonCyan
                                } 
                            />
                            <Text style={styles.nodeTitle} numberOfLines={1}>
                                {node.title}
                            </Text>
                        </View>
                    </View>
                    {/* Only show lightning on the node being dragged when it collides or hovers over parent box */}
                    {draggingNodeId === node.id && (hasCollision || hoveringParentBox) && <LightningEffect visible={true} />}
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
        borderRadius: 4, // Square for text nodes
        padding: 2,
        ...SciFiTheme.effects.glow,
    },
    nodeBorderCircle: {
        borderRadius: 64, // Half of NODE_SIZE (128) to make panels circular
    },
    nodeBorderCollision: {
        borderColor: SciFiTheme.colors.neonGreen,
        borderWidth: 2,
        ...SciFiTheme.effects.glowStrong,
    },
    nodeBorderCanvasTarget: {
        borderColor: SciFiTheme.colors.neonGreen,
        borderWidth: 3,
        borderStyle: 'dashed',
        ...SciFiTheme.effects.glowStrong,
    },
    nodeContent: {
        flex: 1,
        backgroundColor: SciFiTheme.colors.bgTertiary,
        borderRadius: 2, // Square inner content for text nodes
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
    },
    nodeContentCircle: {
        borderRadius: 62, // Slightly less than outer border to make panels circular
    },
    nodeTitle: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '600',
        color: SciFiTheme.colors.neonCyan,
        textAlign: 'center',
        width: '100%',
    },
});

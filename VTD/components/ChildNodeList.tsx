import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, ScrollView, View, LayoutChangeEvent } from 'react-native';
import { Node } from '@/lib/firestore';
import { SciFiTheme } from '@/constants/scifiTheme';
import DraggableNodeIcon from './DraggableNodeIcon';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, runOnUI } from 'react-native-reanimated';

type DragSource = 'root' | 'child' | null;

interface ChildNodeListProps {
  visible: boolean;
  childNodes: Node[];
  onChildPress: (node: Node) => void;
  onChildLongPress: (node: Node) => void;
  onOrderChange?: (newOrder: Node[]) => void;
  draggedNode?: Node | null;
  dragSource?: DragSource;
  onGlobalDragStart?: (node: Node, source: DragSource) => void;
  onGlobalDragEnd?: (dropTarget: 'root' | 'child' | 'none', targetNodeId?: string, absoluteX?: number, absoluteY?: number) => void;
  onDragPositionUpdate?: (x: number, y: number) => void;
  openedChildId?: string | null;
}

const ITEM_WIDTH = 100 + 12; // size + gap

interface AnimatedItemProps {
  node: Node;
  index: number;
  draggedIndex: number | null;
  targetIndex: number;
  onPress: () => void;
  onLongPress: () => void;
  onDragStart: (index: number) => void;
  onDrag: (index: number, translationX: number) => void;
  onDragEnd: (absoluteX?: number, absoluteY?: number) => void;
  onDragPositionUpdate?: (x: number, y: number) => void;
  isDragging: boolean;
  isSelected: boolean;
  swapAdjustment: number;
  finalTargetIndex?: number;
}

function AnimatedItem({
  node,
  index,
  draggedIndex,
  targetIndex,
  onPress,
  onLongPress,
  onDragStart,
  onDrag,
  onDragEnd,
  onDragPositionUpdate,
  isDragging,
  isSelected,
  swapAdjustment,
  finalTargetIndex,
}: AnimatedItemProps) {
  const translateX = useSharedValue(0);
  
  // When finalTargetIndex is set, animate to final position after drag ends
  React.useEffect(() => {
    if (finalTargetIndex !== undefined && !isDragging) {
      // Item is now at 'index' in array (after swap), needs to animate to finalTargetIndex
      // Since DraggableNodeIcon resets its translation to 0 on release,
      // the item is visually at its array position (index), so we animate from there
      const endOffset = (finalTargetIndex - index) * ITEM_WIDTH;
      translateX.value = withSpring(endOffset);
    } else if (!isDragging && finalTargetIndex === undefined) {
      translateX.value = 0;
    }
  }, [finalTargetIndex, isDragging, index, translateX]);
  
  const animatedStyle = useAnimatedStyle(() => {
    if (isDragging) {
      // During drag, let DraggableNodeIcon handle its own translation (follows pointer)
      // Parent just provides the container, no translation
      return { 
        transform: [{ translateX: 0 }],
      };
    }
    
    // After drag ends, if this was the dragged item, animate to final position
    if (finalTargetIndex !== undefined) {
      return {
        transform: [{ translateX: translateX.value }],
      };
    }
    
    // Other items move to make space
    const offset = (targetIndex - index) * ITEM_WIDTH;
    return {
      transform: [{ translateX: withSpring(offset) }],
    };
  });

  return (
    <Animated.View style={[styles.nodeWrapper, animatedStyle]}>
      <DraggableNodeIcon
        node={node}
        index={index}
        onPress={onPress}
        onLongPress={onLongPress}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        onDragPositionUpdate={onDragPositionUpdate}
        size={100}
        isVertical={false}
        isDragging={isDragging}
        swapAdjustment={0}
      />
    </Animated.View>
  );
}

const ChildNodeList = forwardRef<View, ChildNodeListProps>(({
  visible,
  childNodes,
  onChildPress,
  onChildLongPress,
  onOrderChange,
  draggedNode,
  dragSource,
  onGlobalDragStart,
  onGlobalDragEnd,
  onDragPositionUpdate,
  openedChildId,
}, ref) => {
  const [nodes, setNodes] = useState(childNodes);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [originalDraggedIndex, setOriginalDraggedIndex] = useState<number | null>(null);
  const [currentDraggedIndex, setCurrentDraggedIndex] = useState<number | null>(null);
  const nodesRef = useRef(childNodes);
  const containerRef = useRef<View>(null);
  const containerLayout = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  useImperativeHandle(ref, () => containerRef.current as View);

  // Track container layout for drop detection
  const handleLayout = (e: LayoutChangeEvent) => {
    containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      containerLayout.current = { x: pageX, y: pageY, width, height };
    });
  };

  // Update nodes when childNodes prop changes, but only if not currently dragging
  React.useEffect(() => {
    if (draggedNodeId === null) {
      setNodes(childNodes);
      nodesRef.current = childNodes;
    }
  }, [childNodes, draggedNodeId]);

  // Keep ref in sync with state
  React.useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  if (!visible) return null;

  const handleDragStart = (index: number) => {
    const node = nodes[index];
    setDraggedNodeId(node.id);
    setOriginalDraggedIndex(index);
    setCurrentDraggedIndex(index);
    // Notify global drag state
    if (onGlobalDragStart) {
      onGlobalDragStart(node, 'child');
    }
  };

  const handleDrag = (index: number, translationX: number) => {
    if (draggedNodeId === null || originalDraggedIndex === null) return;
    
    // Use ref to get latest nodes state (but don't modify it during drag)
    const currentNodes = nodesRef.current;
    
    // Calculate which index we're over based on translation from original position
    const targetIndex = Math.round(originalDraggedIndex + translationX / ITEM_WIDTH);
    const clampedIndex = Math.max(0, Math.min(targetIndex, currentNodes.length - 1));

    // Update the target index for visual feedback (but don't actually swap in array yet)
    if (clampedIndex !== currentDraggedIndex) {
      setCurrentDraggedIndex(clampedIndex);
    }
  };

  const handleDragEnd = (absoluteX?: number, absoluteY?: number) => {
    // Internal drag within child list - check this first
    if (draggedNodeId !== null && originalDraggedIndex !== null && currentDraggedIndex !== null) {
      // Check if drop is within this container (internal drag)
      const isInternalDrag = absoluteX !== undefined && absoluteY !== undefined && containerLayout.current
        ? (() => {
            const { x, y, width, height } = containerLayout.current!;
            return absoluteX >= x && absoluteX <= x + width && absoluteY >= y && absoluteY <= y + height;
          })()
        : true; // If no position info, assume internal drag
      
      if (isInternalDrag) {
        const currentNodes = nodesRef.current;
        const currentDraggedIdx = currentNodes.findIndex(n => n.id === draggedNodeId);
        
        if (currentDraggedIdx !== -1 && currentDraggedIndex !== currentDraggedIdx) {
          const newNodes = [...currentNodes];
          const [removed] = newNodes.splice(currentDraggedIdx, 1);
          newNodes.splice(currentDraggedIndex, 0, removed);
          setNodes(newNodes);
          nodesRef.current = newNodes;
          
          // Wait for animation to complete before clearing drag state and saving
          setTimeout(() => {
            if (onOrderChange) {
              onOrderChange(newNodes);
            }
            setDraggedNodeId(null);
            setOriginalDraggedIndex(null);
            setCurrentDraggedIndex(null);
            if (onGlobalDragEnd) {
              onGlobalDragEnd('none', undefined, absoluteX, absoluteY);
            }
          }, 400);
        } else {
          if (onOrderChange) {
            onOrderChange(currentNodes);
          }
          setDraggedNodeId(null);
          setOriginalDraggedIndex(null);
          setCurrentDraggedIndex(null);
          if (onGlobalDragEnd) {
            onGlobalDragEnd('none', undefined, absoluteX, absoluteY);
          }
        }
        return; // Internal drag handled, exit early
      }
    }

    // Cross-list drag handling
    // Check if this is a cross-list drag (root dropped on child)
    // According to requirements: root to child should return to initial position (do nothing)
    if (dragSource === 'root' && draggedNode && absoluteX !== undefined && absoluteY !== undefined && containerLayout.current) {
      const { x, y, width, height } = containerLayout.current;
      // Check if drop is within this container
      if (absoluteX >= x && absoluteX <= x + width && absoluteY >= y && absoluteY <= y + height) {
        // Root dropped on child list - return to initial position (do nothing)
        if (onGlobalDragEnd) {
          onGlobalDragEnd('none', undefined, absoluteX, absoluteY);
        }
        setDraggedNodeId(null);
        setOriginalDraggedIndex(null);
        setCurrentDraggedIndex(null);
        return;
      }
    }

    // If this is a child being dragged, check if it was dropped on root sidebar
    // (handled by main app component via onGlobalDragEnd with absolute position)
    if (dragSource === 'child' && draggedNode && absoluteX !== undefined && absoluteY !== undefined) {
      // Let the main app component check drop zones
      if (onGlobalDragEnd) {
        onGlobalDragEnd('none', undefined, absoluteX, absoluteY);
      }
      setDraggedNodeId(null);
      setOriginalDraggedIndex(null);
      setCurrentDraggedIndex(null);
      return;
    }

    // No valid drag or cross-list drag outside this list
    if (onGlobalDragEnd) {
      onGlobalDragEnd('none', undefined, absoluteX, absoluteY);
    }
    setDraggedNodeId(null);
    setOriginalDraggedIndex(null);
    setCurrentDraggedIndex(null);
  };

  return (
    <View style={styles.container} ref={containerRef} onLayout={handleLayout}>
      <ScrollView
        horizontal
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={draggedNodeId === null && !draggedNode} // Disable scroll when dragging
      >
        {nodes.map((node, index) => {
          const isDragging = draggedNodeId === node.id;
          
          // Find the original index of this node
          const originalIndex = childNodes.findIndex(n => n.id === node.id);
          const currentIndex = index;
          
          // Calculate target index for animation
          let targetIndex = currentIndex;
          let finalTargetIndex: number | undefined = undefined;
          
          if (draggedNodeId !== null && originalDraggedIndex !== null && currentDraggedIndex !== null) {
            if (isDragging) {
              // During drag, dragged item stays in place visually
              targetIndex = originalDraggedIndex; // Keep at original position
            } else if (node.id === draggedNodeId) {
              // After drag ends, dragged item needs to animate from original to final position
              // It's now at currentDraggedIndex in array, but visually was at originalDraggedIndex
              finalTargetIndex = currentDraggedIndex;
              // Start from original position
              targetIndex = originalDraggedIndex;
            } else if (originalIndex !== -1) {
              // Other items move to make space
              if (currentDraggedIndex > originalDraggedIndex) {
                // Items between original and target move left
                if (originalIndex > originalDraggedIndex && originalIndex <= currentDraggedIndex) {
                  targetIndex = originalIndex - 1;
                }
              } else if (currentDraggedIndex < originalDraggedIndex) {
                // Items between target and original move right
                if (originalIndex >= currentDraggedIndex && originalIndex < originalDraggedIndex) {
                  targetIndex = originalIndex + 1;
                }
              }
            }
          }

          return (
            <AnimatedItem
              key={node.id}
              node={node}
              index={index}
              draggedIndex={draggedNodeId !== null ? index : null}
              targetIndex={targetIndex}
              finalTargetIndex={finalTargetIndex}
              onPress={() => onChildPress(node)}
              onLongPress={() => onChildLongPress(node)}
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              onDragPositionUpdate={onDragPositionUpdate}
              isDragging={isDragging}
              isSelected={openedChildId === node.id}
              swapAdjustment={0}
            />
          );
        })}
      </ScrollView>
    </View>
  );
});

ChildNodeList.displayName = 'ChildNodeList';

export default ChildNodeList;

const styles = StyleSheet.create({
  container: {
    height: 120,
    flexDirection: 'row',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 12,
    alignItems: 'center',
  },
  nodeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedNodeWrapper: {
    ...SciFiTheme.effects.glowStrong,
  },
});

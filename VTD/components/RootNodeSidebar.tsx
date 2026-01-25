import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, ScrollView, View, LayoutChangeEvent } from 'react-native';
import { Node } from '@/lib/firestore';
import { SciFiTheme } from '@/constants/scifiTheme';
import DraggableNodeIcon from './DraggableNodeIcon';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, runOnUI } from 'react-native-reanimated';

type DragSource = 'root' | 'child' | null;

interface RootNodeSidebarProps {
  visible: boolean;
  rootNodes: Node[];
  selectedRootId: string | null;
  onRootPress: (node: Node) => void;
  onRootLongPress: (node: Node) => void;
  onOrderChange?: (newOrder: Node[]) => void;
  draggedNode?: Node | null;
  dragSource?: DragSource;
  onGlobalDragStart?: (node: Node, source: DragSource) => void;
  onGlobalDragEnd?: (dropTarget: 'root' | 'child' | 'none', targetNodeId?: string, absoluteX?: number, absoluteY?: number) => void;
  onDragPositionUpdate?: (x: number, y: number) => void;
}

const ITEM_HEIGHT = 100 + 12; // size + gap

interface AnimatedItemProps {
  node: Node;
  index: number;
  draggedIndex: number | null;
  targetIndex: number;
  onPress: () => void;
  onLongPress: () => void;
  onDragStart: (index: number) => void;
  onDrag: (index: number, translationY: number) => void;
  onDragEnd: (absoluteX?: number, absoluteY?: number) => void;
  onDragPositionUpdate?: (x: number, y: number) => void;
  isSelected: boolean;
  isDragging: boolean;
  swapAdjustment: number;
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
  isSelected,
  isDragging,
  swapAdjustment,
  finalTargetIndex,
}: AnimatedItemProps & { finalTargetIndex?: number }) {
  const translateY = useSharedValue(0);
  
  // When finalTargetIndex is set, animate to final position after drag ends
  React.useEffect(() => {
    if (finalTargetIndex !== undefined && !isDragging) {
      // Item is now at 'index' in array (after swap), needs to animate to finalTargetIndex
      // Since DraggableNodeIcon resets its translation to 0 on release,
      // the item is visually at its array position (index), so we animate from there
      const endOffset = (finalTargetIndex - index) * ITEM_HEIGHT;
      translateY.value = withSpring(endOffset);
    } else if (!isDragging && finalTargetIndex === undefined) {
      translateY.value = 0;
    }
  }, [finalTargetIndex, isDragging, index, translateY]);
  
  const animatedStyle = useAnimatedStyle(() => {
    if (isDragging) {
      // Dragged item stays in place during drag, just scale it
      return { 
        transform: [{ translateY: 0 }, { scale: 1.1 }],
        opacity: 1,
      };
    }
    
    // After drag ends, if this was the dragged item, use the animated translateY
    if (finalTargetIndex !== undefined) {
      return {
        transform: [{ translateY: translateY.value }, { scale: withSpring(1) }],
      };
    }
    
    // Other items move to make space
    const offset = (targetIndex - index) * ITEM_HEIGHT;
    return {
      transform: [{ translateY: withSpring(offset) }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.nodeWrapper,
        isSelected && styles.selectedNodeWrapper,
        animatedStyle,
      ]}
    >
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
        isVertical={true}
        isDragging={isDragging}
        swapAdjustment={0}
      />
    </Animated.View>
  );
}

const RootNodeSidebar = forwardRef<View, RootNodeSidebarProps>(({
  visible,
  rootNodes,
  selectedRootId,
  onRootPress,
  onRootLongPress,
  onOrderChange,
  draggedNode,
  dragSource,
  onGlobalDragStart,
  onGlobalDragEnd,
  onDragPositionUpdate,
}, ref) => {
  const [nodes, setNodes] = useState(rootNodes);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [originalDraggedIndex, setOriginalDraggedIndex] = useState<number | null>(null);
  const [currentDraggedIndex, setCurrentDraggedIndex] = useState<number | null>(null);
  const [dropTargetNodeId, setDropTargetNodeId] = useState<string | null>(null);
  const nodesRef = useRef(nodes);
  const containerRef = useRef<View>(null);
  const containerLayout = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  useImperativeHandle(ref, () => containerRef.current as View);

  // Track container layout for drop detection
  const handleLayout = (e: LayoutChangeEvent) => {
    containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      containerLayout.current = { x: pageX, y: pageY, width, height };
    });
  };

  // Update nodes when rootNodes prop changes, but only if not currently dragging
  React.useEffect(() => {
    if (draggedNodeId === null) {
      setNodes(rootNodes);
      nodesRef.current = rootNodes;
    }
  }, [rootNodes, draggedNodeId]);

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
      onGlobalDragStart(node, 'root');
    }
  };

  const handleDrag = (index: number, translationY: number) => {
    if (draggedNodeId === null || originalDraggedIndex === null) return;
    
    // Use ref to get latest nodes state (but don't modify it during drag)
    const currentNodes = nodesRef.current;
    
    // Calculate which index we're over based on translation from original position
    const targetIndex = Math.round(originalDraggedIndex + translationY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(targetIndex, currentNodes.length - 1));

    // Update the target index for visual feedback (but don't actually swap in array yet)
    if (clampedIndex !== currentDraggedIndex) {
      setCurrentDraggedIndex(clampedIndex);
    }
  };

  const handleDragEnd = (absoluteX?: number, absoluteY?: number) => {
    // Check if this is a cross-list drag (child dropped on root)
    if (dragSource === 'child' && draggedNode && absoluteX !== undefined && absoluteY !== undefined && containerLayout.current) {
      const { x, y, width, height } = containerLayout.current;
      // Check if drop is within this container
      if (absoluteX >= x && absoluteX <= x + width && absoluteY >= y && absoluteY <= y + height) {
        // Find which root node was dropped on based on Y position
        const relativeY = absoluteY - y;
        const nodeIndex = Math.floor(relativeY / ITEM_HEIGHT);
        if (nodeIndex >= 0 && nodeIndex < nodes.length) {
          const targetNode = nodes[nodeIndex];
          if (onGlobalDragEnd) {
            onGlobalDragEnd('root', targetNode.id, absoluteX, absoluteY);
          }
          setDraggedNodeId(null);
          setOriginalDraggedIndex(null);
          setCurrentDraggedIndex(null);
          return;
        }
      }
    }

    // Internal drag within root list
    if (draggedNodeId !== null && originalDraggedIndex !== null && currentDraggedIndex !== null) {
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
    } else {
      // No valid drag or cross-list drag outside this list
      if (onGlobalDragEnd) {
        onGlobalDragEnd('none', undefined, absoluteX, absoluteY);
      }
      setDraggedNodeId(null);
      setOriginalDraggedIndex(null);
      setCurrentDraggedIndex(null);
    }
  };


  return (
    <View style={styles.container} ref={containerRef} onLayout={handleLayout}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        scrollEnabled={draggedNodeId === null && !draggedNode} // Disable scroll when dragging
      >
        {nodes.map((node, index) => {
          const isDragging = draggedNodeId === node.id;
          
          // Find the original index of this node
          const originalIndex = rootNodes.findIndex(n => n.id === node.id);
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
              // So we need to offset it back, then animate forward
              finalTargetIndex = currentDraggedIndex;
              // Start from original position (negative offset)
              targetIndex = originalDraggedIndex;
            } else if (originalIndex !== -1) {
              // Other items move to make space
              if (currentDraggedIndex > originalDraggedIndex) {
                // Items between original and target move up
                if (originalIndex > originalDraggedIndex && originalIndex <= currentDraggedIndex) {
                  targetIndex = originalIndex - 1;
                }
              } else if (currentDraggedIndex < originalDraggedIndex) {
                // Items between target and original move down
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
              onPress={() => onRootPress(node)}
              onLongPress={() => onRootLongPress(node)}
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              isSelected={selectedRootId === node.id}
              isDragging={isDragging}
              swapAdjustment={0}
            />
          );
        })}
      </ScrollView>
    </View>
  );
});

RootNodeSidebar.displayName = 'RootNodeSidebar';

export default RootNodeSidebar;

const styles = StyleSheet.create({
  container: {
    width: 120,
    backgroundColor: SciFiTheme.colors.bgPrimary,
    borderRightWidth: 1,
    borderRightColor: SciFiTheme.colors.borderDim,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 8,
    gap: 12,
  },
  nodeWrapper: {
    alignItems: 'center',
  },
  selectedNodeWrapper: {
    ...SciFiTheme.effects.glowStrong,
  },
});

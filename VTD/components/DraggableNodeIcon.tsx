import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Node } from '@/lib/firestore';
import { SciFiTheme } from '@/constants/scifiTheme';
import LucideIcon from './LucideIcon';

interface DraggableNodeIconProps {
  node: Node;
  index: number;
  onPress: () => void;
  onLongPress: () => void;
  onDragStart: (index: number) => void;
  onDragEnd: (absoluteX?: number, absoluteY?: number) => void;
  onDrag: (index: number, translation: number) => void;
  onDragPositionUpdate?: (x: number, y: number) => void;
  swapAdjustment?: number;
  size?: number;
  isVertical?: boolean; // true for vertical list (sidebar), false for horizontal
  isDragging?: boolean;
}

const DEFAULT_SIZE = 128;

export default function DraggableNodeIcon({
  node,
  index,
  onPress,
  onLongPress,
  onDragStart,
  onDragEnd,
  onDrag,
  onDragPositionUpdate,
  swapAdjustment: externalSwapAdjustment = 0,
  size = DEFAULT_SIZE,
  isVertical = true,
  isDragging: externalIsDragging = false,
}: DraggableNodeIconProps) {
  const scale = useSharedValue(1);
  const isDraggingLocal = useSharedValue(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Use refs to store callbacks so gestures can be stable
  const callbacksRef = useRef({ onPress, onLongPress, onDragStart, onDrag, onDragEnd, onDragPositionUpdate, index, isVertical });
  useEffect(() => {
    callbacksRef.current = { onPress, onLongPress, onDragStart, onDrag, onDragEnd, onDragPositionUpdate, index, isVertical };
  }, [onPress, onLongPress, onDragStart, onDrag, onDragEnd, onDragPositionUpdate, index, isVertical]);

  // Create gestures using useMemo to ensure each component instance has its own gesture instances
  const composedGesture = useMemo(() => {
    const longPress = Gesture.LongPress()
      .minDuration(1000)
      .maxDistance(10)
      .onStart(() => {
        if (!isDraggingLocal.value) {
          runOnJS(() => callbacksRef.current.onLongPress())();
        }
      });

    const panGesture = Gesture.Pan()
      .minDistance(15) // Require 15px movement before starting drag
      .activeOffsetX([-10, 10]) // Activate on horizontal movement
      .activeOffsetY([-10, 10]) // Activate on vertical movement
    .onStart((e) => {
      isDraggingLocal.value = true;
      scale.value = 1; // Don't scale - floating icon handles visual feedback
      translateX.value = 0;
      translateY.value = 0;
      // Report initial position for floating icon
      if (callbacksRef.current.onDragPositionUpdate) {
        runOnJS(() => callbacksRef.current.onDragPositionUpdate?.(e.absoluteX, e.absoluteY))();
      }
      runOnJS(() => callbacksRef.current.onDragStart(callbacksRef.current.index))();
    })
      .onUpdate((e) => {
        // Don't update visual position here - floating icon handles that
        // Just report absolute position for floating icon
        if (callbacksRef.current.onDragPositionUpdate) {
          runOnJS(() => callbacksRef.current.onDragPositionUpdate?.(e.absoluteX, e.absoluteY))();
        }
        
        // Still report relative translation for list reordering
        if (callbacksRef.current.isVertical) {
          runOnJS(() => callbacksRef.current.onDrag(callbacksRef.current.index, e.translationY))();
        } else {
          runOnJS(() => callbacksRef.current.onDrag(callbacksRef.current.index, e.translationX))();
        }
      })
      .onEnd((e) => {
        scale.value = 1;
        isDraggingLocal.value = false;
        // Report absolute position for drop detection
        runOnJS(() => callbacksRef.current.onDragEnd(e.absoluteX, e.absoluteY))();
        // Reset translation
        translateX.value = 0;
        translateY.value = 0;
      })
      .onFinalize(() => {
        isDraggingLocal.value = false;
        translateX.value = 0;
        translateY.value = 0;
      });

    const tap = Gesture.Tap()
      .maxDuration(250)
      .onEnd(() => {
        if (!isDraggingLocal.value) {
          runOnJS(() => callbacksRef.current.onPress())();
        }
      });

    return Gesture.Exclusive(
      Gesture.Simultaneous(longPress, panGesture),
      tap
    );
    // Only recreate when index or isVertical changes (structural changes)
    // Callbacks are accessed via ref, so they don't need to be in deps
  }, [index, isVertical]);

  const animatedStyle = useAnimatedStyle(() => {
    const dragging = externalIsDragging || isDraggingLocal.value;
    // When dragging, hide the original icon completely (floating icon is shown instead)
    // Don't apply translation here since floating icon handles positioning
    return {
      transform: [
        { translateX: 0 },
        { translateY: 0 },
        { scale: 1 },
      ],
      zIndex: 1,
      opacity: dragging ? 0 : 1, // Hide original when dragging
      elevation: 0,
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, { width: size, height: size }, animatedStyle]}>
        <View style={styles.iconWrapper}>
          <LucideIcon
            iconName={node.style?.icon}
            size={40}
            color={SciFiTheme.colors.neonCyan}
          />
          <Text style={styles.title} numberOfLines={2}>
            {node.title}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SciFiTheme.colors.bgSecondary,
    borderWidth: 1,
    borderColor: SciFiTheme.colors.borderPrimary,
    borderRadius: 4,
    padding: 8,
    ...SciFiTheme.effects.glowStrong,
  },
  iconWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: SciFiTheme.colors.neonCyan,
    textAlign: 'center',
    width: '100%',
  },
});

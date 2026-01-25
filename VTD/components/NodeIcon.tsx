import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Node } from '@/lib/firestore';
import { SciFiTheme } from '@/constants/scifiTheme';
import LucideIcon from './LucideIcon';

interface NodeIconProps {
  node: Node;
  onPress: () => void;
  onLongPress: () => void;
  size?: number;
}

const DEFAULT_SIZE = 128;

export default function NodeIcon({
  node,
  onPress,
  onLongPress,
  size = DEFAULT_SIZE,
}: NodeIconProps) {
  const longPress = Gesture.LongPress()
    .minDuration(1000)
    .maxDistance(10)
    .onStart(() => {
      onLongPress();
    });

  const tap = Gesture.Tap()
    .onEnd(() => {
      onPress();
    });

  const composedGesture = Gesture.Race(longPress, tap);

  return (
    <GestureDetector gesture={composedGesture}>
      <TouchableOpacity
        style={[styles.container, { width: size, height: size }]}
        activeOpacity={0.8}
      >
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
      </TouchableOpacity>
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
    ...SciFiTheme.effects.glow,
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

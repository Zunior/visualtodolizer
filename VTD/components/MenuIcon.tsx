import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { SciFiTheme } from '@/constants/scifiTheme';

interface MenuIconProps {
  onPress: () => void;
  onLongPress: () => void;
  size?: number;
}

const DEFAULT_SIZE = 100;

export default function MenuIcon({ onPress, onLongPress, size = DEFAULT_SIZE }: MenuIconProps) {
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
        <Ionicons
          name="menu"
          size={40}
          color={SciFiTheme.colors.neonCyan}
        />
      </TouchableOpacity>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SciFiTheme.colors.bgSecondary,
    borderWidth: 1,
    borderColor: SciFiTheme.colors.borderPrimary,
    borderRadius: 4,
    padding: 8,
    ...SciFiTheme.effects.glow,
  },
});
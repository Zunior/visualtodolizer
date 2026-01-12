import { SciFiTheme } from '@/constants/scifiTheme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MoveToParentBoxProps {
  visible: boolean;
  hasHover: boolean;
}

export default function MoveToParentBox({ visible, hasHover }: MoveToParentBoxProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.box, hasHover && styles.boxHover]}>
        <Text style={styles.title}>Move icon to parent</Text>
        {/* Lightning effect removed - only the dragged icon shows lightning */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
    pointerEvents: 'none',
  },
  box: {
    backgroundColor: SciFiTheme.colors.bgSecondary,
    borderWidth: 1,
    borderColor: SciFiTheme.colors.borderDim,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    ...SciFiTheme.effects.glow,
  },
  boxHover: {
    borderColor: SciFiTheme.colors.neonGreen,
    borderWidth: 2,
    borderStyle: 'dashed',
    ...SciFiTheme.effects.glowStrong,
  },
  title: {
    color: SciFiTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SciFiTheme } from '@/constants/scifiTheme';

interface SciFiBackgroundProps {
  children: React.ReactNode;
  style?: any;
}

export default function SciFiBackground({ children, style }: SciFiBackgroundProps) {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SciFiTheme.colors.bgPrimary,
    position: 'relative',
  },
});

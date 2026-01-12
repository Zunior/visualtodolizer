import { SciFiTheme } from '@/constants/scifiTheme';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface LightningEffectProps {
  visible: boolean;
}

export default function LightningEffect({ visible }: LightningEffectProps) {
  const opacity1 = useSharedValue(0);
  const opacity2 = useSharedValue(0);
  const opacity3 = useSharedValue(0);
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Create flickering effect with different timings for each bolt
      opacity1.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 50 }),
          withTiming(0.2, { duration: 80 }),
          withTiming(1, { duration: 50 }),
          withTiming(0.4, { duration: 100 })
        ),
        -1,
        false
      );
      opacity2.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 60 }),
          withTiming(1, { duration: 70 }),
          withTiming(0.2, { duration: 50 }),
          withTiming(1, { duration: 80 })
        ),
        -1,
        false
      );
      opacity3.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 40 }),
          withTiming(0.1, { duration: 90 }),
          withTiming(1, { duration: 60 }),
          withTiming(0.3, { duration: 70 })
        ),
        -1,
        false
      );
      
      // Slight scale pulsing
      scale1.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 100 }),
          withTiming(1, { duration: 100 })
        ),
        -1,
        false
      );
      scale2.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 120 }),
          withTiming(1.15, { duration: 120 })
        ),
        -1,
        false
      );
      scale3.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 90 }),
          withTiming(1, { duration: 90 })
        ),
        -1,
        false
      );
    } else {
      opacity1.value = withTiming(0, { duration: 150 });
      opacity2.value = withTiming(0, { duration: 150 });
      opacity3.value = withTiming(0, { duration: 150 });
      scale1.value = withTiming(1, { duration: 150 });
      scale2.value = withTiming(1, { duration: 150 });
      scale3.value = withTiming(1, { duration: 150 });
    }
  }, [visible]);

  const animatedStyle1 = useAnimatedStyle(() => ({
    opacity: opacity1.value,
    transform: [{ scale: scale1.value }],
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    opacity: opacity2.value,
    transform: [{ scale: scale2.value }],
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    opacity: opacity3.value,
    transform: [{ scale: scale3.value }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Multiple lightning bolts with different animations */}
      <Animated.View style={[styles.lightningContainer, animatedStyle1]}>
        <View style={[styles.lightning, styles.lightning1]} />
        <View style={[styles.lightning, styles.lightning2]} />
      </Animated.View>
      <Animated.View style={[styles.lightningContainer, animatedStyle2]}>
        <View style={[styles.lightning, styles.lightning3]} />
        <View style={[styles.lightning, styles.lightning4]} />
      </Animated.View>
      <Animated.View style={[styles.lightningContainer, animatedStyle3]}>
        <View style={[styles.lightning, styles.lightning5]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    overflow: 'hidden',
  },
  lightningContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lightning: {
    position: 'absolute',
    backgroundColor: SciFiTheme.colors.neonGreen,
    shadowColor: SciFiTheme.colors.neonGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 8,
  },
  lightning1: {
    top: '5%',
    left: '15%',
    width: 4,
    height: '35%',
    transform: [{ rotate: '-30deg' }, { skewX: '15deg' }],
  },
  lightning2: {
    top: '40%',
    left: '55%',
    width: 3,
    height: '40%',
    transform: [{ rotate: '50deg' }, { skewX: '-12deg' }],
  },
  lightning3: {
    top: '15%',
    left: '65%',
    width: 3,
    height: '30%',
    transform: [{ rotate: '-40deg' }, { skewX: '18deg' }],
  },
  lightning4: {
    top: '55%',
    left: '25%',
    width: 3,
    height: '30%',
    transform: [{ rotate: '40deg' }, { skewX: '-18deg' }],
  },
  lightning5: {
    top: '30%',
    left: '45%',
    width: 2,
    height: '25%',
    transform: [{ rotate: '10deg' }, { skewX: '5deg' }],
  },
});

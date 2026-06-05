import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ThemeColors, ThemeBorderRadius, ThemeSpacing } from '../constants/theme';

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

const SkeletonBox = ({
  width = '100%',
  height = 16,
  borderRadius = ThemeBorderRadius.sm,
  style,
}: SkeletonBoxProps) => {
  const shimmer = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animate = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    animate.start();
    return () => animate.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: ThemeColors.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

interface SkeletonJobCardProps {
  key?: React.Key;
}

export const SkeletonJobCard = ({}: SkeletonJobCardProps) => {
  return (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.topRow}>
        <SkeletonBox width={70} height={24} borderRadius={ThemeBorderRadius.full} />
        <SkeletonBox width={24} height={24} borderRadius={ThemeBorderRadius.sm} />
      </View>

      {/* Title */}
      <SkeletonBox width="90%" height={18} style={{ marginBottom: 8, marginTop: 4 }} />
      <SkeletonBox width="65%" height={14} />

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        <SkeletonBox width={90} height={26} borderRadius={ThemeBorderRadius.sm} />
        <SkeletonBox width={80} height={26} borderRadius={ThemeBorderRadius.sm} />
        <SkeletonBox width={100} height={26} borderRadius={ThemeBorderRadius.sm} style={{ marginLeft: 'auto' }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ThemeColors.surface,
    borderRadius: ThemeBorderRadius.lg,
    padding: ThemeSpacing.lg,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    marginHorizontal: ThemeSpacing.lg,
    marginVertical: ThemeSpacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ThemeSpacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: ThemeColors.border,
    marginVertical: ThemeSpacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: ThemeSpacing.xs,
  },
});

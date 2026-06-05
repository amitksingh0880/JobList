import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { ThemeColors, ThemeBorderRadius, ThemeSpacing, ThemeFonts } from '../constants/theme';
import type { Category } from '../constants/categories';
import type { CategoryKey } from '../constants/theme';

interface CategoryChipProps {
  category: Category;
  isSelected: boolean;
  onPress: (key: CategoryKey) => void;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  category,
  isSelected,
  onPress,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.93,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={() => onPress(category.key)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.chip,
          isSelected
            ? {
                backgroundColor: `${category.color}22`,
                borderColor: `${category.color}80`,
              }
            : {
                backgroundColor: ThemeColors.surface,
                borderColor: ThemeColors.border,
              },
        ]}
      >
        <Text style={styles.emoji}>{category.emoji}</Text>
        <Text
          style={[
            styles.label,
            { color: isSelected ? category.color : ThemeColors.textSecondary },
          ]}
        >
          {category.label}
        </Text>
        {isSelected && (
          <View style={[styles.activeDot, { backgroundColor: category.color }]} />
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 2,
    borderRadius: ThemeBorderRadius.full,
    borderWidth: 1.5,
    gap: 5,
    marginRight: ThemeSpacing.xs,
  },
  emoji: {
    fontSize: 13,
  },
  label: {
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '600',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginLeft: 2,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { ThemeColors, ThemeBorderRadius, ThemeSpacing, ThemeFonts, ThemeShadow } from '../constants/theme';
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
      toValue: 0.95,
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
          { backgroundColor: isSelected ? ThemeColors.primary : ThemeColors.surface },
          isSelected && ThemeShadow.button,
        ]}
      >
        <Text style={styles.emoji}>{category.emoji}</Text>
        <Text style={styles.label}>{category.label}</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: 10,
    borderRadius: ThemeBorderRadius.full,
    borderWidth: 2,
    borderColor: ThemeColors.border,
    gap: 6,
    marginRight: ThemeSpacing.sm,
    marginBottom: 6, // space for shadow
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '800',
    color: ThemeColors.textPrimary,
  },
});

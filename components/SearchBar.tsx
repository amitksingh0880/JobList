import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, ThemeBorderRadius, ThemeSpacing, ThemeFonts, ThemeShadow } from '../constants/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SearchBar = ({
  value,
  onChangeText,
  onFocus,
  onClear,
  placeholder = 'Search jobs, departments...',
  autoFocus = false,
}: SearchBarProps) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const borderAnim = React.useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [ThemeColors.border, ThemeColors.primary],
  });

  return (
    <Animated.View style={[styles.container, { borderColor }]}>
      <Ionicons
        name="search-outline"
        size={18}
        color={isFocused ? ThemeColors.primary : ThemeColors.textMuted}
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={ThemeColors.textMuted}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={18} color={ThemeColors.textMuted} />
        </Pressable>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surface,
    borderRadius: ThemeBorderRadius.md,
    borderWidth: 2,
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.sm,
    gap: ThemeSpacing.sm,
    ...ThemeShadow.button,
    elevation: 2,
  },
  icon: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.md,
    fontWeight: '500',
    padding: 0,
  },
});

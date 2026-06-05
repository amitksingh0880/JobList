import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, ThemeBorderRadius, ThemeSpacing, ThemeFonts } from '../constants/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'document-text-outline',
  title,
  subtitle,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={48} color={ThemeColors.primary} style={{ opacity: 0.5 }} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ThemeSpacing.xxl,
    gap: ThemeSpacing.sm,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: ThemeBorderRadius.xl,
    backgroundColor: `${ThemeColors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ThemeSpacing.sm,
    borderWidth: 1,
    borderColor: `${ThemeColors.primary}30`,
  },
  title: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: ThemeColors.textMuted,
    fontSize: ThemeFonts.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});

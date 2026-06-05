import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import type { Job } from '../types/job';
import { getDaysUntilDeadline, formatDeadline, getDeadlineUrgency } from '../services/jobsService';
import { ThemeColors, ThemeBorderRadius, ThemeSpacing, ThemeFonts } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface JobCardProps {
  job: Job;
  isBookmarked: boolean;
  onPress: () => void;
  onBookmark: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  isBookmarked,
  onPress,
  onBookmark,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const urgency = getDeadlineUrgency(job.lastDate);
  const deadlineText = formatDeadline(job.lastDate);

  const deadlineColors: Record<string, string> = {
    expired: ThemeColors.textMuted,
    critical: ThemeColors.danger,
    warning: ThemeColors.warning,
    safe: ThemeColors.success,
  };

  const deadlineBgColors: Record<string, string> = {
    expired: 'rgba(100,116,139,0.15)',
    critical: 'rgba(239,68,68,0.15)',
    warning: 'rgba(245,158,11,0.15)',
    safe: 'rgba(16,185,129,0.15)',
  };

  const categoryColor = ThemeColors.categories[job.category as keyof typeof ThemeColors.categories] ?? ThemeColors.primary;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: 'rgba(108,61,232,0.1)' }}
      >
        {/* Top Row: Department badge + Bookmark */}
        <View style={styles.topRow}>
          <View style={[styles.categoryPill, { backgroundColor: `${categoryColor}20`, borderColor: `${categoryColor}40` }]}>
            <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
            <Text style={[styles.categoryText, { color: categoryColor }]}>{job.departmentShort}</Text>
          </View>

          <View style={styles.rightBadges}>
            {job.isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
            {job.isUrgent && (
              <View style={styles.urgentBadge}>
                <Ionicons name="flame" size={10} color={ThemeColors.danger} />
                <Text style={styles.urgentBadgeText}>URGENT</Text>
              </View>
            )}
            <Pressable
              onPress={onBookmark}
              hitSlop={12}
              style={styles.bookmarkBtn}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isBookmarked ? ThemeColors.primary : ThemeColors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.jobTitle} numberOfLines={2}>
          {job.title}
        </Text>

        {/* Department */}
        <Text style={styles.departmentText} numberOfLines={1}>
          {job.department}
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom Row: Posts + Salary + Deadline */}
        <View style={styles.bottomRow}>
          <View style={styles.infoChip}>
            <Ionicons name="people-outline" size={12} color={ThemeColors.textSecondary} />
            <Text style={styles.infoChipText}>
              {job.totalPosts > 0 ? `${job.totalPosts.toLocaleString('en-IN')} Posts` : 'Eligibility Test'}
            </Text>
          </View>

          {job.salary && (
            <View style={styles.infoChip}>
              <Ionicons name="cash-outline" size={12} color={ThemeColors.textSecondary} />
              <Text style={styles.infoChipText} numberOfLines={1}>{job.salary.split('–')[0].trim()}</Text>
            </View>
          )}

          <View style={[styles.deadlinePill, { backgroundColor: deadlineBgColors[urgency], borderColor: `${deadlineColors[urgency]}40` }]}>
            <Ionicons name="time-outline" size={11} color={deadlineColors[urgency]} />
            <Text style={[styles.deadlineText, { color: deadlineColors[urgency] }]}>{deadlineText}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: ThemeSpacing.lg,
    marginVertical: ThemeSpacing.xs,
  },
  card: {
    backgroundColor: ThemeColors.surface,
    borderRadius: ThemeBorderRadius.lg,
    padding: ThemeSpacing.lg,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ThemeSpacing.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: 4,
    borderRadius: ThemeBorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryText: {
    fontSize: ThemeFonts.sizes.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.xs,
  },
  newBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: ThemeBorderRadius.sm,
  },
  newBadgeText: {
    color: ThemeColors.success,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: ThemeBorderRadius.sm,
    gap: 2,
  },
  urgentBadgeText: {
    color: ThemeColors.danger,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bookmarkBtn: {
    padding: 4,
  },
  jobTitle: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.md,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  departmentText: {
    color: ThemeColors.textSecondary,
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: ThemeColors.border,
    marginVertical: ThemeSpacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: ThemeSpacing.xs,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ThemeColors.surfaceElevated,
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: 4,
    borderRadius: ThemeBorderRadius.sm,
  },
  infoChipText: {
    color: ThemeColors.textSecondary,
    fontSize: ThemeFonts.sizes.xs,
    fontWeight: '600',
  },
  deadlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: 4,
    borderRadius: ThemeBorderRadius.sm,
    borderWidth: 1,
    marginLeft: 'auto',
  },
  deadlineText: {
    fontSize: ThemeFonts.sizes.xs,
    fontWeight: '700',
  },
});

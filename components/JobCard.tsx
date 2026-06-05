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
import { ThemeColors, ThemeBorderRadius, ThemeSpacing, ThemeFonts, ThemeShadow } from '../constants/theme';
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

  const categoryColor = ThemeColors.categories[job.category as keyof typeof ThemeColors.categories] ?? ThemeColors.surface;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
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
        style={[styles.card, { backgroundColor: categoryColor }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Inner white content block to mimic the "Rooms" UI */}
        <View style={styles.cardInner}>
          <View style={styles.topRow}>
            <View style={styles.badgeWrapper}>
              {job.isNew && (
                <View style={[styles.badge, { backgroundColor: ThemeColors.success }]}>
                  <Text style={styles.badgeText}>NEW</Text>
                </View>
              )}
              {job.isUrgent && (
                <View style={[styles.badge, { backgroundColor: ThemeColors.danger }]}>
                  <Ionicons name="flame" size={10} color="#000" />
                  <Text style={styles.badgeText}>URGENT</Text>
                </View>
              )}
            </View>

            <Pressable onPress={onBookmark} hitSlop={12} style={styles.bookmarkBtn}>
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={ThemeColors.textPrimary}
              />
            </Pressable>
          </View>

          <Text style={styles.jobTitle} numberOfLines={2}>
            {job.title}
          </Text>
          
          <Text style={styles.departmentText} numberOfLines={1}>
            {job.department}
          </Text>
        </View>

        {/* Bottom row directly on the colored card bg */}
        <View style={styles.bottomRow}>
          {job.totalPosts > 0 && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{job.totalPosts.toLocaleString('en-IN')} Posts</Text>
            </View>
          )}

          {job.salary && (
            <View style={styles.pill}>
              <Text style={styles.pillText} numberOfLines={1}>{job.salary.split('–')[0].replace('₹', '').trim()}</Text>
            </View>
          )}

          <View style={[styles.pill, { marginLeft: 'auto', backgroundColor: '#FFF' }]}>
            <Ionicons name="time-outline" size={12} color="#000" />
            <Text style={styles.pillText}>{deadlineText}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: ThemeSpacing.lg,
    marginVertical: 8,
    ...ThemeShadow.card,
  },
  card: {
    borderRadius: ThemeBorderRadius.xl,
    borderWidth: 2,
    borderColor: ThemeColors.border,
    overflow: 'hidden',
    padding: ThemeSpacing.md,
  },
  cardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeBorderRadius.md,
    borderWidth: 2,
    borderColor: ThemeColors.border,
    padding: ThemeSpacing.md,
    marginBottom: ThemeSpacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ThemeSpacing.sm,
  },
  badgeWrapper: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ThemeBorderRadius.full,
    gap: 2,
  },
  badgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bookmarkBtn: {
    padding: 2,
  },
  jobTitle: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.md,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  departmentText: {
    color: ThemeColors.textSecondary,
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: ThemeBorderRadius.full,
    ...ThemeShadow.button,
    elevation: 2, // smaller shadow for inner pills
  },
  pillText: {
    fontSize: ThemeFonts.sizes.xs,
    fontWeight: '800',
    color: '#000',
  },
});

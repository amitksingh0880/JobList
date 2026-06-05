import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Job } from '../types/job';
import { formatDeadline, getDeadlineUrgency } from '../services/jobsService';
import { ThemeColors, ThemeBorderRadius, ThemeSpacing, ThemeFonts } from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface JobDetailSheetProps {
  job: Job | null;
  visible: boolean;
  onClose: () => void;
  onViewFull: () => void;
  isBookmarked: boolean;
  onBookmark: () => void;
}

export const JobDetailSheet: React.FC<JobDetailSheetProps> = ({
  job,
  visible,
  onClose,
  onViewFull,
  isBookmarked,
  onBookmark,
}) => {
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!job) return null;

  const urgency = getDeadlineUrgency(job.lastDate);
  const deadlineColors: Record<string, string> = {
    expired: ThemeColors.textMuted,
    critical: ThemeColors.danger,
    warning: ThemeColors.warning,
    safe: ThemeColors.success,
  };
  const deadlineColor = deadlineColors[urgency];
  const categoryColor = ThemeColors.categories[job.category as keyof typeof ThemeColors.categories] ?? ThemeColors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.deptBadge, { backgroundColor: `${categoryColor}15`, borderColor: `${categoryColor}30` }]}>
            <Text style={[styles.deptBadgeText, { color: categoryColor }]}>{job.departmentShort}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={22} color={ThemeColors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.department}>{job.department}</Text>

          {/* Key Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="people-outline"
              label="Total Posts"
              value={job.totalPosts > 0 ? job.totalPosts.toLocaleString('en-IN') : 'Eligibility'}
              color={ThemeColors.primary}
            />
            <StatCard
              icon="time-outline"
              label="Last Date"
              value={formatDeadline(job.lastDate)}
              color={deadlineColor}
            />
            <StatCard
              icon="calendar-outline"
              label="Age Limit"
              value={`${job.ageLimit.min} – ${job.ageLimit.max === 999 ? 'No limit' : job.ageLimit.max} yrs`}
              color={ThemeColors.info}
            />
            <StatCard
              icon="cash-outline"
              label="Gen Fee"
              value={job.applicationFee.general === 0 ? 'FREE' : `₹${job.applicationFee.general}`}
              color={ThemeColors.warning}
            />
          </View>

          {/* Qualification */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Qualification</Text>
            <Text style={styles.sectionBody}>{job.qualification}</Text>
          </View>

          {/* Important Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Important Dates</Text>
            {job.importantDates.map((d, i) => (
              <View {...{ key: i }} style={styles.dateRow}>
                <Text style={styles.dateLabel}>{d.label}</Text>
                <Text style={styles.dateValue}>
                  {new Date(d.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    })}
                </Text>
              </View>
            ))}
          </View>

          {/* Fee Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Application Fee</Text>
            <View style={styles.feeTable}>
              <FeeRow label="General / OBC / EWS" fee={job.applicationFee.general} />
              <FeeRow label="SC / ST" fee={job.applicationFee.sc_st} />
              <FeeRow label="Female (All Categories)" fee={job.applicationFee.female} />
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable style={styles.viewFullBtn} onPress={onViewFull}>
            <Text style={styles.viewFullBtnText}>View Full Details</Text>
            <Ionicons name="arrow-forward" size={16} color={ThemeColors.textPrimary} />
          </Pressable>

          {job.applyLink && (
            <Pressable
              style={styles.applyBtn}
              onPress={() => Linking.openURL(job.applyLink!)}
            >
              <Ionicons name="open-outline" size={16} color={ThemeColors.textPrimary} />
              <Text style={styles.applyBtnText}>Apply Online</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) => (
  <View style={[statStyles.card, { borderColor: `${color}30` }]}>
    <View style={[statStyles.iconWrap, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <Text style={statStyles.label}>{label}</Text>
    <Text style={[statStyles.value, { color }]} numberOfLines={1}>{value}</Text>
  </View>
);

const FeeRow = ({ label, fee }: { label: string; fee: number }) => (
  <View style={feeStyles.row}>
    <Text style={feeStyles.label}>{label}</Text>
    <Text style={[feeStyles.fee, { color: fee === 0 ? ThemeColors.success : ThemeColors.textPrimary }]}>
      {fee === 0 ? 'FREE' : `₹${fee}`}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: ThemeColors.surfaceElevated,
    borderTopLeftRadius: ThemeBorderRadius.xl,
    borderTopRightRadius: ThemeBorderRadius.xl,
    maxHeight: SCREEN_HEIGHT * 0.88,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    borderBottomWidth: 0,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: ThemeColors.border,
    borderRadius: ThemeBorderRadius.full,
    alignSelf: 'center',
    marginTop: ThemeSpacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ThemeSpacing.xl,
    paddingTop: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.sm,
  },
  deptBadge: {
    borderWidth: 1,
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: 4,
    borderRadius: ThemeBorderRadius.sm,
  },
  deptBadgeText: {
    fontSize: ThemeFonts.sizes.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeBtn: { padding: 4 },
  content: { paddingHorizontal: ThemeSpacing.xl },
  title: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.xl,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 4,
  },
  department: {
    color: ThemeColors.textSecondary,
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '500',
    marginBottom: ThemeSpacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ThemeSpacing.sm,
    marginBottom: ThemeSpacing.lg,
  },
  section: {
    marginBottom: ThemeSpacing.lg,
  },
  sectionTitle: {
    color: ThemeColors.textSecondary,
    fontSize: ThemeFonts.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: ThemeSpacing.sm,
  },
  sectionBody: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.sm,
    lineHeight: 20,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.border,
  },
  dateLabel: {
    color: ThemeColors.textSecondary,
    fontSize: ThemeFonts.sizes.sm,
    flex: 1,
  },
  dateValue: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '600',
  },
  feeTable: {
    backgroundColor: ThemeColors.surface,
    borderRadius: ThemeBorderRadius.md,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    padding: ThemeSpacing.lg,
    gap: ThemeSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: ThemeColors.border,
  },
  viewFullBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColors.surfaceElevated,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    borderRadius: ThemeBorderRadius.md,
    paddingVertical: ThemeSpacing.md,
    gap: ThemeSpacing.xs,
  },
  viewFullBtnText: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeBorderRadius.md,
    paddingVertical: ThemeSpacing.md,
    gap: ThemeSpacing.xs,
  },
  applyBtnText: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '700',
  },
});

const statStyles = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: ThemeColors.surface,
    borderWidth: 1,
    borderRadius: ThemeBorderRadius.md,
    padding: ThemeSpacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: ThemeBorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ThemeSpacing.xs,
  },
  label: {
    color: ThemeColors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '800',
  },
});

const feeStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.border,
  },
  label: {
    color: ThemeColors.textSecondary,
    fontSize: ThemeFonts.sizes.sm,
    flex: 1,
  },
  fee: {
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '700',
  },
});

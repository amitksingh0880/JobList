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
import { formatDeadline } from '../services/jobsService';
import { ThemeColors, ThemeBorderRadius, ThemeSpacing, ThemeFonts, ThemeShadow } from '../constants/theme';

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
        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={10} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </Pressable>
            <View style={styles.headerPill}>
              <Text style={styles.headerPillText}>{job.departmentShort}</Text>
            </View>
            <Pressable onPress={onBookmark} hitSlop={10} style={styles.iconBtn}>
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color="#000"
              />
            </Pressable>
          </View>

          {/* Title Box */}
          <View style={[styles.cardBox, { backgroundColor: ThemeColors.primaryLight, marginBottom: ThemeSpacing.xl }]}>
            <Text style={styles.title}>{job.title}</Text>
            <Text style={styles.department}>{job.department}</Text>
          </View>

          {/* Key Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="people"
              label="Posts"
              value={job.totalPosts > 0 ? job.totalPosts.toLocaleString('en-IN') : 'Check'}
            />
            <StatCard
              icon="time"
              label="Deadline"
              value={formatDeadline(job.lastDate)}
            />
            <StatCard
              icon="calendar"
              label="Age"
              value={`${job.ageLimit.min}-${job.ageLimit.max === 999 ? 'N/A' : job.ageLimit.max}y`}
            />
            <StatCard
              icon="wallet"
              label="Fee"
              value={job.applicationFee.general === 0 ? 'FREE' : `₹${job.applicationFee.general}`}
            />
          </View>

          {/* Qualification */}
          <View style={styles.section}>
            <View style={[styles.cardBox, { backgroundColor: '#FFF' }]}>
              <Text style={styles.sectionTitle}>Qualification</Text>
              <Text style={styles.sectionBody}>{job.qualification}</Text>
            </View>
          </View>

          {/* Important Dates */}
          <View style={styles.section}>
            <View style={[styles.cardBox, { backgroundColor: '#FFF' }]}>
              <Text style={styles.sectionTitle}>Important Dates</Text>
              {job.importantDates.map((d, i) => (
                <View {...{ key: i }} style={[styles.dateRow, i === job.importantDates.length - 1 && { borderBottomWidth: 0 }]}>
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
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable style={styles.viewFullBtn} onPress={onViewFull}>
              <Text style={styles.viewFullBtnText}>Details</Text>
            </Pressable>

            {job.applyLink && (
              <Pressable
                style={styles.applyBtn}
                onPress={() => Linking.openURL(job.applyLink!)}
              >
                <Text style={styles.applyBtnText}>Apply Now</Text>
              </Pressable>
            )}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => (
  <View style={statStyles.card}>
    <Ionicons name={icon} size={20} color="#000" />
    <View style={statStyles.textWrap}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={statStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: ThemeColors.accentSecondary,
    borderTopLeftRadius: ThemeBorderRadius.xxl,
    borderTopRightRadius: ThemeBorderRadius.xxl,
    borderWidth: 3,
    borderColor: '#000',
    borderBottomWidth: 0,
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingTop: ThemeSpacing.lg,
    ...ThemeShadow.sheet,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ThemeSpacing.xl,
  },
  iconBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: ThemeBorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...ThemeShadow.button,
  },
  headerPill: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: ThemeBorderRadius.full,
    borderWidth: 2,
    borderColor: '#000',
    ...ThemeShadow.button,
  },
  headerPillText: {
    fontSize: ThemeFonts.sizes.md,
    fontWeight: '800',
    color: '#000',
  },
  content: { 
    paddingHorizontal: ThemeSpacing.lg,
  },
  cardBox: {
    borderRadius: ThemeBorderRadius.xl,
    padding: ThemeSpacing.lg,
    borderWidth: 2,
    borderColor: '#000',
    ...ThemeShadow.card,
    elevation: 4,
  },
  title: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.xl,
    fontWeight: '900',
    lineHeight: 28,
    marginBottom: 8,
  },
  department: {
    color: ThemeColors.textSecondary,
    fontSize: ThemeFonts.sizes.md,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ThemeSpacing.md,
    marginBottom: ThemeSpacing.xl,
  },
  section: {
    marginBottom: ThemeSpacing.xl,
  },
  sectionTitle: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.lg,
    fontWeight: '900',
    marginBottom: ThemeSpacing.md,
  },
  sectionBody: {
    color: ThemeColors.textSecondary,
    fontSize: ThemeFonts.sizes.md,
    lineHeight: 24,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  dateLabel: {
    color: ThemeColors.textSecondary,
    fontSize: ThemeFonts.sizes.md,
    fontWeight: '700',
    flex: 1,
  },
  dateValue: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.md,
    fontWeight: '900',
  },
  actions: {
    flexDirection: 'row',
    gap: ThemeSpacing.lg,
    marginTop: ThemeSpacing.sm,
  },
  viewFullBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: ThemeBorderRadius.full,
    paddingVertical: 16,
    ...ThemeShadow.button,
  },
  viewFullBtnText: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.md,
    fontWeight: '900',
  },
  applyBtn: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColors.primary,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: ThemeBorderRadius.full,
    paddingVertical: 16,
    ...ThemeShadow.button,
  },
  applyBtnText: {
    color: '#000',
    fontSize: ThemeFonts.sizes.md,
    fontWeight: '900',
  },
});

const statStyles = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: '#FFF',
    borderRadius: ThemeBorderRadius.lg,
    padding: ThemeSpacing.md,
    borderWidth: 2,
    borderColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...ThemeShadow.button,
    elevation: 3,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    color: ThemeColors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  value: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '900',
  },
});

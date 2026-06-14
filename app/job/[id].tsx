import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  SafeAreaView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBookmarks } from '../../hooks/useBookmarks';
import { fetchJobById } from '../../services/jobsService';
import { ThemeColors, ThemeSpacing, ThemeFonts, ThemeBorderRadius } from '../../constants/theme';
import type { Job } from '../../types/job';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [job, setJob] = React.useState<Job | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(['dates', 'eligibility'])
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  React.useEffect(() => {
    if (id) {
      fetchJobById(id).then((j) => {
        setJob(j);
        setLoading(false);
      });
    }
  }, [id]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleShare = async () => {
    if (!job) return;
    await Share.share({
      title: job.title,
      message: `Check out this government job: ${job.title}\nDepartment: ${job.department}\nTotal Posts: ${job.totalPosts}\nLast Date: ${job.lastDate}\n\nApply at: ${job.applyLink || 'Visit official website'}`,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ThemeColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Job not found</Text>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const categoryColor = ThemeColors.categories[job.category as keyof typeof ThemeColors.categories] ?? ThemeColors.primary;
  const bookmarked = isBookmarked(job.id);

  const sections = [
    {
      key: 'dates',
      title: '📅 Important Dates',
      content: (
        <View>
          {job.importantDates.map((d, i) => (
            <View key={i} style={[styles.dateRow, i < job.importantDates.length - 1 && styles.dateRowBorder]}>
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
      ),
    },
    {
      key: 'eligibility',
      title: '🎓 Eligibility & Age',
      content: (
        <View style={styles.sectionBody}>
          <Text style={styles.sectionLabel}>Qualification</Text>
          <Text style={styles.sectionValue}>{job.qualification}</Text>
          <Text style={[styles.sectionLabel, { marginTop: ThemeSpacing.md }]}>Age Limit</Text>
          <Text style={styles.sectionValue}>
            {job.ageLimit.min} – {job.ageLimit.max === 999 ? 'No upper limit' : `${job.ageLimit.max} years`}
          </Text>
          {job.ageLimit.relaxation && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: ThemeSpacing.sm }]}>Age Relaxation</Text>
              <Text style={styles.sectionValue}>{job.ageLimit.relaxation}</Text>
            </>
          )}
        </View>
      ),
    },
    {
      key: 'fee',
      title: '💰 Application Fee',
      content: (
        <View style={styles.feeTable}>
          <FeeRow label="General / OBC / EWS" fee={job.applicationFee.general} />
          <FeeRow label="SC / ST" fee={job.applicationFee.sc_st} />
          <FeeRow label="Female (All Categories)" fee={job.applicationFee.female} last />
        </View>
      ),
    },
    {
      key: 'howToApply',
      title: '📋 How to Apply',
      content: (
        <View style={styles.sectionBody}>
          {job.howToApply.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      ),
    },
    {
      key: 'description',
      title: '📄 About this Recruitment',
      content: (
        <Text style={[styles.sectionBody, styles.descriptionText]}>{job.description}</Text>
      ),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Nav */}
      <View style={styles.topNav}>
        <Pressable onPress={handleBack} style={styles.navBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={ThemeColors.textPrimary} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>{job.departmentShort}</Text>
        <View style={styles.navActions}>
          <Pressable style={styles.navBtn} onPress={handleShare} hitSlop={10}>
            <Ionicons name="share-outline" size={22} color={ThemeColors.textSecondary} />
          </Pressable>
          <Pressable style={styles.navBtn} onPress={() => toggleBookmark(job.id)} hitSlop={10}>
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={bookmarked ? ThemeColors.primary : ThemeColors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Hero */}
        <View style={[styles.hero, { borderBottomColor: `${categoryColor}30` }]}>
          <View style={[styles.deptIconWrap, { backgroundColor: `${categoryColor}20`, borderColor: `${categoryColor}40` }]}>
            <Text style={styles.deptIconText}>{job.departmentShort.slice(0, 2)}</Text>
          </View>
          <Text style={styles.heroTitle}>{job.title}</Text>
          <Text style={styles.heroDepartment}>{job.department}</Text>

          {/* Tags */}
          <View style={styles.tagRow}>
            {job.isNew && (
              <View style={styles.newTag}>
                <Text style={styles.newTagText}>NEW</Text>
              </View>
            )}
            {job.isUrgent && (
              <View style={styles.urgentTag}>
                <Ionicons name="flame" size={11} color={ThemeColors.danger} />
                <Text style={styles.urgentTagText}>URGENT</Text>
              </View>
            )}
            <View style={[styles.catTag, { backgroundColor: `${categoryColor}18`, borderColor: `${categoryColor}35` }]}>
              <Text style={[styles.catTagText, { color: categoryColor }]}>{job.category}</Text>
            </View>
            {job.location && (
              <View style={styles.locationTag}>
                <Ionicons name="location-outline" size={11} color={ThemeColors.textMuted} />
                <Text style={styles.locationTagText}>{job.location}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Key Stats */}
        <View style={styles.statsGrid}>
          <KeyStat icon="people" label="Total Posts" value={job.totalPosts > 0 ? job.totalPosts.toLocaleString('en-IN') : 'Eligibility Test'} color={ThemeColors.primary} />
          {job.salary && <KeyStat icon="cash" label="Pay Scale" value={job.salary} color={ThemeColors.success} />}
          <KeyStat icon="time" label="Last Date" value={new Date(job.lastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} color={ThemeColors.warning} />
          <KeyStat icon="calendar" label="Notification" value={new Date(job.notificationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} color={ThemeColors.info} />
        </View>

        {/* Accordions */}
        <View style={styles.accordions}>
          {sections.map((section) => (
            <AccordionSection
              key={section.key}
              sectionKey={section.key}
              title={section.title}
              isExpanded={expandedSections.has(section.key)}
              onToggle={() => toggleSection(section.key)}
            >
              {section.content}
            </AccordionSection>
          ))}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Sticky Apply Bar */}
      {job.applyLink && (
        <View style={styles.stickyBar}>
          {job.notificationLink && (
            <Pressable
              style={styles.notifBtn}
              onPress={() => Linking.openURL(job.notificationLink!)}
            >
              <Ionicons name="document-text-outline" size={18} color={ThemeColors.textSecondary} />
              <Text style={styles.notifBtnText}>Notification</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.applyBtn}
            onPress={() => Linking.openURL(job.applyLink!)}
          >
            <Ionicons name="open-outline" size={18} color={ThemeColors.textPrimary} />
            <Text style={styles.applyBtnText}>Apply Online Now</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

// Sub-components

const KeyStat = ({ icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <View style={[keyStatStyles.card, { borderColor: `${color}25` }]}>
    <View style={[keyStatStyles.iconWrap, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={keyStatStyles.label}>{label}</Text>
    <Text style={[keyStatStyles.value, { color }]} numberOfLines={2}>{value}</Text>
  </View>
);

const AccordionSection = ({
  sectionKey,
  title,
  isExpanded,
  onToggle,
  children,
}: {
  sectionKey: string;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <View style={accordionStyles.container}>
    <Pressable style={accordionStyles.trigger} onPress={onToggle}>
      <Text style={accordionStyles.triggerText}>{title}</Text>
      <Ionicons
        name={isExpanded ? 'chevron-up' : 'chevron-down'}
        size={18}
        color={ThemeColors.textMuted}
      />
    </Pressable>
    {isExpanded && <View style={accordionStyles.content}>{children}</View>}
  </View>
);

const FeeRow = ({ label, fee, last }: { label: string; fee: number; last?: boolean }) => (
  <View style={[feeStyles.row, !last && feeStyles.rowBorder]}>
    <Text style={feeStyles.label}>{label}</Text>
    <Text style={[feeStyles.fee, { color: fee === 0 ? ThemeColors.success : ThemeColors.textPrimary }]}>
      {fee === 0 ? 'FREE' : `₹${fee}`}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ThemeColors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: ThemeSpacing.md },
  errorText: { color: ThemeColors.textSecondary, fontSize: ThemeFonts.sizes.md },
  backButton: { backgroundColor: ThemeColors.primary, paddingHorizontal: ThemeSpacing.lg, paddingVertical: ThemeSpacing.sm, borderRadius: ThemeBorderRadius.md },
  backButtonText: { color: ThemeColors.textPrimary, fontWeight: '700' },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: ThemeSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.border,
  },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: ThemeBorderRadius.sm },
  navTitle: { flex: 1, color: ThemeColors.textSecondary, fontSize: ThemeFonts.sizes.sm, fontWeight: '600', textAlign: 'center' },
  navActions: { flexDirection: 'row' },
  scroll: { flex: 1 },
  hero: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingTop: ThemeSpacing.xl,
    paddingBottom: ThemeSpacing.xl,
    borderBottomWidth: 1,
    gap: ThemeSpacing.sm,
  },
  deptIconWrap: {
    width: 52,
    height: 52,
    borderRadius: ThemeBorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ThemeSpacing.xs,
  },
  deptIconText: { color: ThemeColors.textPrimary, fontSize: ThemeFonts.sizes.md, fontWeight: '800' },
  heroTitle: { color: ThemeColors.textPrimary, fontSize: ThemeFonts.sizes.xl, fontWeight: '800', lineHeight: 28 },
  heroDepartment: { color: ThemeColors.textSecondary, fontSize: ThemeFonts.sizes.sm, fontWeight: '500' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: ThemeSpacing.xs },
  newTag: { backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)', paddingHorizontal: ThemeSpacing.sm, paddingVertical: 3, borderRadius: ThemeBorderRadius.sm },
  newTagText: { color: ThemeColors.success, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  urgentTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)', paddingHorizontal: ThemeSpacing.sm, paddingVertical: 3, borderRadius: ThemeBorderRadius.sm },
  urgentTagText: { color: ThemeColors.danger, fontSize: 10, fontWeight: '800' },
  catTag: { borderWidth: 1, paddingHorizontal: ThemeSpacing.sm, paddingVertical: 3, borderRadius: ThemeBorderRadius.sm },
  catTagText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  locationTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: ThemeColors.surface, borderWidth: 1, borderColor: ThemeColors.border, paddingHorizontal: ThemeSpacing.sm, paddingVertical: 3, borderRadius: ThemeBorderRadius.sm },
  locationTagText: { color: ThemeColors.textMuted, fontSize: 10, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: ThemeSpacing.md, gap: ThemeSpacing.sm },
  accordions: { paddingHorizontal: ThemeSpacing.lg, gap: ThemeSpacing.xs },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: ThemeSpacing.sm },
  dateRowBorder: { borderBottomWidth: 1, borderBottomColor: ThemeColors.border },
  dateLabel: { color: ThemeColors.textSecondary, fontSize: ThemeFonts.sizes.sm, flex: 1 },
  dateValue: { color: ThemeColors.textPrimary, fontSize: ThemeFonts.sizes.sm, fontWeight: '600' },
  sectionBody: { gap: 4 } as any,
  sectionLabel: { color: ThemeColors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  sectionValue: { color: ThemeColors.textPrimary, fontSize: ThemeFonts.sizes.sm, lineHeight: 20 },
  descriptionText: { color: ThemeColors.textSecondary, fontSize: ThemeFonts.sizes.sm, lineHeight: 22 } as any,
  feeTable: { backgroundColor: ThemeColors.surface, borderRadius: ThemeBorderRadius.md, borderWidth: 1, borderColor: ThemeColors.border, overflow: 'hidden' },
  stepRow: { flexDirection: 'row', gap: ThemeSpacing.sm, marginBottom: ThemeSpacing.sm, alignItems: 'flex-start' },
  stepNumber: { width: 22, height: 22, borderRadius: 11, backgroundColor: `${ThemeColors.primary}25`, borderWidth: 1, borderColor: `${ThemeColors.primary}40`, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  stepNumberText: { color: ThemeColors.primary, fontSize: 11, fontWeight: '800' },
  stepText: { color: ThemeColors.textSecondary, fontSize: ThemeFonts.sizes.sm, lineHeight: 20, flex: 1 },
  bottomPad: { height: 100 },
  stickyBar: { flexDirection: 'row', padding: ThemeSpacing.md, gap: ThemeSpacing.sm, borderTopWidth: 1, borderTopColor: ThemeColors.border, backgroundColor: ThemeColors.surfaceElevated },
  notifBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: ThemeColors.surface, borderWidth: 1, borderColor: ThemeColors.border, borderRadius: ThemeBorderRadius.md, paddingVertical: ThemeSpacing.md, paddingHorizontal: ThemeSpacing.md },
  notifBtnText: { color: ThemeColors.textSecondary, fontSize: ThemeFonts.sizes.sm, fontWeight: '700' },
  applyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: ThemeColors.primary, borderRadius: ThemeBorderRadius.md, paddingVertical: ThemeSpacing.md },
  applyBtnText: { color: ThemeColors.textPrimary, fontSize: ThemeFonts.sizes.sm, fontWeight: '800' },
});

const keyStatStyles = StyleSheet.create({
  card: { width: '47.5%', backgroundColor: ThemeColors.surface, borderWidth: 1, borderRadius: ThemeBorderRadius.md, padding: ThemeSpacing.md, gap: ThemeSpacing.xs },
  iconWrap: { width: 36, height: 36, borderRadius: ThemeBorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  label: { color: ThemeColors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  value: { fontSize: ThemeFonts.sizes.sm, fontWeight: '800', lineHeight: 18 },
});

const accordionStyles = StyleSheet.create({
  container: { backgroundColor: ThemeColors.surface, borderRadius: ThemeBorderRadius.md, borderWidth: 1, borderColor: ThemeColors.border, overflow: 'hidden', marginBottom: ThemeSpacing.xs },
  trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ThemeSpacing.md },
  triggerText: { color: ThemeColors.textPrimary, fontSize: ThemeFonts.sizes.md, fontWeight: '700', flex: 1 },
  content: { borderTopWidth: 1, borderTopColor: ThemeColors.border, padding: ThemeSpacing.md },
});

const feeStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: ThemeSpacing.md, paddingVertical: ThemeSpacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: ThemeColors.border },
  label: { color: ThemeColors.textSecondary, fontSize: ThemeFonts.sizes.sm, flex: 1 },
  fee: { fontSize: ThemeFonts.sizes.sm, fontWeight: '700' },
});

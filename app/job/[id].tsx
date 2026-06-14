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
import { ThemeColors, ThemeSpacing, ThemeFonts, ThemeBorderRadius, ThemeShadow } from '../../constants/theme';
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
      title: 'Important Dates',
      icon: 'calendar-outline',
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
      title: 'Eligibility & Age',
      icon: 'school-outline',
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
      title: 'Application Fee',
      icon: 'cash-outline',
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
      title: 'How to Apply',
      icon: 'clipboard-outline',
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
      title: 'About this Recruitment',
      icon: 'information-circle-outline',
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
        {/* Hero Box */}
        <View style={styles.heroBox}>
          <View style={[styles.heroCard, { backgroundColor: categoryColor }]}>
            <View style={styles.heroCardInner}>
              <View style={styles.heroHeader}>
                <View style={[styles.deptIconWrap, { backgroundColor: categoryColor }]}>
                  <Text style={styles.deptIconText}>{job.departmentShort.slice(0, 2)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroDepartment} numberOfLines={1}>{job.department}</Text>
                  <Text style={styles.departmentShortText}>{job.departmentShort}</Text>
                </View>
              </View>
              
              <Text style={styles.heroTitle}>{job.title}</Text>

              {/* Tags */}
              <View style={styles.tagRow}>
                {job.isNew && (
                  <View style={[styles.tag, { backgroundColor: ThemeColors.success }]}>
                    <Text style={styles.tagText}>NEW</Text>
                  </View>
                )}
                {job.isUrgent && (
                  <View style={[styles.tag, { backgroundColor: ThemeColors.danger }]}>
                    <Ionicons name="flame" size={11} color="#000" />
                    <Text style={styles.tagText}>URGENT</Text>
                  </View>
                )}
                <View style={[styles.tag, { backgroundColor: '#FFF' }]}>
                  <Text style={styles.tagText}>{job.category}</Text>
                </View>
                {job.location && (
                  <View style={[styles.tag, { backgroundColor: '#FFF' }]}>
                    <Ionicons name="location-outline" size={11} color="#000" />
                    <Text style={styles.tagText}>{job.location}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Key Stats */}
        <View style={styles.statsGrid}>
          <KeyStat icon="people" label="Total Posts" value={job.totalPosts > 0 ? job.totalPosts.toLocaleString('en-IN') : 'Eligibility Test'} color={ThemeColors.primary} />
          {job.salary && <KeyStat icon="cash" label="Pay Scale" value={job.salary} color={ThemeColors.accent} />}
          <KeyStat icon="time" label="Last Date" value={new Date(job.lastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} color={ThemeColors.accentPeach} />
          <KeyStat icon="calendar" label="Notification" value={new Date(job.notificationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} color={ThemeColors.accentBlue} />
        </View>

        {/* Accordions */}
        <View style={styles.accordions}>
          {sections.map((section) => (
            <AccordionSection
              key={section.key}
              sectionKey={section.key}
              title={section.title}
              icon={section.icon}
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
  <View style={[keyStatStyles.card, { backgroundColor: color }, ThemeShadow.button]}>
    <View style={keyStatStyles.headerRow}>
      <View style={keyStatStyles.iconWrap}>
        <Ionicons name={icon} size={15} color="#000" />
      </View>
      <Text style={keyStatStyles.label}>{label}</Text>
    </View>
    <Text style={keyStatStyles.value} numberOfLines={2}>{value}</Text>
  </View>
);

const AccordionSection = ({
  sectionKey,
  title,
  icon,
  isExpanded,
  onToggle,
  children,
}: {
  sectionKey: string;
  title: string;
  icon: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <View style={[accordionStyles.container, isExpanded && ThemeShadow.button]}>
    <Pressable style={accordionStyles.trigger} onPress={onToggle}>
      <View style={accordionStyles.triggerLeft}>
        <Ionicons name={icon as any} size={20} color="#000" style={{ marginRight: 8 }} />
        <Text style={accordionStyles.triggerText}>{title}</Text>
      </View>
      <Ionicons
        name={isExpanded ? 'chevron-up' : 'chevron-down'}
        size={18}
        color={ThemeColors.textPrimary}
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
  backButton: { backgroundColor: ThemeColors.primary, paddingHorizontal: ThemeSpacing.lg, paddingVertical: ThemeSpacing.sm, borderRadius: ThemeBorderRadius.md, borderWidth: 2, borderColor: '#000', ...ThemeShadow.button },
  backButtonText: { color: ThemeColors.textPrimary, fontWeight: '900' },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: ThemeSpacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: ThemeColors.border,
    backgroundColor: '#FFF',
  },
  navBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: ThemeBorderRadius.full, borderWidth: 2, borderColor: '#000', backgroundColor: '#FFF', ...ThemeShadow.button, marginHorizontal: 4 },
  navTitle: { flex: 1, color: ThemeColors.textPrimary, fontSize: ThemeFonts.sizes.md, fontWeight: '900', textAlign: 'center' },
  navActions: { flexDirection: 'row', gap: ThemeSpacing.xs },
  scroll: { flex: 1 },
  heroBox: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingTop: ThemeSpacing.xl,
    paddingBottom: ThemeSpacing.md,
  },
  heroCard: {
    borderRadius: ThemeBorderRadius.xl,
    borderWidth: 2,
    borderColor: '#000',
    overflow: 'hidden',
    padding: ThemeSpacing.md,
    ...ThemeShadow.card,
  },
  heroCardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeBorderRadius.md,
    borderWidth: 2,
    borderColor: '#000',
    padding: ThemeSpacing.md,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.md,
    marginBottom: ThemeSpacing.md,
  },
  deptIconWrap: {
    width: 48,
    height: 48,
    borderRadius: ThemeBorderRadius.md,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    ...ThemeShadow.button,
  },
  deptIconText: { color: '#000', fontSize: ThemeFonts.sizes.md, fontWeight: '900' },
  heroTitle: { color: ThemeColors.textPrimary, fontSize: ThemeFonts.sizes.xl, fontWeight: '900', lineHeight: 28, marginBottom: ThemeSpacing.md },
  heroDepartment: { color: ThemeColors.textPrimary, fontSize: ThemeFonts.sizes.sm, fontWeight: '800' },
  departmentShortText: { color: ThemeColors.textSecondary, fontSize: ThemeFonts.sizes.xs, fontWeight: '600', marginTop: 1 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: ThemeSpacing.xs },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 2, borderColor: '#000', paddingHorizontal: 10, paddingVertical: 4, borderRadius: ThemeBorderRadius.full, ...ThemeShadow.button },
  tagText: { color: '#000', fontSize: 10, fontWeight: '900' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: ThemeSpacing.lg, paddingVertical: ThemeSpacing.md, gap: ThemeSpacing.md, justifyContent: 'space-between' },
  accordions: { paddingHorizontal: ThemeSpacing.lg, paddingBottom: ThemeSpacing.xl },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: ThemeSpacing.sm },
  dateRowBorder: { borderBottomWidth: 2, borderBottomColor: ThemeColors.border },
  dateLabel: { color: ThemeColors.textSecondary, fontSize: ThemeFonts.sizes.sm, fontWeight: '700', flex: 1 },
  dateValue: { color: ThemeColors.textPrimary, fontSize: ThemeFonts.sizes.sm, fontWeight: '900' },
  sectionBody: { gap: 4 } as any,
  sectionLabel: { color: ThemeColors.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  sectionValue: { color: ThemeColors.textPrimary, fontSize: ThemeFonts.sizes.sm, lineHeight: 20, fontWeight: '700' },
  descriptionText: { color: ThemeColors.textSecondary, fontSize: ThemeFonts.sizes.sm, lineHeight: 22, fontWeight: '600' } as any,
  feeTable: { backgroundColor: ThemeColors.surface, borderRadius: ThemeBorderRadius.md, borderWidth: 2, borderColor: ThemeColors.border, overflow: 'hidden' },
  stepRow: { flexDirection: 'row', gap: ThemeSpacing.sm, marginBottom: ThemeSpacing.sm, alignItems: 'flex-start' },
  stepNumber: { width: 22, height: 22, borderRadius: ThemeBorderRadius.sm, backgroundColor: ThemeColors.primary, borderWidth: 2, borderColor: '#000', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  stepNumberText: { color: '#000', fontSize: 10, fontWeight: '900' },
  stepText: { color: ThemeColors.textSecondary, fontSize: ThemeFonts.sizes.sm, lineHeight: 20, flex: 1, fontWeight: '700' },
  bottomPad: { height: 100 },
  stickyBar: { flexDirection: 'row', padding: ThemeSpacing.md, gap: ThemeSpacing.sm, borderTopWidth: 2, borderTopColor: ThemeColors.border, backgroundColor: '#FFF' },
  notifBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#000', borderRadius: ThemeBorderRadius.md, paddingVertical: ThemeSpacing.md, paddingHorizontal: ThemeSpacing.md, ...ThemeShadow.button },
  notifBtnText: { color: '#000', fontSize: ThemeFonts.sizes.sm, fontWeight: '900' },
  applyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: ThemeColors.primary, borderWidth: 2, borderColor: '#000', borderRadius: ThemeBorderRadius.md, paddingVertical: ThemeSpacing.md, ...ThemeShadow.button },
  applyBtnText: { color: '#000', fontSize: ThemeFonts.sizes.sm, fontWeight: '900' },
});

const keyStatStyles = StyleSheet.create({
  card: { width: '47%', borderWidth: 2, borderColor: '#000', borderRadius: ThemeBorderRadius.md, padding: ThemeSpacing.md, gap: ThemeSpacing.xs, marginBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  iconWrap: { width: 24, height: 24, borderRadius: ThemeBorderRadius.sm, borderWidth: 1, borderColor: '#000', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  label: { color: ThemeColors.textSecondary, fontSize: 9, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  value: { color: '#000', fontSize: 13, fontWeight: '900', lineHeight: 18 },
});

const accordionStyles = StyleSheet.create({
  container: { backgroundColor: ThemeColors.surface, borderRadius: ThemeBorderRadius.md, borderWidth: 2, borderColor: ThemeColors.border, overflow: 'hidden', marginBottom: ThemeSpacing.md },
  trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ThemeSpacing.md, backgroundColor: '#FFF' },
  triggerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  triggerText: { color: ThemeColors.textPrimary, fontSize: ThemeFonts.sizes.md, fontWeight: '900', flex: 1 },
  content: { borderTopWidth: 2, borderTopColor: ThemeColors.border, padding: ThemeSpacing.md, backgroundColor: '#FAF8FF' },
});

const feeStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: ThemeSpacing.md, paddingVertical: ThemeSpacing.sm },
  rowBorder: { borderBottomWidth: 2, borderBottomColor: ThemeColors.border },
  label: { color: ThemeColors.textSecondary, fontSize: ThemeFonts.sizes.sm, fontWeight: '700', flex: 1 },
  fee: { fontSize: ThemeFonts.sizes.sm, fontWeight: '900' },
});

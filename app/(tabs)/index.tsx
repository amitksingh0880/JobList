import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Pressable,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useJobs } from '../../hooks/useJobs';
import { useBookmarks } from '../../hooks/useBookmarks';
import { JobCard } from '../../components/JobCard';
import { SkeletonJobCard } from '../../components/SkeletonJobCard';
import { CategoryChip } from '../../components/CategoryChip';
import { JobDetailSheet } from '../../components/JobDetailSheet';
import { EmptyState } from '../../components/EmptyState';
import { SearchBar } from '../../components/SearchBar';
import { JOB_CATEGORIES, JOB_TABS } from '../../constants/categories';
import { ThemeColors, ThemeSpacing, ThemeFonts, ThemeBorderRadius } from '../../constants/theme';
import type { Job } from '../../types/job';
import type { JobTabKey } from '../../constants/categories';

export default function HomeScreen() {
  const router = useRouter();
  const {
    jobs,
    filter,
    loading,
    refreshing,
    onRefresh,
    setCategory,
    setStatus,
    setSearchQuery,
  } = useJobs();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [sheetVisible, setSheetVisible] = React.useState(false);

  const handleJobPress = (job: Job) => {
    setSelectedJob(job);
    setSheetVisible(true);
  };

  const handleViewFull = () => {
    if (selectedJob) {
      setSheetVisible(false);
      setTimeout(() => router.push(`/job/${selectedJob.id}`), 150);
    }
  };

  const renderJobCard = ({ item }: { item: Job }) => (
    <JobCard
      job={item}
      isBookmarked={isBookmarked(item.id)}
      onPress={() => handleJobPress(item)}
      onBookmark={() => toggleBookmark(item.id)}
    />
  );

  const renderSkeletons = () =>
    Array.from({ length: 5 }).map((_, i) => <SkeletonJobCard key={i} />);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>सरकारी नौकरी 🇮🇳</Text>
            <Text style={styles.headerSubtitle}>Find Your Government Job</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerBtn}
              onPress={() => router.push('/search')}
            >
              <Ionicons name="search-outline" size={20} color={ThemeColors.textSecondary} />
            </Pressable>
            <View style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={20} color={ThemeColors.textSecondary} />
              <View style={styles.notifDot} />
            </View>
          </View>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <StatPill icon="briefcase-outline" label="Active Jobs" value="12,000+" />
          <View style={styles.statDivider} />
          <StatPill icon="flash-outline" label="New Today" value="47" />
          <View style={styles.statDivider} />
          <StatPill icon="time-outline" label="Closing Soon" value="8" />
        </View>

        {/* Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
          style={styles.categoryScrollContainer}
        >
          {JOB_CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.key}
              category={cat}
              isSelected={filter.category === cat.key}
              onPress={setCategory}
            />
          ))}
        </ScrollView>

        {/* Tab Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
          style={styles.tabsContainer}
        >
          {JOB_TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setStatus(tab.key as JobTabKey)}
              style={[
                styles.tab,
                filter.status === tab.key && styles.tabActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  filter.status === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
              {filter.status === tab.key && <View style={styles.tabIndicator} />}
            </Pressable>
          ))}
        </ScrollView>

        {/* Job Count */}
        {!loading && (
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              <Text style={styles.countNum}>{jobs.length}</Text> jobs found
            </Text>
          </View>
        )}

        {/* Job List */}
        {loading ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {renderSkeletons()}
          </ScrollView>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="No Jobs Found"
            subtitle="Try adjusting your filters or check back later for new opportunities."
          />
        ) : (
          <FlatList
            data={jobs}
            renderItem={renderJobCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={ThemeColors.primary}
                colors={[ThemeColors.primary]}
              />
            }
          />
        )}
      </View>

      {/* Bottom Sheet */}
      <JobDetailSheet
        job={selectedJob}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onViewFull={handleViewFull}
        isBookmarked={selectedJob ? isBookmarked(selectedJob.id) : false}
        onBookmark={() => selectedJob && toggleBookmark(selectedJob.id)}
      />
    </SafeAreaView>
  );
}

const StatPill = ({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => (
  <View style={styles.statPill}>
    <Ionicons name={icon} size={14} color={ThemeColors.primary} />
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ThemeSpacing.lg,
    paddingTop: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.sm,
  },
  headerGreeting: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: ThemeColors.textMuted,
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '500',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: ThemeSpacing.xs,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: ThemeBorderRadius.md,
    backgroundColor: ThemeColors.surface,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: ThemeBorderRadius.md,
    backgroundColor: ThemeColors.surface,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ThemeColors.danger,
    borderWidth: 1.5,
    borderColor: ThemeColors.background,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: ThemeSpacing.lg,
    marginBottom: ThemeSpacing.md,
    backgroundColor: ThemeColors.surface,
    borderRadius: ThemeBorderRadius.md,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    paddingVertical: ThemeSpacing.sm,
    paddingHorizontal: ThemeSpacing.md,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: ThemeColors.border,
    marginHorizontal: ThemeSpacing.xs,
  },
  statValue: {
    color: ThemeColors.primary,
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '800',
  },
  statLabel: {
    color: ThemeColors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  categoryScrollContainer: {
    marginBottom: ThemeSpacing.xs,
  },
  categoryScroll: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingVertical: ThemeSpacing.xs,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.border,
    marginBottom: ThemeSpacing.xs,
  },
  tabsScroll: {
    paddingHorizontal: ThemeSpacing.lg,
  },
  tab: {
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.md,
    position: 'relative',
    marginRight: ThemeSpacing.xs,
  },
  tabActive: {},
  tabText: {
    color: ThemeColors.textMuted,
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    color: ThemeColors.primary,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: ThemeSpacing.md,
    right: ThemeSpacing.md,
    height: 2,
    backgroundColor: ThemeColors.primary,
    borderRadius: 1,
  },
  countRow: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingVertical: ThemeSpacing.xs,
  },
  countText: {
    color: ThemeColors.textMuted,
    fontSize: ThemeFonts.sizes.xs,
    fontWeight: '500',
  },
  countNum: {
    color: ThemeColors.textSecondary,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: ThemeSpacing.xxl,
    paddingTop: ThemeSpacing.xs,
  },
});

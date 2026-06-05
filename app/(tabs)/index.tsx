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
import { JOB_CATEGORIES, JOB_TABS } from '../../constants/categories';
import { ThemeColors, ThemeSpacing, ThemeFonts, ThemeBorderRadius, ThemeShadow } from '../../constants/theme';
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
            <Text style={styles.headerGreeting}>GovLink ✨</Text>
            <Text style={styles.headerSubtitle}>Find Your Government Job</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerBtn}
              onPress={() => router.push('/search')}
            >
              <Ionicons name="search" size={20} color="#000" />
            </Pressable>
            <View style={styles.headerBtn}>
              <Ionicons name="notifications" size={20} color="#000" />
              <View style={styles.notifDot} />
            </View>
          </View>
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

        {/* Tab Bar Filter */}
        <View style={styles.tabsWrapper}>
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
              </Pressable>
            ))}
          </ScrollView>
        </View>

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
                tintColor="#000"
                colors={['#000']}
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
    paddingHorizontal: ThemeSpacing.xl,
    paddingTop: ThemeSpacing.lg,
    paddingBottom: ThemeSpacing.md,
  },
  headerGreeting: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.xxl,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: ThemeColors.textSecondary,
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '700',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: ThemeSpacing.sm,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: ThemeBorderRadius.full,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    ...ThemeShadow.button,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ThemeColors.danger,
    borderWidth: 2,
    borderColor: '#000',
  },
  categoryScrollContainer: {
    marginTop: ThemeSpacing.sm,
    marginBottom: ThemeSpacing.xs,
  },
  categoryScroll: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingVertical: ThemeSpacing.xs,
  },
  tabsWrapper: {
    marginHorizontal: ThemeSpacing.lg,
    marginBottom: ThemeSpacing.sm,
    backgroundColor: '#FFF',
    borderRadius: ThemeBorderRadius.full,
    borderWidth: 2,
    borderColor: '#000',
    overflow: 'hidden',
    ...ThemeShadow.button,
    elevation: 2,
  },
  tabsContainer: {
    //
  },
  tabsScroll: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tab: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingVertical: 10,
    borderRadius: ThemeBorderRadius.full,
  },
  tabActive: {
    backgroundColor: ThemeColors.primary,
    borderWidth: 2,
    borderColor: '#000',
  },
  tabText: {
    color: ThemeColors.textSecondary,
    fontSize: ThemeFonts.sizes.md,
    fontWeight: '800',
  },
  tabTextActive: {
    color: ThemeColors.textPrimary,
    fontWeight: '900',
  },
  countRow: {
    paddingHorizontal: ThemeSpacing.xl,
    paddingVertical: ThemeSpacing.xs,
  },
  countText: {
    color: ThemeColors.textSecondary,
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '700',
  },
  countNum: {
    color: ThemeColors.textPrimary,
    fontWeight: '900',
  },
  listContent: {
    paddingBottom: 100, // Make room for floating tab bar
    paddingTop: ThemeSpacing.xs,
  },
});

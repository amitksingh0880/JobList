import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { JobCard } from '../../components/JobCard';
import { JobDetailSheet } from '../../components/JobDetailSheet';
import { EmptyState } from '../../components/EmptyState';
import { useJobs } from '../../hooks/useJobs';
import { useBookmarks } from '../../hooks/useBookmarks';
import { JOB_CATEGORIES } from '../../constants/categories';
import { ThemeColors, ThemeSpacing, ThemeFonts, ThemeBorderRadius } from '../../constants/theme';
import type { Job } from '../../types/job';
import type { CategoryKey } from '../../constants/theme';

export default function CategoriesScreen() {
  const router = useRouter();
  const { allJobs, filter, setCategory } = useJobs();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [sheetVisible, setSheetVisible] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  const activeCat = filter.category;

  // Jobs for selected category
  const filteredForCat = activeCat === 'All'
    ? allJobs
    : allJobs.filter((j) => j.category === activeCat);

  // Category job counts
  const catCounts = React.useMemo(() => {
    const counts: Partial<Record<CategoryKey, number>> = {};
    allJobs.forEach((job) => {
      counts[job.category] = (counts[job.category] || 0) + 1;
    });
    return counts;
  }, [allJobs]);

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

  const renderJobItem = ({ item }: { item: Job }) => (
    <JobCard
      job={item}
      isBookmarked={isBookmarked(item.id)}
      onPress={() => handleJobPress(item)}
      onBookmark={() => toggleBookmark(item.id)}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Browse Categories</Text>
          <Text style={styles.subtitle}>Filter by exam type or department</Text>
        </View>

        {/* Category Grid */}
        <View style={styles.categoryGrid}>
          {JOB_CATEGORIES.filter((c) => c.key !== 'All').map((cat) => (
            <Pressable
              key={cat.key}
              style={[
                styles.categoryCard,
                activeCat === cat.key && {
                  backgroundColor: `${cat.color}18`,
                  borderColor: `${cat.color}50`,
                },
              ]}
              onPress={() => setCategory(cat.key as CategoryKey)}
            >
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text
                style={[
                  styles.catLabel,
                  { color: activeCat === cat.key ? cat.color : ThemeColors.textSecondary },
                ]}
              >
                {cat.label}
              </Text>
              <View
                style={[
                  styles.catCount,
                  { backgroundColor: activeCat === cat.key ? `${cat.color}25` : ThemeColors.surfaceElevated },
                ]}
              >
                <Text
                  style={[
                    styles.catCountText,
                    { color: activeCat === cat.key ? cat.color : ThemeColors.textMuted },
                  ]}
                >
                  {catCounts[cat.key as Exclude<CategoryKey, 'All'>] || 0}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Jobs for selected category */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {activeCat === 'All' ? 'All Jobs' : `${activeCat} Jobs`}{' '}
            <Text style={styles.listCount}>({filteredForCat.length})</Text>
          </Text>
          <Pressable
            onPress={() => setCategory('All')}
            style={styles.clearBtn}
          >
            {activeCat !== 'All' && (
              <Text style={styles.clearBtnText}>Clear</Text>
            )}
          </Pressable>
        </View>

        {filteredForCat.length === 0 ? (
          <EmptyState
            icon="briefcase-outline"
            title="No Jobs in this Category"
            subtitle="Check back later or browse other categories."
          />
        ) : (
          <FlatList
            data={filteredForCat}
            renderItem={renderJobItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

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
  },
  header: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingTop: ThemeSpacing.lg,
    paddingBottom: ThemeSpacing.md,
  },
  title: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.xxl,
    fontWeight: '800',
  },
  subtitle: {
    color: ThemeColors.textMuted,
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '500',
    marginTop: 2,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: ThemeSpacing.md,
    gap: ThemeSpacing.xs,
    paddingBottom: ThemeSpacing.sm,
  },
  categoryCard: {
    width: '30%',
    backgroundColor: ThemeColors.surface,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    borderRadius: ThemeBorderRadius.md,
    padding: ThemeSpacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  catEmoji: {
    fontSize: 22,
  },
  catLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  catCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ThemeBorderRadius.full,
    marginTop: 2,
  },
  catCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: ThemeColors.border,
    marginHorizontal: ThemeSpacing.lg,
    marginVertical: ThemeSpacing.sm,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ThemeSpacing.lg,
    marginBottom: ThemeSpacing.xs,
  },
  listTitle: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.md,
    fontWeight: '700',
  },
  listCount: {
    color: ThemeColors.textMuted,
    fontWeight: '500',
  },
  clearBtn: {
    paddingHorizontal: ThemeSpacing.sm,
    paddingVertical: 4,
  },
  clearBtnText: {
    color: ThemeColors.primary,
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: ThemeSpacing.xxl,
  },
});

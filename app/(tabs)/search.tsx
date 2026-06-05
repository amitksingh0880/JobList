import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SearchBar } from '../../components/SearchBar';
import { JobCard } from '../../components/JobCard';
import { SkeletonJobCard } from '../../components/SkeletonJobCard';
import { JobDetailSheet } from '../../components/JobDetailSheet';
import { EmptyState } from '../../components/EmptyState';
import { useJobs } from '../../hooks/useJobs';
import { useBookmarks } from '../../hooks/useBookmarks';
import { ThemeColors, ThemeSpacing, ThemeFonts } from '../../constants/theme';
import type { Job } from '../../types/job';

export default function SearchScreen() {
  const router = useRouter();
  const { jobs, filter, loading, setSearchQuery } = useJobs();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [sheetVisible, setSheetVisible] = React.useState(false);

  const hasSearched = filter.searchQuery.length > 0;
  const searchResults = hasSearched ? jobs : [];

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

  const renderItem = ({ item }: { item: Job }) => (
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
          <Text style={styles.title}>Search Jobs</Text>
          <Text style={styles.subtitle}>Search across all government positions</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={filter.searchQuery}
            onChangeText={setSearchQuery}
            placeholder="SSC, UPSC, Railway, Banking..."
            autoFocus={false}
          />
        </View>

        {/* Body */}
        {!hasSearched ? (
          <EmptyState
            icon="search-outline"
            title="Search for Jobs"
            subtitle="Type a department name, exam name, or category to find relevant government jobs."
          />
        ) : loading ? (
          <View>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonJobCard key={i} />)}
          </View>
        ) : searchResults.length === 0 ? (
          <EmptyState
            icon="close-circle-outline"
            title="No results found"
            subtitle={`No jobs matching "${filter.searchQuery}". Try a different keyword.`}
          />
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{filter.searchQuery}"
            </Text>
            <FlatList
              data={searchResults}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </>
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
    paddingBottom: ThemeSpacing.sm,
  },
  title: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.xxl,
    fontWeight: '800',
    marginBottom: 2,
  },
  subtitle: {
    color: ThemeColors.textMuted,
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingBottom: ThemeSpacing.md,
  },
  resultsCount: {
    color: ThemeColors.textMuted,
    fontSize: ThemeFonts.sizes.xs,
    fontWeight: '600',
    paddingHorizontal: ThemeSpacing.lg,
    paddingBottom: ThemeSpacing.xs,
  },
  listContent: {
    paddingBottom: ThemeSpacing.xxl,
  },
});

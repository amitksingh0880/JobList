import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { JobCard } from '../../components/JobCard';
import { JobDetailSheet } from '../../components/JobDetailSheet';
import { EmptyState } from '../../components/EmptyState';
import { useJobs } from '../../hooks/useJobs';
import { useBookmarks } from '../../hooks/useBookmarks';
import { ThemeColors, ThemeSpacing, ThemeFonts, ThemeBorderRadius, ThemeShadow } from '../../constants/theme';
import type { Job } from '../../types/job';

export default function BookmarksScreen() {
  const router = useRouter();
  const { allJobs } = useJobs();
  const { bookmarkedIds, isBookmarked, toggleBookmark } = useBookmarks();
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [sheetVisible, setSheetVisible] = React.useState(false);

  const bookmarkedJobs = allJobs.filter((j) => bookmarkedIds.has(j.id));

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
          <View>
            <Text style={styles.title}>Saved Jobs</Text>
            <Text style={styles.subtitle}>
              {bookmarkedJobs.length > 0
                ? `${bookmarkedJobs.length} job${bookmarkedJobs.length !== 1 ? 's' : ''} saved`
                : 'No saved jobs yet'}
            </Text>
          </View>
          {bookmarkedJobs.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{bookmarkedJobs.length}</Text>
            </View>
          )}
        </View>

        {bookmarkedJobs.length === 0 ? (
          <EmptyState
            icon="bookmark-outline"
            title="No Saved Jobs"
            subtitle="Tap the bookmark icon on any job card to save it here for easy access later."
          />
        ) : (
          <FlatList
            data={bookmarkedJobs}
            renderItem={renderItem}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ThemeSpacing.lg,
    paddingTop: ThemeSpacing.lg,
    paddingBottom: ThemeSpacing.lg,
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
  countBadge: {
    width: 36,
    height: 36,
    borderRadius: ThemeBorderRadius.md,
    backgroundColor: ThemeColors.primary,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    ...ThemeShadow.button,
  },
  countBadgeText: {
    color: '#000',
    fontSize: ThemeFonts.sizes.md,
    fontWeight: '900',
  },
  listContent: {
    paddingBottom: ThemeSpacing.xxl,
  },
});

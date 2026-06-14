import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Pressable,
  Linking,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar } from '../../components/SearchBar';
import { EmptyState } from '../../components/EmptyState';
import { useJobs } from '../../hooks/useJobs';
import { ThemeColors, ThemeSpacing, ThemeFonts, ThemeBorderRadius, ThemeShadow } from '../../constants/theme';
import type { Job } from '../../types/job';

export default function NotificationsScreen() {
  const router = useRouter();
  const { allJobs, loading } = useJobs();
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter jobs that have a notification link
  const jobsWithDocs = React.useMemo(() => {
    return allJobs.filter(job => job.notificationLink);
  }, [allJobs]);

  // Handle local searching through the documents
  const filteredJobs = React.useMemo(() => {
    if (!searchQuery) return jobsWithDocs;
    const q = searchQuery.toLowerCase();
    return jobsWithDocs.filter(
      job =>
        job.title.toLowerCase().includes(q) ||
        job.department.toLowerCase().includes(q) ||
        job.category.toLowerCase().includes(q) ||
        (job.qualification && job.qualification.toLowerCase().includes(q))
    );
  }, [jobsWithDocs, searchQuery]);

  const handleOpenURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn(`Don't know how to open URI: ${url}`);
      }
    } catch (error) {
      console.error('Failed to open link:', error);
    }
  };

  const renderItem = ({ item }: { item: Job }) => {
    const categoryColor = ThemeColors.categories[item.category as keyof typeof ThemeColors.categories] ?? ThemeColors.surface;
    const isDirectPdf = item.notificationLink?.endsWith('.pdf') || item.notificationLink?.includes('files.govtjobsalert.in') || item.notificationLink?.includes('drive.google.com/file');

    return (
      <View style={styles.cardWrapper}>
        <View style={[styles.card, { backgroundColor: categoryColor }]}>
          {/* Inner card content box */}
          <View style={styles.cardInner}>
            <View style={styles.topRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
              </View>
              <View style={[styles.docTypeBadge, { backgroundColor: isDirectPdf ? '#D1FAE5' : '#FFF3C4' }]}>
                <Ionicons
                  name={isDirectPdf ? 'document-attach' : 'link'}
                  size={12}
                  color={isDirectPdf ? '#065F46' : '#92400E'}
                />
                <Text style={[styles.docTypeText, { color: isDirectPdf ? '#065F46' : '#92400E' }]}>
                  {isDirectPdf ? 'OFFICIAL PDF' : 'LINK'}
                </Text>
              </View>
            </View>

            <Text style={styles.jobTitle} numberOfLines={2}>
              {item.title}
            </Text>

            <Text style={styles.departmentText} numberOfLines={1}>
              🏢 {item.department}
            </Text>

            {item.qualification && (
              <Text style={styles.qualificationText} numberOfLines={1}>
                🎓 {item.qualification}
              </Text>
            )}
          </View>

          {/* Direct Neubrutalist Buttons on card base */}
          <View style={styles.buttonRow}>
            {item.notificationLink && (
              <Pressable
                onPress={() => handleOpenURL(item.notificationLink!)}
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.pdfBtn,
                  pressed && styles.btnPressed,
                ]}
              >
                <Ionicons name="document-text" size={16} color="#000" />
                <Text style={styles.btnText}>View PDF</Text>
              </Pressable>
            )}

            {item.applyLink && (
              <Pressable
                onPress={() => handleOpenURL(item.applyLink!)}
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.applyBtn,
                  pressed && styles.btnPressed,
                ]}
              >
                <Ionicons name="open-outline" size={16} color="#000" />
                <Text style={styles.btnText}>Apply Online</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Alerts & Docs</Text>
          <Text style={styles.subtitle}>Download official PDF advertisements & apply online</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search notifications, exams, PDFs..."
          />
        </View>

        {/* List content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Fetching documents...</Text>
          </View>
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon="document-lock-outline"
            title="No Documents Found"
            subtitle={
              searchQuery
                ? `No notifications found matching "${searchQuery}"`
                : 'Check back later. Real-time official documents will appear here when fetched.'
            }
          />
        ) : (
          <FlatList
            data={filteredJobs}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
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
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    color: ThemeColors.textSecondary,
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '700',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: ThemeSpacing.lg,
    paddingBottom: ThemeSpacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: ThemeSpacing.sm,
  },
  loadingText: {
    color: ThemeColors.textSecondary,
    fontSize: ThemeFonts.sizes.md,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 110, // Make room for floating bottom tab bar
  },
  cardWrapper: {
    marginHorizontal: ThemeSpacing.lg,
    marginVertical: 10,
    ...ThemeShadow.card,
  },
  card: {
    borderRadius: ThemeBorderRadius.xl,
    borderWidth: 2,
    borderColor: ThemeColors.border,
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
    alignItems: 'center',
    marginBottom: ThemeSpacing.sm,
  },
  categoryBadge: {
    backgroundColor: '#000',
    borderRadius: ThemeBorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  docTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#000',
    borderRadius: ThemeBorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  docTypeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  jobTitle: {
    color: ThemeColors.textPrimary,
    fontSize: ThemeFonts.sizes.md,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 8,
  },
  departmentText: {
    color: ThemeColors.textSecondary,
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '700',
    marginBottom: 4,
  },
  qualificationText: {
    color: ThemeColors.textMuted,
    fontSize: ThemeFonts.sizes.xs,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: ThemeSpacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: ThemeBorderRadius.md,
    paddingVertical: 10,
    ...ThemeShadow.button,
    elevation: 2,
  },
  pdfBtn: {
    backgroundColor: ThemeColors.primary,
  },
  applyBtn: {
    backgroundColor: ThemeColors.accent,
  },
  btnText: {
    color: '#000',
    fontSize: ThemeFonts.sizes.sm,
    fontWeight: '900',
  },
  btnPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    shadowOffset: { width: 1, height: 1 },
  },
});

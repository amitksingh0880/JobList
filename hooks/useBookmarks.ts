import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Job } from '../types/job';

const BOOKMARKS_KEY = '@sarkari_bookmarks';

export function useBookmarks() {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load bookmarks from storage on mount
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
        if (stored) {
          setBookmarkedIds(new Set(JSON.parse(stored)));
        }
      } catch {
        // fail silently — bookmarks are non-critical
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Persist whenever bookmarks change
  const persist = useCallback(async (ids: Set<string>) => {
    try {
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...ids]));
    } catch {
      // fail silently
    }
  }, []);

  const toggleBookmark = useCallback(
    (jobId: string) => {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (next.has(jobId)) {
          next.delete(jobId);
        } else {
          next.add(jobId);
        }
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const isBookmarked = useCallback(
    (jobId: string) => bookmarkedIds.has(jobId),
    [bookmarkedIds]
  );

  return {
    bookmarkedIds,
    toggleBookmark,
    isBookmarked,
    loading,
  };
}

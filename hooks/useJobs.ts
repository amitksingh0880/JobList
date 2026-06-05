import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchJobs, filterJobs } from '../services/jobsService';
import type { Job, JobFilter } from '../types/job';
import type { CategoryKey } from '../constants/theme';
import type { JobTabKey } from '../constants/categories';

const DEFAULT_FILTER: JobFilter = {
  category: 'All',
  status: 'latest',
  searchQuery: '',
};

export function useJobs() {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<JobFilter>(DEFAULT_FILTER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const jobs = await fetchJobs();
      setAllJobs(jobs);
    } catch (e) {
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadJobs(true);
  }, [loadJobs]);

  const filteredJobs = useMemo(
    () => filterJobs(allJobs, filter),
    [allJobs, filter]
  );

  const setCategory = useCallback((category: CategoryKey) => {
    setFilter((prev) => ({ ...prev, category }));
  }, []);

  const setStatus = useCallback((status: JobTabKey) => {
    setFilter((prev) => ({ ...prev, status }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilter((prev) => ({ ...prev, searchQuery }));
  }, []);

  const resetFilter = useCallback(() => {
    setFilter(DEFAULT_FILTER);
  }, []);

  return {
    jobs: filteredJobs,
    allJobs,
    filter,
    loading,
    error,
    refreshing,
    onRefresh,
    setCategory,
    setStatus,
    setSearchQuery,
    resetFilter,
  };
}

/**
 * Jobs Service — Abstraction layer for job data fetching.
 * Swap MOCK_JOBS with a real API call (e.g., JSearch, NCS, or custom backend) here.
 * All consumers (hooks, screens) use this service and remain agnostic of the data source.
 */
import { MOCK_JOBS } from '../data/jobs';
import type { Job, JobFilter } from '../types/job';
import type { CategoryKey } from '../constants/theme';

// Simulate network delay for realistic UX
const simulateDelay = (ms = 600) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Fetch all jobs. Replace MOCK_JOBS with:
 *   const response = await fetch('https://your-api.com/jobs');
 *   return response.json();
 */
export async function fetchJobs(): Promise<Job[]> {
  await simulateDelay();
  return MOCK_JOBS;
}

/**
 * Fetch a single job by ID.
 */
export async function fetchJobById(id: string): Promise<Job | null> {
  await simulateDelay(300);
  return MOCK_JOBS.find((j) => j.id === id) ?? null;
}

/**
 * Filter jobs locally. For a real API, pass these as query params.
 */
export function filterJobs(jobs: Job[], filter: JobFilter): Job[] {
  return jobs.filter((job) => {
    const categoryMatch =
      filter.category === 'All' || job.category === filter.category;
    const statusMatch = job.status === filter.status;
    const searchMatch =
      !filter.searchQuery ||
      job.title.toLowerCase().includes(filter.searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(filter.searchQuery.toLowerCase()) ||
      job.category.toLowerCase().includes(filter.searchQuery.toLowerCase());
    return categoryMatch && statusMatch && searchMatch;
  });
}

/**
 * Get days until deadline. Returns negative if expired.
 */
export function getDaysUntilDeadline(lastDate: string): number {
  const today = new Date();
  const deadline = new Date(lastDate);
  const diff = deadline.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Returns a human-readable deadline string.
 */
export function formatDeadline(lastDate: string): string {
  const days = getDaysUntilDeadline(lastDate);
  if (days < 0) return 'Expired';
  if (days === 0) return 'Today is Last Day!';
  if (days === 1) return '1 day left';
  if (days <= 7) return `${days} days left`;
  return new Date(lastDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Returns urgency level for styling.
 */
export function getDeadlineUrgency(lastDate: string): 'expired' | 'critical' | 'warning' | 'safe' {
  const days = getDaysUntilDeadline(lastDate);
  if (days < 0) return 'expired';
  if (days <= 3) return 'critical';
  if (days <= 7) return 'warning';
  return 'safe';
}

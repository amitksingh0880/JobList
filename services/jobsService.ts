/**
 * Jobs Service — Abstraction layer for job data fetching.
 * Loads pre-crawled government job vacancies from SarkariResult.
 */
import { MOCK_JOBS } from '../data/jobs';
import type { Job, JobFilter } from '../types/job';
import type { CategoryKey } from '../constants/theme';
import type { JobTabKey } from '../constants/categories';

/**
 * Fetch all jobs.
 */
export async function fetchJobs(): Promise<Job[]> {
  const uniqueJobs: Job[] = [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  for (const job of MOCK_JOBS) {
    if (!job.applyLink) {
      uniqueJobs.push(job);
      continue;
    }
    const url = job.applyLink.toLowerCase().trim();
    // Normalize title to strip non-alphanumeric and noise words
    const normTitle = job.title
      .toLowerCase()
      .replace(/recruitment|online form|apply|result|admit card|answer key|vacancy|vacancies|job/g, '')
      .replace(/[^a-z0-9]/g, '');

    if (seenUrls.has(url) || seenTitles.has(normTitle)) {
      continue;
    }

    seenUrls.add(url);
    seenTitles.add(normTitle);
    uniqueJobs.push(job);
  }

  return uniqueJobs;
}

/**
 * Fetch a single job by ID.
 */
export async function fetchJobById(id: string): Promise<Job | null> {
  const jobs = await fetchJobs();
  return jobs.find((j) => j.id === id) ?? null;
}

/**
 * Filter jobs locally.
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

    // Hide expired jobs under the Latest Jobs tab
    if (filter.status === 'latest') {
      const days = getDaysUntilDeadline(job.lastDate);
      if (days < 0) return false;
    }

    return categoryMatch && statusMatch && searchMatch;
  });
}

/**
 * Get days until deadline.
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

import type { CategoryKey } from './theme';

export interface Category {
  key: CategoryKey;
  label: string;
  emoji: string;
  color: string;
}

export const JOB_CATEGORIES: Category[] = [
  { key: 'All',      label: 'All Jobs',   emoji: '🏛️', color: '#6C3DE8' },
  { key: 'SSC',      label: 'SSC',        emoji: '📝', color: '#8B5CF6' },
  { key: 'UPSC',     label: 'UPSC',       emoji: '🎯', color: '#3B82F6' },
  { key: 'Railway',  label: 'Railway',    emoji: '🚂', color: '#F59E0B' },
  { key: 'Banking',  label: 'Banking',    emoji: '🏦', color: '#10B981' },
  { key: 'Police',   label: 'Police',     emoji: '👮', color: '#EF4444' },
  { key: 'Teaching', label: 'Teaching',   emoji: '📚', color: '#06B6D4' },
  { key: 'Defence',  label: 'Defence',    emoji: '🪖', color: '#F97316' },
  { key: 'State',    label: 'State PSC',  emoji: '🏢', color: '#EC4899' },
];

export const JOB_TABS = [
  { key: 'latest',       label: 'Latest Jobs' },
  { key: 'results',      label: 'Results' },
  { key: 'admit_card',   label: 'Admit Cards' },
  { key: 'answer_key',   label: 'Answer Keys' },
] as const;

export type JobTabKey = typeof JOB_TABS[number]['key'];

import type { CategoryKey } from './theme';

export interface Category {
  key: CategoryKey;
  label: string;
  iconName: string;
  color: string;
}

export const JOB_CATEGORIES: Category[] = [
  { key: 'All',      label: 'All Jobs',   iconName: 'grid-outline', color: '#E2D4F0' },
  { key: 'SSC',      label: 'SSC',        iconName: 'document-text-outline', color: '#E2D4F0' },
  { key: 'UPSC',     label: 'UPSC',       iconName: 'ribbon-outline', color: '#A9DEF9' },
  { key: 'Railway',  label: 'Railway',    iconName: 'train-outline', color: '#FFD166' },
  { key: 'Banking',  label: 'Banking',    iconName: 'cash-outline', color: '#A0E8AF' },
  { key: 'Police',   label: 'Police',     iconName: 'shield-half-outline', color: '#FFB5A7' },
  { key: 'Teaching', label: 'Teaching',   iconName: 'school-outline', color: '#F4C2C2' },
  { key: 'Defence',  label: 'Defence',    iconName: 'shield-outline', color: '#FF9F1C' },
  { key: 'State',    label: 'State PSC',  iconName: 'business-outline', color: '#C6EDD4' },
];

export const JOB_TABS = [
  { key: 'latest',       label: 'Latest Jobs' },
  { key: 'results',      label: 'Results' },
  { key: 'admit_card',   label: 'Admit Cards' },
  { key: 'answer_key',   label: 'Answer Keys' },
] as const;

export type JobTabKey = typeof JOB_TABS[number]['key'];

import type { CategoryKey } from '../constants/theme';
import type { JobTabKey } from '../constants/categories';

export interface ImportantDate {
  label: string;
  date: string; // ISO date string
}

export interface ApplicationFee {
  general: number;
  sc_st: number;
  female: number;
}

export interface AgeLimit {
  min: number;
  max: number;
  relaxation?: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  departmentShort: string;
  category: Exclude<CategoryKey, 'All'>;
  totalPosts: number;
  lastDate: string;
  notificationDate: string;
  applicationStartDate: string;
  applicationEndDate: string;
  ageLimit: AgeLimit;
  qualification: string;
  applicationFee: ApplicationFee;
  applyLink?: string;
  notificationLink?: string;
  status: JobTabKey;
  isNew: boolean;
  isUrgent: boolean;
  description: string;
  howToApply: string[];
  importantDates: ImportantDate[];
  salary?: string;
  location?: string;
}

export type JobFilter = {
  category: CategoryKey;
  status: JobTabKey;
  searchQuery: string;
};

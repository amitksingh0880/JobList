/**
 * Jobs Service — Abstraction layer for job data fetching.
 * Fetches real-time government job vacancies from RojgarLive RSS feeds.
 * Includes CORS proxy fallback for web and memory caching for optimal performance.
 */
import { MOCK_JOBS } from '../data/jobs';
import type { Job, JobFilter } from '../types/job';
import type { CategoryKey } from '../constants/theme';
import type { JobTabKey } from '../constants/categories';

const CATEGORY_FEEDS: Record<JobTabKey, string> = {
  latest: 'https://www.rojgarlive.com/category/sarkari-naukri/feed',
  results: 'https://www.rojgarlive.com/category/result/feed',
  admit_card: 'https://www.rojgarlive.com/category/admit-card/feed',
  answer_key: 'https://www.rojgarlive.com/category/answer-key/feed',
};

// Memory cache to store fetched jobs and avoid redundant network calls
let cachedJobs: Job[] = [];

/**
 * Extract text content from XML tags, handling potential CDATA wrappers.
 */
function getTagContent(xml: string, tag: string): string {
  const openTag = `<${tag}>`;
  const closeTag = `</${tag}>`;
  const startIdx = xml.indexOf(openTag);
  if (startIdx === -1) return '';
  const endIdx = xml.indexOf(closeTag, startIdx + openTag.length);
  if (endIdx === -1) return '';
  
  let content = xml.substring(startIdx + openTag.length, endIdx).trim();
  
  if (content.startsWith('<![CDATA[')) {
    content = content.substring(9);
  }
  if (content.endsWith(']]>')) {
    content = content.substring(0, content.length - 3);
  }
  
  return content.trim();
}

/**
 * Extract attribute value from tag (like media:thumbnail or enclosure).
 */
function getThumbnailUrl(xml: string): string {
  const match = xml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
  if (match) return match[1];
  
  const enclosureMatch = xml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (enclosureMatch) return enclosureMatch[1];
  
  return '';
}

/**
 * Deduce Exam/Vacancies Category based on keywords in title or description.
 */
function categorizeJob(title: string, desc: string): Exclude<CategoryKey, 'All'> {
  const t = (title + ' ' + desc).toLowerCase();
  if (t.includes('ssc') || t.includes('staff selection')) return 'SSC';
  if (t.includes('upsc') || t.includes('union public service')) return 'UPSC';
  if (t.includes('railway') || t.includes('rrb') || t.includes('rrc')) return 'Railway';
  if (t.includes('bank') || t.includes('ibps') || t.includes('sbi') || t.includes('nabard') || t.includes('rbi')) return 'Banking';
  if (t.includes('police') || t.includes('constable') || t.includes('sub inspector') || t.includes('si ') || t.includes('cop ')) return 'Police';
  if (t.includes('teacher') || t.includes('teaching') || t.includes('tet') || t.includes('tgt') || t.includes('pgt') || t.includes('professor') || t.includes('lecturer') || t.includes('school')) return 'Teaching';
  if (t.includes('defence') || t.includes('army') || t.includes('navy') || t.includes('air force') || t.includes('military') || t.includes('nda') || t.includes('cds') || t.includes('coast guard')) return 'Defence';
  return 'State'; // Default category mapping to State PSC
}

/**
 * Maps a single RSS item block into the Job interface structure.
 */
function mapRssItemToJob(itemXml: string, tabKey: JobTabKey): Job {
  const title = getTagContent(itemXml, 'title') || 'Government Recruitment';
  const link = getTagContent(itemXml, 'link');
  const description = getTagContent(itemXml, 'description') || 'No description available.';
  const pubDateStr = getTagContent(itemXml, 'pubDate');
  
  const id = link ? link.split('/').pop() || Math.random().toString() : Math.random().toString();
  
  // Extract Department
  let department = 'Government Department';
  let departmentShort = 'Govt';
  const deptPart = title.split(/recruitment|vacanc|notification|jobs|apply/i)[0].trim();
  if (deptPart) {
    department = deptPart;
    const words = deptPart.split(/\s+/);
    const uppercaseWords = words.filter(w => /^[A-Z]{2,10}$/.test(w.replace(/[^A-Z]/g, '')));
    departmentShort = uppercaseWords.length > 0 ? uppercaseWords.join(' ') : words.slice(0, 2).join(' ');
  }
  
  // Extract Total Posts
  let totalPosts = 0;
  const postsMatch = title.match(/(\d+)\s*(?:vacanc|post|opening|job)/i);
  if (postsMatch) {
    totalPosts = parseInt(postsMatch[1], 10);
  }
  
  // Extract Deadline Date
  let lastDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); // Default 14 days later
  const dateMatch = description.match(/(?:to|until|last date:?)\s+([0-9]{1,2}\s+[A-Za-z]+|[A-Za-z]+\s+[0-9]{1,2})(?:\s*,?\s*([0-9]{4}))?/i);
  if (dateMatch) {
    const dateStr = dateMatch[1];
    const year = dateMatch[2] || new Date(pubDateStr || Date.now()).getFullYear().toString();
    const parsedDate = new Date(`${dateStr} ${year}`);
    if (!isNaN(parsedDate.getTime())) {
      lastDate = parsedDate.toISOString();
    }
  }
  
  // Extract Qualification
  let qualification = 'As per official notification';
  const keywords = [
    '10th pass', '10th', 'Matric', '12th pass', '12th', 'Intermediate', 'ITI', 'Diploma', 'Graduate', 
    'Graduation', 'Post Graduate', 'B.Sc Nursing', 'B.Sc', 'GNM', 'MBBS', 'B.Com', 
    'B.Tech', 'B.E', 'M.Tech', 'MBA', 'MCA', 'B.Ed', 'D.El.Ed', 'PG Degree', 'DNB', 'PhD'
  ];
  const found: string[] = [];
  const lowercaseDesc = description.toLowerCase();
  for (const kw of keywords) {
    if (lowercaseDesc.includes(kw.toLowerCase())) {
      found.push(kw);
    }
  }
  let filtered = found;
  if (found.includes('B.Sc Nursing') && found.includes('B.Sc')) {
    filtered = filtered.filter(x => x !== 'B.Sc');
  }
  if (found.includes('10th pass') && found.includes('10th')) {
    filtered = filtered.filter(x => x !== '10th');
  }
  if (found.includes('12th pass') && found.includes('12th')) {
    filtered = filtered.filter(x => x !== '12th');
  }
  if (filtered.length > 0) {
    qualification = filtered.join(' / ');
  }
  
  // Extract Salary
  let salary = undefined;
  const salaryMatch = description.match(/salary\s*(?:of\s*)?([^.]+\d+[^.]+)/i);
  if (salaryMatch) {
    salary = salaryMatch[1].trim();
  }
  
  // Categorize
  const category = categorizeJob(title, description);
  
  // Age Limit Defaults
  const ageLimit = {
    min: 18,
    max: 40,
    relaxation: 'As per government rules'
  };
  
  // Fee Defaults
  const applicationFee = {
    general: 0,
    sc_st: 0,
    female: 0
  };
  
  const pubDateIso = pubDateStr ? new Date(pubDateStr).toISOString() : new Date().toISOString();
  
  // How to apply steps
  const howToApply = [
    'Click the "Apply Online" button to visit the recruitment page.',
    'Read the detailed official advertisement/notification.',
    'Fill in the application form with personal and educational details.',
    'Upload required documents like photograph, signature, and certificates.',
    'Pay the application fee (if applicable) online.',
    'Submit the form and take a printout of the confirmation page for your records.'
  ];
  
  return {
    id,
    title,
    department,
    departmentShort,
    category,
    totalPosts,
    lastDate,
    notificationDate: pubDateIso,
    applicationStartDate: pubDateIso,
    applicationEndDate: lastDate,
    ageLimit,
    qualification,
    applicationFee,
    applyLink: link,
    notificationLink: link,
    status: tabKey,
    isNew: (Date.now() - new Date(pubDateIso).getTime()) < (3 * 24 * 60 * 60 * 1000), // New if published in last 3 days
    isUrgent: (new Date(lastDate).getTime() - Date.now()) < (3 * 24 * 60 * 60 * 1000) && (new Date(lastDate).getTime() - Date.now()) > 0, // Urgent if last date is within 3 days
    description,
    howToApply,
    importantDates: [
      { label: 'Notification Released', date: pubDateIso },
      { label: 'Application Start Date', date: pubDateIso },
      { label: 'Last Date to Apply', date: lastDate }
    ],
    salary,
    location: 'India'
  };
}

/**
 * Fetch all jobs from all category feeds in parallel.
 * Gracefully falls back to mock data on errors.
 */
export async function fetchJobs(): Promise<Job[]> {
  try {
    const feedPromises = Object.entries(CATEGORY_FEEDS).map(async ([tabKey, url]) => {
      let xmlText = '';
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        xmlText = await res.text();
      } catch (err) {
        // Fallback for CORS (React Native Web) or network errors
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
          const res = await fetch(proxyUrl);
          xmlText = await res.text();
        } catch (proxyErr) {
          console.error(`Failed to fetch feed ${tabKey} via proxy:`, proxyErr);
          return [];
        }
      }

      const parsedJobs: Job[] = [];
      let idx = 0;
      while (true) {
        const startIdx = xmlText.indexOf('<item>', idx);
        if (startIdx === -1) break;
        const endIdx = xmlText.indexOf('</item>', startIdx);
        if (endIdx === -1) break;
        const itemXml = xmlText.substring(startIdx + 6, endIdx);
        try {
          const job = mapRssItemToJob(itemXml, tabKey as JobTabKey);
          parsedJobs.push(job);
        } catch (e) {
          console.error(`Error parsing item in ${tabKey}:`, e);
        }
        idx = endIdx + 7;
      }
      return parsedJobs;
    });

    const results = await Promise.all(feedPromises);
    const allFetchedJobs = results.flat();
    
    // Sort by pubDate descending (newest first)
    allFetchedJobs.sort((a, b) => new Date(b.notificationDate).getTime() - new Date(a.notificationDate).getTime());
    
    if (allFetchedJobs.length === 0) {
      console.warn('All feeds failed or returned empty. Using fallback mock jobs.');
      cachedJobs = MOCK_JOBS;
      return MOCK_JOBS;
    }

    cachedJobs = allFetchedJobs;
    return allFetchedJobs;
  } catch (err) {
    console.error('Error fetching real jobs:', err);
    cachedJobs = MOCK_JOBS;
    return MOCK_JOBS;
  }
}

/**
 * Fetch a single job by ID.
 */
export async function fetchJobById(id: string): Promise<Job | null> {
  if (cachedJobs.length === 0) {
    await fetchJobs();
  }
  return cachedJobs.find((j) => j.id === id) ?? MOCK_JOBS.find((j) => j.id === id) ?? null;
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

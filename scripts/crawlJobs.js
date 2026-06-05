/**
 * Dual-Source Crawler — Scrapes SarkariResult + GovtJobsAlert,
 * merges unique jobs by title, and writes to data/jobs.json.
 * Run: npm run crawl
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`Status ${res.statusCode}`)); return; }
      let html = '';
      res.on('data', c => html += c);
      res.on('end', () => resolve(html));
    }).on('error', reject);
  });
}

// ─── Shared Helpers ────────────────────────────────────────────────────────────

function getCategory(text) {
  const t = text.toLowerCase();
  if (t.includes('ssc') || t.includes('staff selection')) return 'SSC';
  if (t.includes('upsc') || t.includes('union public service')) return 'UPSC';
  if (t.includes('railway') || t.includes('rrb') || t.includes('rrc') || t.includes('ntpc') || t.includes('alp') || t.includes('loco pilot')) return 'Railway';
  if (t.includes('bank') || t.includes('ibps') || t.includes('sbi') || t.includes('rbi') || t.includes('lic') || t.includes('nabard') || t.includes('insurance') || t.includes('po ') || t.includes('clerk') || t.includes('apprentice')) return 'Banking';
  if (t.includes('police') || t.includes('constable') || t.includes('sub inspector') || t.includes(' si ') || t.includes('daroga') || t.includes('bsf') || t.includes('crpf') || t.includes('cisf') || t.includes('itbp') || t.includes('ssb ')) return 'Police';
  if (t.includes('teacher') || t.includes('teaching') || t.includes(' tet') || t.includes('tgt') || t.includes('pgt') || t.includes('professor') || t.includes('lecturer') || t.includes('school') || t.includes('d.el.ed') || t.includes('ctet') || t.includes('htet') || t.includes('jhtet')) return 'Teaching';
  if (t.includes('defence') || t.includes('army') || t.includes('navy') || t.includes('air force') || t.includes('military') || t.includes('nda') || t.includes('cds') || t.includes('agniveer') || t.includes('havildar') || t.includes('jco') || t.includes('ssb')) return 'Defence';
  return 'State';
}

function getStatus(text) {
  const t = text.toLowerCase();
  if (t.includes('result') || t.includes('score card') || t.includes('marks out') || t.includes('merit list')) return 'results';
  if (t.includes('admit card') || t.includes('exam city') || t.includes('hall ticket') || t.includes('call letter')) return 'admit_card';
  if (t.includes('answer key') || t.includes('answerkey') || t.includes('key paper') || t.includes('response sheet')) return 'answer_key';
  return 'latest';
}

function getDepartmentShort(dept) {
  const words = dept.split(/\s+/);
  const acronyms = words.filter(w => /^[A-Z]{2,10}$/.test(w));
  return acronyms.length > 0 ? acronyms.join(' ') : words.slice(0, 2).join(' ');
}

function getQualification(text) {
  const t = text.toLowerCase();
  if (t.includes('technician') || t.includes(' iti')) return '10th Pass with ITI Certificate';
  if (t.includes('ldc') || t.includes('stenographer') || t.includes('chsl') || t.includes('constable') || t.includes('agniveer')) return '10+2 / Intermediate Pass';
  if (t.includes('teacher') || t.includes('lecturer') || t.includes('professor') || t.includes('tet')) return 'B.Ed / D.El.Ed / Graduate in Education';
  if (t.includes('engineer') || t.includes(' je ') || t.includes('junior engineer')) return 'Diploma / B.E. / B.Tech in Engineering';
  if (t.includes('nursing') || t.includes('medical') || t.includes('doctor')) return 'B.Sc Nursing / GNM / MBBS';
  if (t.includes('officer') || t.includes('grade b') || t.includes(' aao') || t.includes(' po ') || t.includes('manager')) return 'Graduate Degree (Any Stream)';
  return '10th / 12th / Graduation as per post';
}

function makeDates(lastDateStr) {
  const today = new Date();
  let lastDate;
  if (lastDateStr) {
    const year = /\d{4}/.test(lastDateStr) ? '' : ` ${today.getFullYear()}`;
    const parsed = new Date(`${lastDateStr}${year}`);
    lastDate = isNaN(parsed.getTime()) ? new Date(today.getTime() + 14 * 86400000) : parsed;
  } else {
    lastDate = new Date(today.getTime() + (Math.floor(Math.random() * 20) + 5) * 86400000);
  }
  const notif = new Date(today.getTime() - Math.floor(Math.random() * 5) * 86400000);
  return { lastDate: lastDate.toISOString(), notif: notif.toISOString() };
}

function makeJob({ id, title, department, totalPosts, lastDateStr, salary, status, applyLink, category }) {
  const dept = department || title.split(/recruitment|online form|apply|result|admit card|answer key/i)[0].trim().replace(/[^A-Za-z0-9\s]/g,'').replace(/\b202\d\b/g,'').trim() || 'Central Govt';
  const { lastDate, notif } = makeDates(lastDateStr);
  const cat = category || getCategory(title);
  const qual = getQualification(title);
  const feeGen = status === 'latest' && Math.random() > 0.5 ? (Math.random() > 0.5 ? 500 : 100) : 0;
  const today = new Date();

  return {
    id,
    title,
    department: dept,
    departmentShort: getDepartmentShort(dept),
    category: cat,
    totalPosts: totalPosts || (status === 'latest' ? Math.floor(Math.random() * 900) + 50 : 0),
    lastDate,
    notificationDate: notif,
    applicationStartDate: notif,
    applicationEndDate: lastDate,
    ageLimit: { min: 18, max: cat === 'Defence' ? 22 : 35, relaxation: 'As per government rules' },
    qualification: qual,
    applicationFee: { general: feeGen, sc_st: feeGen > 0 ? Math.floor(feeGen / 2) : 0, female: 0 },
    applyLink,
    notificationLink: applyLink,
    status,
    isNew: (today.getTime() - new Date(notif).getTime()) < 3 * 86400000,
    isUrgent: (new Date(lastDate).getTime() - today.getTime()) < 3 * 86400000 && (new Date(lastDate).getTime() - today.getTime()) > 0,
    description: `Government recruitment notification for ${title}. Check eligibility, age limit, salary, application fee, and how to apply on the official portal.`,
    howToApply: [
      'Click "Apply Online" to visit the official recruitment page.',
      'Read the detailed notification / advertisement carefully.',
      'Register with your email and phone number on the official portal.',
      'Fill in personal, educational, and experience details.',
      'Upload photo, signature and required documents.',
      'Pay the application fee (if applicable) and submit.',
      'Download and save the confirmation / printout.'
    ],
    importantDates: [
      { label: 'Notification Released', date: notif },
      { label: 'Application Start Date', date: notif },
      { label: 'Last Date to Apply', date: lastDate }
    ],
    salary: salary || (status === 'latest' ? (cat === 'Railway' ? '₹21,700 – ₹69,100/- PM' : cat === 'Banking' ? '₹35,000 – ₹1,05,000/- PM' : '₹25,500 – ₹81,100/- PM') : undefined),
    location: 'All India'
  };
}

// ─── Source 1: SarkariResult ────────────────────────────────────────────────────

async function crawlSarkariResult() {
  console.log('  Fetching SarkariResult.com...');
  const html = await fetchPage('https://www.sarkariresult.com/');
  console.log(`  Fetched ${html.length} bytes`);
  const jobs = [];
  const seen = new Set();
  const linkRx = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = linkRx.exec(html)) !== null) {
    const href = m[1];
    const rawText = m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (!rawText || rawText.length < 5 || rawText.toLowerCase() === 'view more') continue;
    if (!(/\/2025\//i.test(href) || /\/2026\//i.test(href))) continue;
    const id = href.split('/').filter(Boolean).pop() || '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const status = getStatus(rawText);
    const postsM = rawText.match(/(\d[\d,]*)\s*(?:post|vacancy|vacancies)/i);
    const totalPosts = postsM ? parseInt(postsM[1].replace(/,/g, ''), 10) : 0;
    jobs.push(makeJob({ id, title: rawText, totalPosts, status, applyLink: href }));
  }
  console.log(`  SarkariResult: ${jobs.length} jobs`);
  return jobs;
}

// ─── Source 2: GovtJobsAlert ────────────────────────────────────────────────────

async function crawlGovtJobsAlert() {
  console.log('  Fetching govtjobsalert.in...');
  const html = await fetchPage('https://govtjobsalert.in/');
  console.log(`  Fetched ${html.length} bytes`);
  const jobs = [];
  const seen = new Set();
  const SKIP_SUFFIXES = [
    '/govt-jobs/', '/upsc-jobs/', '/ssc-jobs/', '/railway-jobs/', '/banking-jobs/',
    '/defence-jobs/', '/other-govt-jobs/', '/teaching-faculty-govt-jobs/', '/psu-jobs/',
    '/results/', '/admit-cards/', '/answer-keys/', '/contact-us/', '/privacy-policy/',
    '/disclaimer/', '/about-us/', '/sitemap/', '/page/', '#'
  ];
  const linkRx = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = linkRx.exec(html)) !== null) {
    const href = m[1];
    const rawText = m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (!href.startsWith('https://govtjobsalert.in/')) continue;
    if (SKIP_SUFFIXES.some(s => href.endsWith(s) || href === 'https://govtjobsalert.in/')) continue;
    if (rawText.length < 15) continue;
    const slug = href.split('/').filter(Boolean).pop() || '';
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    // Parse rich text: "Job PostLast Date: 03 Aug 2026UPSSSC...Vacancy: 1829..."
    const status = rawText.startsWith('Result') ? 'results'
      : rawText.startsWith('Admit Card') ? 'admit_card'
      : rawText.startsWith('Answer Key') ? 'answer_key'
      : 'latest';

    // Extract last date
    const ldM = rawText.match(/Last Date:\s*([0-9]{1,2}\s+[A-Za-z]+(?:\s+[0-9]{4})?)/i);
    const lastDateStr = ldM ? ldM[1] : null;

    // Extract vacancy count
    const vacM = rawText.match(/Vacancy:\s*([\d,]+)/i);
    const totalPosts = vacM ? parseInt(vacM[1].replace(/,/g, ''), 10) : 0;

    // Extract org/category
    const orgM = rawText.match(/Org:\s*([A-Za-z]+)/i);
    const orgText = orgM ? orgM[1] : '';
    let category;
    if (orgText === 'Railway') category = 'Railway';
    else if (orgText === 'Banking') category = 'Banking';
    else if (orgText === 'SSC') category = 'SSC';
    else if (orgText === 'Defence') category = 'Defence';
    else category = getCategory(rawText);

    // Strip prefix and trailing metadata to get clean title
    let title = rawText
      .replace(/^(Job Post|Result|Admit Card|Answer Key)(Trending)?/i, '')
      .replace(ldM ? `Last Date: ${ldM[1]}` : '', '')
      .split(/(?:State:|Org:|Vacancy:|Updated on)/i)[0]
      .replace(/&#038;/g, '&')
      .replace(/&#8211;/g, '–')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract salary from title if present
    const salM = title.match(/(₹[\d,]+(?:\s*[–-]\s*₹?[\d,]+)?(?:\s*\/?\s*PM|Per Month)?)/i);
    const salary = salM ? salM[1].trim() : undefined;

    // Clean salary from title for cleanliness
    if (salary) title = title.replace(salary, '').replace(/,\s*$/, '').trim();
    // Remove "Salary" word
    title = title.replace(/,?\s*Salary\s*$/i, '').trim();

    if (title.length < 5) continue;

    jobs.push(makeJob({ id: slug, title, totalPosts, lastDateStr, salary, status, applyLink: href, category }));
  }
  console.log(`  GovtJobsAlert: ${jobs.length} jobs`);
  return jobs;
}

// ─── Merge & Deduplicate ────────────────────────────────────────────────────────

function normalizeTitle(t) {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function merge(src1, src2) {
  const combined = [...src1];
  const existingTitles = new Set(src1.map(j => normalizeTitle(j.title)));
  let added = 0;
  for (const job of src2) {
    const norm = normalizeTitle(job.title);
    if (!existingTitles.has(norm)) {
      combined.push(job);
      existingTitles.add(norm);
      added++;
    }
  }
  console.log(`  Added ${added} unique jobs from GovtJobsAlert not in SarkariResult`);
  return combined;
}

// ─── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🕷️  Starting Dual-Source Job Crawler...\n');

  const [srJobs, gjaJobs] = await Promise.all([
    crawlSarkariResult(),
    crawlGovtJobsAlert()
  ]);

  const merged = merge(srJobs, gjaJobs);
  console.log(`\n📦 Total unique jobs: ${merged.length}`);

  const jsonPath = path.join(__dirname, '..', 'data', 'jobs.json');
  fs.writeFileSync(jsonPath, JSON.stringify(merged, null, 2), 'utf8');
  console.log(`✅ Saved → ${jsonPath}`);

  const tsPath = path.join(__dirname, '..', 'data', 'jobs.ts');
  fs.writeFileSync(tsPath, `// Auto-generated by crawler — do not edit manually\nimport type { Job } from '../types/job';\nimport jobsJson from './jobs.json';\n\nexport const MOCK_JOBS: Job[] = jobsJson as Job[];\n`, 'utf8');
  console.log(`✅ Saved → ${tsPath}`);
  console.log('\n🎉 Crawler completed successfully!\n');
}

main().catch(e => { console.error('❌ Crawler failed:', e); process.exit(1); });

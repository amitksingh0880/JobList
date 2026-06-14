/**
 * Multi-Source Crawler — Scrapes SarkariResult + GovtJobsAlert + IndGovtJobs,
 * crawls detail pages in a concurrency-limited pool, caches crawled URLs to data/crawled_cache.json,
 * merges unique jobs, and writes to data/jobs.json.
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
  
  // Prioritize Teaching category first
  if (t.includes('teacher') || t.includes('teaching') || t.includes(' tet') || t.includes('tgt') || t.includes('pgt') || t.includes('professor') || t.includes('lecturer') || t.includes('school') || t.includes('d.el.ed') || t.includes('ctet') || t.includes('htet') || t.includes('jhtet')) return 'Teaching';

  if ((t.includes('ssc') && !t.includes('upsssc') && !t.includes('hssc') && !t.includes('bssc')) || t.includes('staff selection')) return 'SSC';
  if (t.includes('upsc') || t.includes('union public service')) return 'UPSC';
  if (t.includes('railway') || t.includes('rrb') || t.includes('rrc') || t.includes('ntpc') || t.includes('alp') || t.includes('loco pilot')) return 'Railway';
  if (t.includes('bank') || t.includes('ibps') || t.includes('sbi') || t.includes('rbi') || t.includes('lic') || t.includes('nabard') || t.includes('insurance') || t.includes('po ') || t.includes('clerk') || t.includes('apprentice')) return 'Banking';
  if (t.includes('police') || t.includes('constable') || t.includes('sub inspector') || t.includes(' si ') || t.includes('daroga') || t.includes('bsf') || t.includes('crpf') || t.includes('cisf') || t.includes('itbp') || (t.includes('ssb') && !t.includes('dsssb'))) return 'Police';
  if (t.includes('defence') || t.includes('army') || t.includes('navy') || t.includes('air force') || t.includes('military') || t.includes('nda') || t.includes('cds') || t.includes('agniveer') || t.includes('havildar') || t.includes('jco') || (t.includes('ssb') && !t.includes('dsssb'))) return 'Defence';
  return 'State';
}

function getStatus(text) {
  const t = text.toLowerCase();
  if (t.includes('result') || t.includes('score card') || t.includes('marks out') || t.includes('merit list') || t.includes('cutoff') || t.includes('cut-off') || t.includes('shortlisted')) return 'results';
  if (t.includes('admit card') || t.includes('exam city') || t.includes('hall ticket') || t.includes('call letter') || t.includes('exam date')) return 'admit_card';
  if (t.includes('answer key') || t.includes('answerkey') || t.includes('key paper') || t.includes('response sheet') || t.includes('answer')) return 'answer_key';
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
    const hrefLower = href.toLowerCase();
    const isJobLink = (href.startsWith('https://www.sarkariresult.com/') || href.startsWith('https://sarkariresult.com/')) && 
                      !hrefLower.includes('/latestjob/') && 
                      !hrefLower.includes('/admitcard/') && 
                      !hrefLower.includes('/result/') && 
                      !hrefLower.includes('syllabus') && 
                      !hrefLower.includes('answerkey') && 
                      !hrefLower.includes('answer-key') && 
                      !hrefLower.includes('admission') && 
                      !hrefLower.includes('contactus') && 
                      !hrefLower.includes('about-us') && 
                      !hrefLower.includes('disclaimer') && 
                      !hrefLower.includes('privacy-policy') && 
                      !hrefLower.includes('terms-and-conditions') && 
                      !hrefLower.includes('scholarship') &&
                      !hrefLower.includes('delhi-dsssb') &&
                      !hrefLower.includes('sscall') &&
                      !hrefLower.includes('ibpsall') &&
                      !hrefLower.includes('upscall') &&
                      !hrefLower.includes('tetall') &&
                      !hrefLower.includes('policeall') &&
                      !hrefLower.includes('railwayall') &&
                      !hrefLower.includes('admit-card-download') &&
                      !hrefLower.includes('/result-') &&
                      !hrefLower.endsWith('/delhi/') &&
                      !hrefLower.endsWith('/up/') &&
                      !hrefLower.endsWith('/bihar/') &&
                      !hrefLower.endsWith('/mp/') &&
                      href !== 'https://www.sarkariresult.com/' &&
                      href !== 'https://sarkariresult.com/';
    if (!isJobLink) continue;
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

    // Parse rich text
    const status = rawText.startsWith('Result') ? 'results'
      : rawText.startsWith('Admit Card') ? 'admit_card'
      : rawText.startsWith('Answer Key') ? 'answer_key'
      : 'latest';

    const ldM = rawText.match(/Last Date:\s*([0-9]{1,2}\s+[A-Za-z]+(?:\s+[0-9]{4})?)/i);
    const lastDateStr = ldM ? ldM[1] : null;

    const vacM = rawText.match(/Vacancy:\s*([\d,]+)/i);
    const totalPosts = vacM ? parseInt(vacM[1].replace(/,/g, ''), 10) : 0;

    const orgM = rawText.match(/Org:\s*([A-Za-z]+)/i);
    const orgText = orgM ? orgM[1] : '';
    let category;
    if (orgText === 'Railway') category = 'Railway';
    else if (orgText === 'Banking') category = 'Banking';
    else if (orgText === 'SSC') category = 'SSC';
    else if (orgText === 'Defence') category = 'Defence';
    else category = getCategory(rawText);

    let title = rawText
      .replace(/^(Job Post|Result|Admit Card|Answer Key)(Trending)?/i, '')
      .replace(ldM ? `Last Date: ${ldM[1]}` : '', '')
      .split(/(?:State:|Org:|Vacancy:|Updated on)/i)[0]
      .replace(/&#038;/g, '&')
      .replace(/&#8211;/g, '–')
      .replace(/\s+/g, ' ')
      .trim();

    const salM = title.match(/(₹[\d,]+(?:\s*[–-]\s*₹?[\d,]+)?(?:\s*\/?\s*PM|Per Month)?)/i);
    const salary = salM ? salM[1].trim() : undefined;

    if (salary) title = title.replace(salary, '').replace(/,\s*$/, '').trim();
    title = title.replace(/,?\s*Salary\s*$/i, '').trim();

    if (title.length < 5) continue;

    jobs.push(makeJob({ id: slug, title, totalPosts, lastDateStr, salary, status, applyLink: href, category }));
  }
  console.log(`  GovtJobsAlert: ${jobs.length} jobs`);
  return jobs;
}

// ─── Source 3: IndGovtJobs ──────────────────────────────────────────────────────

async function crawlIndGovtJobs() {
  console.log('  Fetching indgovtjobs.in...');
  const html = await fetchPage('https://www.indgovtjobs.in/');
  console.log(`  Fetched ${html.length} bytes`);
  const jobs = [];
  const seen = new Set();
  
  // Format: <h1 class='post-title entry-title'><a href='LINK'>TITLE</a></h1>
  const linkRx = /<h\d\s+class=['"]post-title[^'"]*['"]>\s*<a\s+[^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = linkRx.exec(html)) !== null) {
    const href = m[1];
    const rawText = m[2]
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .replace(/&#8211;/g, '–')
      .replace(/&#8217;/g, "'")
      .replace(/&#038;/g, '&')
      .trim();
      
    if (!href.startsWith('https://www.indgovtjobs.in/') && !href.startsWith('https://indgovtjobs.in/')) continue;
    if (href.includes('/p/') || href.endsWith('.html') === false) continue; // Skip static pages
    
    const slug = href.split('/').filter(Boolean).pop().replace('.html', '');
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    
    const status = getStatus(rawText);
    jobs.push(makeJob({ id: slug, title: rawText, status, applyLink: href, category: getCategory(rawText) }));
  }
  console.log(`  IndGovtJobs: ${jobs.length} jobs`);
  return jobs;
}

// ─── Detail Page Parser & Queue ──────────────────────────────────────────────────

function parseDate(dateStr) {
  if (!dateStr) return null;
  const clean = dateStr.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  
  // 11/05/2026 or 11-05-2026 or 11.05.2026
  const slashM = clean.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (slashM) {
    const day = parseInt(slashM[1], 10);
    const month = parseInt(slashM[2], 10) - 1;
    const year = parseInt(slashM[3], 10);
    const d = new Date(Date.UTC(year, month, day));
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  
  // 12 July 2026 or July 12, 2026
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const monthsShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  
  const textM = clean.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/i);
  if (textM) {
    const day = parseInt(textM[1], 10);
    const monthName = textM[2].toLowerCase().trim();
    const year = parseInt(textM[3], 10);
    let month = months.indexOf(monthName);
    if (month === -1) month = monthsShort.indexOf(monthName);
    if (month !== -1) {
      const d = new Date(Date.UTC(year, month, day));
      return isNaN(d.getTime()) ? null : d.toISOString();
    }
  }

  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }
  return null;
}

function parseDetailPage(html, url, title, existingJob) {
  const parsed = {
    qualification: existingJob.qualification,
    totalPosts: existingJob.totalPosts,
    lastDate: existingJob.lastDate,
    notificationDate: existingJob.notificationDate,
    applicationStartDate: existingJob.applicationStartDate,
    applicationEndDate: existingJob.applicationEndDate,
    ageLimit: { ...existingJob.ageLimit },
    applicationFee: { ...existingJob.applicationFee },
    applyLink: existingJob.applyLink,
    notificationLink: existingJob.notificationLink || existingJob.applyLink,
    importantDates: [ ...existingJob.importantDates ],
    salary: existingJob.salary,
    description: existingJob.description,
  };

  try {
    // Extract main article body to avoid matching links in headers, sidebars, or footers
    let mainContent = html;
    const articleM = html.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i);
    if (articleM) {
      mainContent = articleM[1];
    } else {
      const tableM = html.match(/<table[\s\S]*?>([\s\S]*?)<\/table>/i);
      if (tableM) {
        mainContent = tableM[1];
      }
    }

    // 1. Extract links (PDF Notification and Apply Online)
    let foundPdf = false;
    let foundApply = false;
    const linkRx = /<a\s+([^>]*?)\bhref=["']([^"']+)["']([^>]*?)>([\s\S]*?)<\/a>/gi;
    let lm;
    while ((lm = linkRx.exec(mainContent)) !== null) {
      const attrs = (lm[1] + ' ' + lm[3]).toLowerCase();
      const href = lm[2].trim();
      const innerText = lm[4].replace(/<[^>]*>/g, '').trim().toLowerCase();
      
      const isPdf = href.endsWith('.pdf') || href.includes('files.govtjobsalert.in') || href.includes('drive.google.com/file');
      const isNotificationText = innerText.includes('notification') || innerText.includes('brochure') || innerText.includes('advertisement') || innerText.includes('pdf') || attrs.includes('notification') || attrs.includes('brochure');
      
      if ((isPdf || isNotificationText) && !foundPdf && href.startsWith('http')) {
        parsed.notificationLink = href;
        foundPdf = true;
      }
      
      const isApplyText = innerText.includes('apply online') || innerText.includes('apply link') || attrs.includes('apply');
      if (isApplyText && !foundApply && href.startsWith('http') && !isPdf) {
        parsed.applyLink = href;
        foundApply = true;
      }
    }

    // 2. Parse tables
    const importantDates = [];
    let tableParsedDate = null;
    let tableStartDate = null;
    
    const trRx = /<tr>([\s\S]*?)<\/tr>/gi;
    let trm;
    while ((trm = trRx.exec(mainContent)) !== null) {
      const trHtml = trm[1];
      const cells = [];
      const tdRx = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
      let tdm;
      while ((tdm = tdRx.exec(trHtml)) !== null) {
        cells.push(tdm[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
      }
      if (cells.length >= 2) {
        const label = cells[0];
        const val = cells[1];
        const cleanLabel = label.toLowerCase();
        
        if (cleanLabel.includes('date') || cleanLabel.includes('released') || cleanLabel.includes('apply begin') || cleanLabel.includes('notification')) {
          const isoDate = parseDate(val);
          if (isoDate) {
            importantDates.push({ label, date: isoDate });
            if (cleanLabel.includes('last date') || cleanLabel.includes('closing') || cleanLabel.includes('end')) {
              tableParsedDate = isoDate;
            }
            if (cleanLabel.includes('start') || cleanLabel.includes('begin') || cleanLabel.includes('notification')) {
              tableStartDate = isoDate;
            }
          }
        }
        
        if (cleanLabel.includes('vacancy') || cleanLabel.includes('vacancies') || cleanLabel.includes('post') || cleanLabel.includes('posts')) {
          const num = parseInt(val.replace(/,/g, ''), 10);
          if (!isNaN(num) && num > 0) {
            parsed.totalPosts = num;
          }
        }
        
        if (cleanLabel.includes('qualification') || cleanLabel.includes('eligibility') || cleanLabel.includes('edu')) {
          parsed.qualification = val;
        }
        
        if (cleanLabel.includes('fee')) {
          const feeNum = parseInt(val.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(feeNum)) {
            parsed.applicationFee.general = feeNum;
            parsed.applicationFee.sc_st = Math.floor(feeNum / 2);
          }
        }
        
        if (cleanLabel.includes('salary') || cleanLabel.includes('pay scale') || cleanLabel.includes('remuneration') || cleanLabel.includes('stipend')) {
          parsed.salary = val;
        }
        
        if (cleanLabel.includes('age limit') || cleanLabel.includes('age criteria')) {
          const minM = val.match(/(?:min|minimum|least|above)\s*(\d+)/i);
          if (minM) parsed.ageLimit.min = parseInt(minM[1], 10);
          const maxM = val.match(/(?:max|maximum|not exceeding)\s*(\d+)/i);
          if (maxM) parsed.ageLimit.max = parseInt(maxM[1], 10);
        }
      }
    }

    // 3. Fallback list-based details parsing (SarkariResult lists)
    let listParsedDate = null;
    let listStartDate = null;
    const liRx = /<li>([\s\S]*?)<\/li>/gi;
    let lim;
    while ((lim = liRx.exec(mainContent)) !== null) {
      const cleanLi = lim[1].replace(/<[^>]*>/g, '').trim();
      const parts = cleanLi.split(':');
      if (parts.length >= 2) {
        const label = parts[0].trim();
        const val = parts.slice(1).join(':').trim();
        const cleanLabel = label.toLowerCase();
        
        if (cleanLabel.includes('begin') || cleanLabel.includes('start')) {
          const d = parseDate(val);
          if (d) {
            listStartDate = d;
            importantDates.push({ label, date: d });
          }
        }
        if (cleanLabel.includes('last date') || cleanLabel.includes('registration') || cleanLabel.includes('apply online last')) {
          const d = parseDate(val);
          if (d) {
            listParsedDate = d;
            importantDates.push({ label, date: d });
          }
        }
        if (cleanLabel.includes('general') || cleanLabel.includes('obc') || cleanLabel.includes('ews')) {
          const fee = parseInt(val.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(fee)) parsed.applicationFee.general = fee;
        }
        if (cleanLabel.includes('sc') || cleanLabel.includes('st') || cleanLabel.includes('ph')) {
          const fee = parseInt(val.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(fee)) parsed.applicationFee.sc_st = fee;
        }
        if (cleanLabel.includes('female')) {
          const fee = parseInt(val.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(fee)) parsed.applicationFee.female = fee;
        }
        if (cleanLabel.includes('minimum') || cleanLabel.includes('min age')) {
          const age = parseInt(val.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(age)) parsed.ageLimit.min = age;
        }
        if (cleanLabel.includes('maximum') || cleanLabel.includes('max age')) {
          const age = parseInt(val.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(age)) parsed.ageLimit.max = age;
        }
      }
    }

    // 4. Consolidate dates
    const finalStartDate = tableStartDate || listStartDate || parsed.applicationStartDate;
    const finalEndDate = tableParsedDate || listParsedDate || parsed.applicationEndDate;
    
    parsed.applicationStartDate = finalStartDate;
    parsed.notificationDate = finalStartDate;
    parsed.applicationEndDate = finalEndDate;
    parsed.lastDate = finalEndDate;

    if (importantDates.length > 0) {
      const seenLabels = new Set();
      parsed.importantDates = importantDates.filter(d => {
        const lNorm = d.label.toLowerCase().trim();
        if (seenLabels.has(lNorm)) return false;
        seenLabels.add(lNorm);
        return true;
      });
    } else {
      parsed.importantDates = [
        { label: 'Notification Released', date: finalStartDate },
        { label: 'Application Start Date', date: finalStartDate },
        { label: 'Last Date to Apply', date: finalEndDate }
      ];
    }

  } catch (err) {
    console.error('Error parsing detail page:', err);
  }

  return parsed;
}

const cachePath = path.join(__dirname, '..', 'data', 'crawled_cache.json');
function loadCache() {
  if (fs.existsSync(cachePath)) {
    try {
      return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveCache(cache) {
  try {
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save cache:', e);
  }
}

async function processQueue(queue, cache) {
  const limit = 5;
  let index = 0;
  
  async function worker() {
    while (index < queue.length) {
      const idx = index++;
      const item = queue[idx];
      if (!item) break;
      
      try {
        console.log(`    [${idx + 1}/${queue.length}] Fetching details: ${item.url}`);
        const html = await fetchPage(item.url);
        const parsed = parseDetailPage(html, item.url, item.job.title, item.job);
        
        // Save to cache
        cache[item.job.id] = parsed;
        
        // Merge into job
        Object.assign(item.job, parsed);
        
        // Save cache incrementally every 10 pages parsed
        if ((idx + 1) % 10 === 0) {
          saveCache(cache);
        }
      } catch (e) {
        console.error(`    ❌ Failed: ${item.job.id} (${e.message})`);
      }
      
      await new Promise(r => setTimeout(r, 200));
    }
  }
  
  const workers = Array.from({ length: Math.min(limit, queue.length) }, () => worker());
  await Promise.all(workers);
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
  console.log(`  Added ${added} unique jobs from new source`);
  return combined;
}

// ─── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🕷️  Starting Multi-Source Job Crawler...\n');

  // 1. Crawl homepages to get basic listings
  const [srJobs, gjaJobs, igjJobs] = await Promise.all([
    crawlSarkariResult().catch(e => { console.error('SarkariResult listing fetch failed:', e); return []; }),
    crawlGovtJobsAlert().catch(e => { console.error('GovtJobsAlert listing fetch failed:', e); return []; }),
    crawlIndGovtJobs().catch(e => { console.error('IndGovtJobs listing fetch failed:', e); return []; })
  ]);

  // Merge listings
  let combined = merge(srJobs, gjaJobs);
  combined = merge(combined, igjJobs);

  console.log(`\n📦 Discovered ${combined.length} unique jobs in total.`);

  // 2. Load cache
  const cache = loadCache();

  // 3. Prepare queue of jobs that need crawling
  const queue = [];
  for (const job of combined) {
    if (cache[job.id]) {
      // Reuse cached details
      Object.assign(job, cache[job.id]);
    } else {
      queue.push({ job, url: job.applyLink });
    }
  }

  console.log(`    Cached jobs: ${combined.length - queue.length}`);
  console.log(`    Jobs to crawl: ${queue.length}`);

  // 4. Crawl and enrich jobs in concurrency pool
  if (queue.length > 0) {
    await processQueue(queue, cache);
  }

  // Save updated cache
  saveCache(cache);

  // Final check/cleanups and strict deduplication
  const today = new Date();
  const uniqueJobs = [];
  const seenUrls = new Set();
  const seenTitles = new Set();

  for (const job of combined) {
    const titleLower = job.title.toLowerCase();
    const idLower = job.id.toLowerCase();
    
    // Strict non-job page filtering (scholarships, admissions, syllabus, contact etc.)
    if (titleLower.includes('scholarship') || idLower.includes('scholarship') ||
        titleLower.includes('admission') || idLower.includes('admission') ||
        titleLower.includes('syllabus') || idLower.includes('syllabus')) {
      console.log(`  Excluding non-job entry: ${job.title}`);
      continue;
    }

    const url = (job.applyLink || '').toLowerCase().trim();
    const normTitle = job.title.toLowerCase()
      .replace(/recruitment|online form|apply|result|admit card|answer key|vacancy|vacancies|job/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();

    // Deduplicate by URL and normalized title
    if (url && seenUrls.has(url)) {
      console.log(`  Removing duplicate URL entry: ${job.title} (${url})`);
      continue;
    }
    if (normTitle && seenTitles.has(normTitle)) {
      console.log(`  Removing duplicate title entry: ${job.title} (${normTitle})`);
      continue;
    }

    if (url) seenUrls.add(url);
    if (normTitle) seenTitles.add(normTitle);

    // Set urgent/new flags based on actual dates
    if (job.lastDate) {
      const last = new Date(job.lastDate);
      job.isUrgent = (last.getTime() - today.getTime()) < 3 * 86400000 && (last.getTime() - today.getTime()) > 0;
    }
    if (job.notificationDate) {
      const notif = new Date(job.notificationDate);
      job.isNew = (today.getTime() - notif.getTime()) < 3 * 86400000;
    }

    uniqueJobs.push(job);
  }

  // 5. Save output
  const jsonPath = path.join(__dirname, '..', 'data', 'jobs.json');
  fs.writeFileSync(jsonPath, JSON.stringify(uniqueJobs, null, 2), 'utf8');
  console.log(`✅ Saved → ${jsonPath}`);

  const tsPath = path.join(__dirname, '..', 'data', 'jobs.ts');
  fs.writeFileSync(tsPath, `// Auto-generated by crawler — do not edit manually\nimport type { Job } from '../types/job';\nimport jobsJson from './jobs.json';\n\nexport const MOCK_JOBS: Job[] = jobsJson as Job[];\n`, 'utf8');
  console.log(`✅ Saved → ${tsPath}`);
  console.log('\n🎉 Crawler completed successfully!\n');
}

main().catch(e => { console.error('❌ Crawler failed:', e); process.exit(1); });

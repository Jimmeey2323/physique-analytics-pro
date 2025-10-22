import Papa from 'papaparse';
import JSZip from 'jszip';
import { DateTime } from 'luxon';
import Fuse from 'fuse.js';
import { ProcessedData, RawDataRow } from '@/types/data';

function safeNumber(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  const n = Number(String(val).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function toLowerTrim(s = ''): string {
  return String(s || '').trim().toLowerCase();
}

export function getCleanedClass(sessionNameRaw: string): string {
  const sessionName = toLowerTrim(sessionNameRaw);
  if (!sessionName) return "Unknown Class";

  const rules: Array<{pattern: RegExp, map: () => string}> = [
    { pattern: /barre\s*57|barre57/, map: () => /express/.test(sessionName) ? "Studio Barre 57 Express" : "Studio Barre 57" },
    { pattern: /\bmat\b/, map: () => /express/.test(sessionName) ? "Studio Mat 57 Express" : "Studio Mat 57" },
    { pattern: /trainer('|')?s?\b|trainer\b/, map: () => /express/.test(sessionName) ? "Studio Trainer's Choice Express" : "Studio Trainer's Choice" },
    { pattern: /cardio\s*barre|cardio barre|studio cardio/, map: () => /plus/.test(sessionName) ? "Studio Cardio Barre Plus" : (/express/.test(sessionName) ? "Studio Cardio Barre Express" : "Studio Cardio Barre") },
    { pattern: /back\s*body|backbody/, map: () => /express/.test(sessionName) ? "Studio Back Body Blaze Express" : "Studio Back Body Blaze" },
    { pattern: /\bfit\b/, map: () => /express/.test(sessionName) ? "Studio FIT Express" : "Studio FIT" },
    { pattern: /power\s*cycle|powercycle/, map: () => /express/.test(sessionName) ? "Studio powerCycle Express" : "Studio powerCycle" },
    { pattern: /amped/, map: () => /express/.test(sessionName) ? "Studio Amped Up! Express" : "Studio Amped Up!" },
    { pattern: /sweat/, map: () => /express/.test(sessionName) ? "Studio SWEAT In 30 Express" : "Studio SWEAT In 30" },
    { pattern: /foundation|foundations/, map: () => /express/.test(sessionName) ? "Studio Foundations Express" : "Studio Foundations" },
    { pattern: /recovery/, map: () => /express/.test(sessionName) ? "Studio Recovery Express" : "Studio Recovery" },
    { pattern: /pre[\/\-\s]?post|prepost|prenatal|postnatal/, map: () => "Studio Pre/Post Natal" },
    { pattern: /hiit/, map: () => /express/.test(sessionName) ? "Studio HIIT Express" : "Studio HIIT" },
    { pattern: /host(ed)?|bridal|workshop|community|outdoor|birthday|wework|host|pop|raheja|rugby|olympics/, map: () => "Studio Hosted Class" },
  ];

  for (const r of rules) {
    if (r.pattern.test(sessionName)) return r.map();
  }

  const synonyms = [
    { key: "Studio Barre 57", variants: ["barre", "barre 57"] },
    { key: "Studio Cardio Barre", variants: ["cardio", "cardio barre"] },
  ];
  const fuse = new Fuse(synonyms, { keys: ['variants'], threshold: 0.3 });
  const res = fuse.search(sessionName);
  if (res.length) return res[0].item.key;

  return sessionNameRaw.trim();
}

function parseDateTime(raw: string): { iso: string | null, time: string, dateStr: string, dayOfWeek: string, period: string } {
  let dt: DateTime | null = null;
  const parts = String(raw || '').split(',').map(p => p.trim());
  
  if (parts.length >= 2) {
    const datePart = parts[0];
    const timePart = parts[1];
    dt = DateTime.fromSQL(`${datePart} ${timePart}`, { zone: 'Asia/Kolkata' });
    if (!dt.isValid) {
      dt = DateTime.fromFormat(`${datePart} ${timePart}`, 'yyyy-MM-dd h:mm a', { zone: 'Asia/Kolkata' });
    }
  } else {
    dt = DateTime.fromISO(String(raw || ''), { zone: 'Asia/Kolkata' });
  }

  if (!dt || !dt.isValid) return { iso: null, time: '', dateStr: '', dayOfWeek: '', period: '' };

  const time = dt.toFormat('h:mm a');
  const dateStr = dt.toFormat('yyyy-MM-dd');
  const dayOfWeek = dt.toFormat('cccc');
  const period = dt.toFormat('LLL-yy');
  return { iso: dt.toISO(), time, dateStr, dayOfWeek, period };
}

export function processRawData(rawData: RawDataRow[]) {
  const processedDataMap = new Map<string, ProcessedData>();
  const individualClasses: ProcessedData[] = [];

  rawData.forEach((row, idx) => {
    try {
      const teacherFirstName = row['Teacher First Name'] || row['teacher first name'] || '';
      const teacherLastName = row['Teacher Last Name'] || row['teacher last name'] || '';
      const teacherName = `${teacherFirstName} ${teacherLastName}`.trim();
      const teacherEmail = row['Teacher Email'] || row['teacher email'] || '';
      const classNameRaw = row['Class name'] || row['Class Name'] || row['class name'] || '';
      const classDateRaw = row['Class date'] || row['Class Date'] || '';
      const location = String(row['Location'] || row['location'] || 'Unknown').trim();
      const totalTime = safeNumber(row['Total time (h)'] || row['Time (h)'] || row['Time'] || 0);

      const checkedIn = row['Checked in'] ? (String(row['Checked in']).toLowerCase().startsWith('y') ? 1 : safeNumber(row['Checked in'])) : 0;
      const comp = safeNumber(row['Comp'] || row['Comps'] || row['Checked In Comps']);
      const lateCancelled = row['Late Cancelled'] || row['Late cancellations'] || row['late cancellations'] ? safeNumber(row['Late Cancelled'] || row['Late cancellations']) : 0;
      const paid = safeNumber(row['Paid'] || row['Paid Amount'] || row['Total Revenue'] || row['Paid']);

      const cleanedClass = getCleanedClass(classNameRaw);
      const dt = parseDateTime(classDateRaw);

      const uniqueIdBase = `${cleanedClass}-${dt.dateStr || 'unknown'}-${dt.time || 'unknown'}-${location}-${teacherName}`;
      const uniqueID = `${uniqueIdBase.replace(/\s+/g, '_')}-${idx}`;

      // Assume capacity of 12 for most classes
      const capacity = 12;
      const fillRate = checkedIn > 0 ? (checkedIn / capacity) * 100 : 0;
      const lateCancellationRate = (checkedIn + lateCancelled) > 0 ? (lateCancelled / (checkedIn + lateCancelled)) * 100 : 0;
      const revenuePerAttendee = checkedIn > 0 ? paid / checkedIn : 0;

      const classRecord: ProcessedData = {
        teacherName,
        teacherEmail,
        totalTime,
        location,
        cleanedClass,
        classTime: dt.time,
        date: dt.dateStr,
        dayOfWeek: dt.dayOfWeek,
        period: dt.period,
        totalCheckins: checkedIn,
        totalOccurrences: 1,
        totalRevenue: paid,
        totalCancelled: lateCancelled,
        totalEmpty: checkedIn > 0 ? 0 : 1,
        totalNonEmpty: checkedIn > 0 ? 1 : 0,
        totalNonPaid: comp + safeNumber(row['Non Paid Customers']),
        classAverageIncludingEmpty: checkedIn,
        classAverageExcludingEmpty: checkedIn > 0 ? checkedIn : 0,
        uniqueID,
        capacity,
        fillRate,
        lateCancellationRate,
        revenuePerAttendee,
      };

      individualClasses.push(classRecord);

      const key = `${cleanedClass}||${dt.dayOfWeek}||${dt.time}||${location}||${teacherName}`;
      if (processedDataMap.has(key)) {
        const existing = processedDataMap.get(key)!;
        existing.totalCheckins += classRecord.totalCheckins;
        existing.totalOccurrences += 1;
        existing.totalRevenue = (existing.totalRevenue || 0) + classRecord.totalRevenue;
        existing.totalCancelled += classRecord.totalCancelled;
        existing.totalNonPaid += classRecord.totalNonPaid;
        existing.totalEmpty += classRecord.totalEmpty;
        existing.totalNonEmpty += classRecord.totalNonEmpty;
      } else {
        processedDataMap.set(key, { ...classRecord });
      }
    } catch (err) {
      console.error('row processing error', idx, err, row);
    }
  });

  const aggregated = Array.from(processedDataMap.values()).map(rec => {
    rec.classAverageIncludingEmpty = rec.totalOccurrences > 0 ? Number((rec.totalCheckins / rec.totalOccurrences).toFixed(1)) : 0;
    rec.classAverageExcludingEmpty = rec.totalNonEmpty > 0 ? Number((rec.totalCheckins / rec.totalNonEmpty).toFixed(1)) : 0;
    rec.totalRevenue = Number(rec.totalRevenue || 0);
    rec.fillRate = rec.totalOccurrences > 0 && rec.capacity ? (rec.classAverageIncludingEmpty / rec.capacity) * 100 : 0;
    rec.lateCancellationRate = (rec.totalCheckins + rec.totalCancelled) > 0 ? (rec.totalCancelled / (rec.totalCheckins + rec.totalCancelled)) * 100 : 0;
    rec.revenuePerAttendee = rec.totalCheckins > 0 ? rec.totalRevenue / rec.totalCheckins : 0;
    return rec;
  });

  return { individualClasses, aggregated };
}

export async function parseZipFile(file: File): Promise<RawDataRow[]> {
  const zip = await JSZip.loadAsync(file);
  const csvFiles = Object.keys(zip.files).filter(name => 
    name.toLowerCase().endsWith('.csv') && 
    (name.includes('momence') || name.includes('payroll') || name.includes('report'))
  );

  if (csvFiles.length === 0) {
    throw new Error('No valid CSV file found in ZIP');
  }

  const csvFile = zip.files[csvFiles[0]];
  const csvText = await csvFile.async('text');
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        resolve(results.data as RawDataRow[]);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export async function parseCSVFile(file: File): Promise<RawDataRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        resolve(results.data as RawDataRow[]);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export function formatCurrency(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function exportToCSV(data: ProcessedData[], filename: string) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

import { LS } from '@/lib/storage';

// ============================================================
// BODY TRACKING ALGORITHMS
// ============================================================

/** Load all body logs from localStorage, sorted by date ascending */
export function loadBodyLogs() {
 const keys = LS.keys('bodyLog:');
 return keys
.map(k => ({ date: k.replace('bodyLog:', ''), ...LS.get(k, {}) }))
.filter(l => l.date && l.weight && Number(l.weight) > 0 && isFinite(Number(l.weight)))
.sort((a, b) => a.date.localeCompare(b.date));
}

/** Load all body logs (including those without weight, for nutrition chart) */
export function loadAllBodyLogs() {
 const keys = LS.keys('bodyLog:');
 return keys
.map(k => ({ date: k.replace('bodyLog:', ''), ...LS.get(k, {}) }))
.filter(l => l.date)
.sort((a, b) => a.date.localeCompare(b.date));
}

// --- Weight Smoothing ---

/** Exponential weighted moving average (EWMA) (α=0.05, ~20-day window) */
export function smoothEWMA(logs, alpha = 0.05) {
 if (logs.length === 0) return [];
 // Fill gaps with linear interpolation first
 const filled = interpolateMissing(logs);
 const result = [];
 let trend = filled[0].weight;
 for (const entry of filled) {
 trend = alpha * entry.weight + (1 - alpha) * trend;
 result.push({ date: entry.date, raw: entry.weight, trend: Math.round(trend * 100) / 100 });
 }
 return result;
}

/** Bidirectional smoothing */
export function smoothBidirectional(logs, alpha = 0.05) {
 if (logs.length === 0) return [];
 const filled = interpolateMissing(logs);
 // Forward EMA
 const forward = [];
 let fTrend = filled[0].weight;
 for (const entry of filled) {
 fTrend = alpha * entry.weight + (1 - alpha) * fTrend;
 forward.push(fTrend);
 }
 // Backward EMA
 const backward = [];
 let bTrend = filled[filled.length - 1].weight;
 for (let i = filled.length - 1; i >= 0; i--) {
 bTrend = alpha * filled[i].weight + (1 - alpha) * bTrend;
 backward.unshift(bTrend);
 }
 // Weighted average: 60% forward, 40% backward
 return filled.map((entry, i) => ({
 date: entry.date,
 raw: entry.weight,
 trend: Math.round((forward[i] * 0.6 + backward[i] * 0.4) * 100) / 100,
 }));
}

/** Time-adaptive EMA */
export function smoothTimeAdaptive(logs, smoothingDays = 7) {
 if (logs.length === 0) return [];
 const MS_PER_DAY = 86400000;
 const result = [];
 let trend = logs[0].weight;
 let prevDate = new Date(logs[0].date + 'T12:00:00').getTime();
 result.push({ date: logs[0].date, raw: logs[0].weight, trend: Math.round(trend * 100) / 100 });
 for (let i = 1; i < logs.length; i++) {
 const curDate = new Date(logs[i].date + 'T12:00:00').getTime();
 const timeDelta = curDate - prevDate;
 const alpha = 1 - Math.exp(-timeDelta / (smoothingDays * MS_PER_DAY));
 trend = alpha * logs[i].weight + (1 - alpha) * trend;
 result.push({ date: logs[i].date, raw: logs[i].weight, trend: Math.round(trend * 100) / 100 });
 prevDate = curDate;
 }
 return result;
}

/** Fill date gaps via linear interpolation for EWMA algorithms */
export function interpolateMissing(logs) {
 if (logs.length < 2) return logs.map(l => ({ date: l.date, weight: Number(l.weight) }));
 const result = [];
 for (let i = 0; i < logs.length; i++) {
 result.push({ date: logs[i].date, weight: Number(logs[i].weight) });
 if (i < logs.length - 1) {
 const d1 = new Date(logs[i].date + 'T12:00:00');
 const d2 = new Date(logs[i + 1].date + 'T12:00:00');
 const gap = Math.round((d2 - d1) / 86400000);
 if (gap > 1) {
 const w1 = Number(logs[i].weight), w2 = Number(logs[i + 1].weight);
 for (let g = 1; g < gap; g++) {
 const d = new Date(d1); d.setDate(d.getDate() + g);
 result.push({
 date: d.toISOString().split('T')[0],
 weight: Math.round((w1 + (w2 - w1) * (g / gap)) * 100) / 100,
 });
 }
 }
 }
 }
 return result;
}

/** Get smoothed weight data using selected method */
export function getSmoothedWeights(logs, config) {
 const method = config?.smoothingMethod || 'ewma';
 switch (method) {
 case 'bidirectional': return smoothBidirectional(logs);
 case 'timeadaptive': return smoothTimeAdaptive(logs, config?.adaptiveSmoothingDays || 7);
 default: return smoothEWMA(logs);
 }
}

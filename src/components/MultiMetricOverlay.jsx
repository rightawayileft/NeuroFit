import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Activity, ChevronDown } from 'lucide-react';
import { T } from '@/design/tokens';
import { DEFAULT_NUTRITION_CONFIG } from '@/data/defaults';
import { today, subtractDays } from '@/lib/dateUtils';
import { loadAllBodyLogs, smoothEWMA } from '@/lib/weightSmoothing';
import GlassCard from '@/components/GlassCard';

const OVERLAY_METRICS = [
 { key: 'weight', label: 'Weight (trend)', unit: 'lbs', color: '#FF6B35' },
 { key: 'bodyFat', label: 'Body Fat %', unit: '%', color: '#4ECDC4' },
 { key: 'calories', label: 'Calories', unit: 'kcal', color: '#FFB74D' },
 { key: 'protein', label: 'Protein', unit: 'g', color: '#00E676' },
 { key: 'tdee', label: 'TDEE', unit: 'kcal', color: '#FF5252' },
 { key: 'waist', label: 'Waist', unit: 'in', color: '#AB47BC' },
 { key: 'sleep', label: 'Sleep Hours', unit: 'hr', color: '#42A5F5' },
 { key: 'hrv', label: 'HRV', unit: 'ms', color: '#EF5350' },
];

// Standalone pill-button dropdown for choosing an overlay metric
const MetricPicker = ({ value, onChange, exclude }) => {
 const [open, setOpen] = useState(false);
 const ref = useRef(null);
 const selected = OVERLAY_METRICS.find(m => m.key === value) || OVERLAY_METRICS[0];
 const options = OVERLAY_METRICS.filter(m => m.key !== exclude);

 useEffect(() => {
 if (!open) return;
 const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
 document.addEventListener('mousedown', handler);
 return () => document.removeEventListener('mousedown', handler);
 }, [open]);

 return (
 <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
 <button onClick={() => setOpen(o => !o)} style={{
 display: 'flex', alignItems: 'center', gap: '5px',
 background: open ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)',
 border: `1px solid ${open ? T.tealGlow : T.border}`, borderRadius: '16px',
 color: T.text, fontSize: '11px', padding: '5px 10px 5px 8px', cursor: 'pointer',
 fontFamily: T.font, transition: 'all 0.15s', outline: 'none', whiteSpace: 'nowrap',
 }}>
 <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: selected.color, flexShrink: 0 }} />
 <span style={{ fontWeight: 500 }}>{selected.label}</span>
 <ChevronDown size={11} style={{ opacity: 0.5, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
 </button>
 {open && (
 <div style={{
 position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100,
 background: 'rgba(22,22,30,0.97)', backdropFilter: 'blur(16px)',
 border: `1px solid ${T.border}`, borderRadius: '10px',
 padding: '4px', minWidth: '150px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
 }}>
 {options.map(m => (
 <button key={m.key} onClick={() => { onChange(m.key); setOpen(false); }} style={{
 display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
 padding: '7px 10px', border: 'none', borderRadius: '7px', cursor: 'pointer',
 background: m.key === value ? 'rgba(78,205,196,0.12)' : 'transparent',
 color: T.text, fontSize: '11px', fontFamily: T.font, textAlign: 'left',
 transition: 'background 0.12s',
 }}
 onMouseEnter={e => { if (m.key !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
 onMouseLeave={e => { if (m.key !== value) e.currentTarget.style.background = 'transparent'; }}
 >
 <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.color, flexShrink: 0 }} />
 <span style={{ flex: 1, fontWeight: m.key === value ? 600 : 400 }}>{m.label}</span>
 <span style={{ fontSize: '9px', color: T.text3, fontFamily: T.mono }}>{m.unit}</span>
 </button>
 ))}
 </div>
 )}
 </div>
 );
};

function MultiMetricOverlay({ settings, nutritionConfig, allBodyLogs, bodyLogs }) {
 const [primaryKey, setPrimaryKey] = useState('weight');
 const [secondaryKey, setSecondaryKey] = useState('calories');
 const [range, setRange] = useState('1M');
 const [hoverIdx, setHoverIdx] = useState(null);
 const cfg = nutritionConfig || DEFAULT_NUTRITION_CONFIG;
 const weightUnit = cfg.weightUnit || 'lbs';
 const waistUnit = cfg.waistUnit || 'in';

 // Build all metric series from body logs and TDEE history
 const allSeries = useMemo(() => {
 const logs = allBodyLogs || loadAllBodyLogs();
 const weightLogs = bodyLogs || logs.filter(l => l.weight);
 const smoothed = weightLogs.length >= 2 ? smoothEWMA(weightLogs) : [];

 // Build TDEE lookup from history
 const tdeeHist = (cfg.tdeeHistory || []).reduce((m, e) => { m[e.date] = e.value; return m; }, {});

 const series = {};

 // Weight trend
 series.weight = smoothed.map(s => ({ date: s.date, value: s.trend }));

 // Body fat (calibrated or raw)
 series.bodyFat = logs.filter(l => l.bodyFat?.value || l.bodyFat?.calibratedValue).map(l => ({
 date: l.date,
 value: Number(l.bodyFat.calibratedValue || l.bodyFat.value),
 })).filter(d => d.value > 0);

 // Calories
 series.calories = logs.filter(l => l.calories).map(l => ({ date: l.date, value: Number(l.calories) }));

 // Protein
 series.protein = logs.filter(l => l.protein).map(l => ({ date: l.date, value: Number(l.protein) }));

 // TDEE
 series.tdee = Object.entries(tdeeHist).map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));

 // Waist
 series.waist = logs.filter(l => l.waistCircumference).map(l => ({ date: l.date, value: Number(l.waistCircumference) }));

 // Sleep
 series.sleep = logs.filter(l => l.sleep?.hours).map(l => ({ date: l.date, value: Number(l.sleep.hours) }));

 // HRV
 series.hrv = logs.filter(l => l.sleep?.hrv).map(l => ({ date: l.date, value: Number(l.sleep.hrv) }));

 return series;
 }, [cfg.tdeeHistory, allBodyLogs, bodyLogs]);

 // Filter by time range and align dates
 const { primaryData, secondaryData, alignedDates } = useMemo(() => {
 const ranges = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 99999 };
 const cutoff = subtractDays(today(), ranges[range] || 30);

 const pRaw = (allSeries[primaryKey] || []).filter(d => d.date >= cutoff);
 const sRaw = (allSeries[secondaryKey] || []).filter(d => d.date >= cutoff);

 // Build union of all dates, sorted
 const dateSet = new Set([...pRaw.map(d => d.date),...sRaw.map(d => d.date)]);
 const dates = [...dateSet].sort();

 // Build lookup maps
 const pMap = pRaw.reduce((m, d) => { m[d.date] = d.value; return m; }, {});
 const sMap = sRaw.reduce((m, d) => { m[d.date] = d.value; return m; }, {});

 return {
 primaryData: dates.map(d => ({ date: d, value: pMap[d] ?? null })),
 secondaryData: dates.map(d => ({ date: d, value: sMap[d] ?? null })),
 alignedDates: dates,
 };
 }, [allSeries, primaryKey, secondaryKey, range]);

 const primaryMeta = OVERLAY_METRICS.find(m => m.key === primaryKey) || OVERLAY_METRICS[0];
 const secondaryMeta = OVERLAY_METRICS.find(m => m.key === secondaryKey) || OVERLAY_METRICS[1];

 // Update unit labels based on settings
 const pUnit = primaryKey === 'weight' ? weightUnit : primaryKey === 'waist' ? waistUnit : primaryMeta.unit;
 const sUnit = secondaryKey === 'weight' ? weightUnit : secondaryKey === 'waist' ? waistUnit : secondaryMeta.unit;

 // Pearson correlation coefficient (only when 14+ overlapping data points)
 const correlation = useMemo(() => {
 const paired = primaryData
.map((p, i) => ({ p: p.value, s: secondaryData[i]?.value }))
.filter(d => d.p != null && d.s != null);
 if (paired.length < 14) return null;
 const n = paired.length;
 const sumP = paired.reduce((a, d) => a + d.p, 0);
 const sumS = paired.reduce((a, d) => a + d.s, 0);
 const sumPP = paired.reduce((a, d) => a + d.p * d.p, 0);
 const sumSS = paired.reduce((a, d) => a + d.s * d.s, 0);
 const sumPS = paired.reduce((a, d) => a + d.p * d.s, 0);
 const num = n * sumPS - sumP * sumS;
 const den = Math.sqrt((n * sumPP - sumP * sumP) * (n * sumSS - sumS * sumS));
 if (den === 0) return null;
 const r = num / den;
 const absR = Math.abs(r);
 const strength = absR >= 0.7 ? 'strong' : absR >= 0.4 ? 'moderate' : 'weak';
 const direction = r > 0 ? '' : 'inverse ';
 return { r: r.toFixed(2), strength, direction, absR };
 }, [primaryData, secondaryData]);

 if (alignedDates.length < 2) {
 return (
 <GlassCard style={{ padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
 <Activity size={24} color={T.text3} style={{ marginBottom: '8px' }} />
 <div style={{ fontSize: '14px', color: T.text2, marginBottom: '4px' }}>Multi-Metric Overlay</div>
 <div style={{ fontSize: '12px', color: T.text3 }}>Select two metrics with overlapping data to see correlations</div>
 </GlassCard>
 );
 }

 const W = 420, H = 200, PAD = { top: 10, right: 44, bottom: 28, left: 44 };
 const cW = W - PAD.left - PAD.right;
 const cH = H - PAD.top - PAD.bottom;

 // Independent Y-axes
 const pVals = primaryData.filter(d => d.value != null).map(d => d.value);
 const sVals = secondaryData.filter(d => d.value != null).map(d => d.value);

 const pMin = pVals.length > 0 ? Math.min(...pVals) : 0;
 const pMax = pVals.length > 0 ? Math.max(...pVals) : 1;
 const pPad = (pMax - pMin) * 0.08 || 1;

 const sMin = sVals.length > 0 ? Math.min(...sVals) : 0;
 const sMax = sVals.length > 0 ? Math.max(...sVals) : 1;
 const sPad = (sMax - sMin) * 0.08 || 1;

 const pMinY = pMin - pPad, pMaxY = pMax + pPad, pRange = pMaxY - pMinY || 1;
 const sMinY = sMin - sPad, sMaxY = sMax + sPad, sRange = sMaxY - sMinY || 1;

 const n = alignedDates.length;
 const xPos = (i) => PAD.left + (i / Math.max(n - 1, 1)) * cW;
 const yPri = (v) => PAD.top + (1 - (v - pMinY) / pRange) * cH;
 const ySec = (v) => PAD.top + (1 - (v - sMinY) / sRange) * cH;

 // Build SVG paths (skip null gaps)
 const buildPath = (data, yFn) => {
 let path = '';
 let started = false;
 data.forEach((d, i) => {
 if (d.value == null) { started = false; return; }
 path += `${started ? 'L' : 'M'}${xPos(i).toFixed(1)},${yFn(d.value).toFixed(1)} `;
 started = true;
 });
 return path;
 };

 const priPath = buildPath(primaryData, yPri);
 const secPath = buildPath(secondaryData, ySec);

 // Y-axis label generation
 const makeYLabels = (minV, maxV, steps = 4) => {
 const range = maxV - minV;
 return Array.from({ length: steps + 1 }, (_, i) => {
 const v = minV + (i / steps) * range;
 return { value: v, label: v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v < 10 ? v.toFixed(1) : Math.round(v) };
 });
 };

 const pLabels = makeYLabels(pMinY, pMaxY);
 const sLabels = makeYLabels(sMinY, sMaxY);

 // X-axis date labels
 const xStep = Math.max(1, Math.floor(n / 6));

 return (
 <div style={{ marginBottom: '16px' }}>
 <GlassCard animate={false} style={{ padding: '12px' }}>
 {/* Header */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
 <Activity size={16} color={T.text2} />
 <span style={{ fontSize: '14px', fontWeight: 600, color: T.text }}>Metric Overlay</span>
 </div>
 <div style={{ display: 'flex', gap: '3px' }}>
 {['1W','1M','3M','6M','1Y','All'].map(r => (
 <button key={r} onClick={() => setRange(r)} style={{
 padding: '3px 7px', borderRadius: '6px', fontSize: '10px', fontFamily: T.mono,
 border: 'none', cursor: 'pointer', transition: 'all 0.2s',
 background: range === r ? T.accentSoft : 'rgba(255,255,255,0.04)',
 color: range === r ? T.accent : T.text3,
 }}>{r}</button>
 ))}
 </div>
 </div>

 {/* Metric selectors */}
 <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
 <MetricPicker value={primaryKey} onChange={setPrimaryKey} exclude={secondaryKey} />
 <span style={{ fontSize: '11px', color: T.text3 }}>vs</span>
 <MetricPicker value={secondaryKey} onChange={setSecondaryKey} exclude={primaryKey} />
 </div>

 {/* Correlation badge */}
 {correlation && (
 <div style={{
 display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '10px',
 padding: '4px 10px', borderRadius: '12px',
 background: correlation.absR >= 0.7 ? 'rgba(78,205,196,0.1)' : 'rgba(255,255,255,0.04)',
 border: `1px solid ${correlation.absR >= 0.7 ? T.tealGlow : T.border}`,
 }}>
 <span style={{ fontSize: '11px', fontFamily: T.mono, fontWeight: 600,
 color: correlation.absR >= 0.7 ? T.teal : correlation.absR >= 0.4 ? T.text2 : T.text3 }}>
 r = {correlation.r}
 </span>
 <span style={{ fontSize: '10px', color: T.text3 }}>
 {correlation.strength} {correlation.direction}correlation
 </span>
 </div>
 )}

 {/* SVG Chart */}
 <svg key={`${range}-${primaryKey}-${secondaryKey}`} className="chart-svg" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible', userSelect: 'none' }}
 role="img" aria-label={`Multi-metric overlay chart comparing ${primaryKey} and ${secondaryKey || 'single metric'} over ${range}`}
 onMouseMove={(e) => {
 const rect = e.currentTarget.getBoundingClientRect;
 const x = ((e.clientX - rect.left) / rect.width) * W;
 const idx = Math.round(((x - PAD.left) / cW) * (n - 1));
 setHoverIdx(Math.max(0, Math.min(n - 1, idx)));
 }}
 onMouseLeave={() => setHoverIdx(null)}
 onTouchMove={(e) => {
 const rect = e.currentTarget.getBoundingClientRect;
 const x = ((e.touches[0].clientX - rect.left) / rect.width) * W;
 const idx = Math.round(((x - PAD.left) / cW) * (n - 1));
 setHoverIdx(Math.max(0, Math.min(n - 1, idx)));
 }}
 onTouchEnd={() => setHoverIdx(null)}
 >
 {/* Grid lines */}
 {pLabels.map((l, i) => (
 <line key={`pg${i}`} x1={PAD.left} y1={yPri(l.value)} x2={W - PAD.right} y2={yPri(l.value)}
 stroke={T.border} strokeWidth="0.5" />
 ))}

 {/* Left Y-axis labels (primary) */}
 {pLabels.map((l, i) => (
 <text key={`pl${i}`} x={PAD.left - 4} y={yPri(l.value) + 3} fill={primaryMeta.color}
 fontSize="8.5" fontFamily={T.mono} textAnchor="end" opacity="0.8">{l.label}</text>
 ))}

 {/* Right Y-axis labels (secondary) */}
 {sLabels.map((l, i) => (
 <text key={`sl${i}`} x={W - PAD.right + 4} y={ySec(l.value) + 3} fill={secondaryMeta.color}
 fontSize="8.5" fontFamily={T.mono} textAnchor="start" opacity="0.8">{l.label}</text>
 ))}

 {/* Primary line */}
 {priPath && <path d={priPath} fill="none" stroke={primaryMeta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

 {/* Secondary line */}
 {secPath && <path d={secPath} fill="none" stroke={secondaryMeta.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,3" />}

 {/* X-axis date labels */}
 {alignedDates.map((d, i) => {
 if (i % xStep !== 0 && i !== n - 1) return null;
 return <text key={d} x={xPos(i)} y={H - 4} fill={T.text3} fontSize="8.5" fontFamily={T.mono} textAnchor="middle">{d.slice(5)}</text>;
 })}

 {/* Hover crosshair + tooltip */}
 {hoverIdx !== null && (
 <g>
 <line x1={xPos(hoverIdx)} y1={PAD.top} x2={xPos(hoverIdx)} y2={PAD.top + cH}
 stroke={T.text2} strokeWidth="0.5" strokeDasharray="3,2" />
 {primaryData[hoverIdx]?.value != null && (
 <circle cx={xPos(hoverIdx)} cy={yPri(primaryData[hoverIdx].value)} r="3.5"
 fill={primaryMeta.color} stroke={T.bg} strokeWidth="1.5" />
 )}
 {secondaryData[hoverIdx]?.value != null && (
 <circle cx={xPos(hoverIdx)} cy={ySec(secondaryData[hoverIdx].value)} r="3.5"
 fill={secondaryMeta.color} stroke={T.bg} strokeWidth="1.5" />
 )}
 {/* Tooltip */}
 <rect x={Math.max(2, Math.min(xPos(hoverIdx) - 65, W - 132))} y={PAD.top - 2}
 width="130" height="34" rx="4" fill={T.bgGlass} stroke={T.border} strokeWidth="0.5" />
 <text x={Math.max(67, Math.min(xPos(hoverIdx), W - 67))} y={PAD.top + 10}
 fill={T.text} fontSize="8.5" fontFamily={T.mono} textAnchor="middle">
 {alignedDates[hoverIdx]?.slice(5)}
 </text>
 <text x={Math.max(67, Math.min(xPos(hoverIdx), W - 67))} y={PAD.top + 22}
 fill={T.text2} fontSize="8" fontFamily={T.mono} textAnchor="middle">
 {primaryData[hoverIdx]?.value != null ? `${primaryData[hoverIdx].value.toFixed(1)} ${pUnit}` : '—'}
 {' · '}
 {secondaryData[hoverIdx]?.value != null ? `${secondaryData[hoverIdx].value.toFixed(1)} ${sUnit}` : '—'}
 </text>
 </g>
 )}
 </svg>

 {/* Legend */}
 <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '6px', fontSize: '10px' }}>
 <span style={{ color: primaryMeta.color }}>━ {primaryMeta.label} ({pUnit})</span>
 <span style={{ color: secondaryMeta.color }}>╌ {secondaryMeta.label} ({sUnit})</span>
 </div>
 </GlassCard>
 </div>
 );
}

export default MultiMetricOverlay;

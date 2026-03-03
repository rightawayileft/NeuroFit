import React, { useState, useMemo } from 'react';
import { T } from '@/design/tokens';
import { today, subtractDays } from '@/lib/dateUtils';
import { loadAllBodyLogs } from '@/lib/weightSmoothing';
import GlassCard from '@/components/GlassCard';

export default function WaistChart({ settings, nutritionConfig, allBodyLogs }) {
 const [range, setRange] = useState('3M');
 const [hoverIdx, setHoverIdx] = useState(null);
 const waistUnit = nutritionConfig?.waistUnit || 'in';

 const chartData = useMemo(() => {
 return (allBodyLogs || loadAllBodyLogs()).filter(l => l.waistCircumference).map(l => ({
 date: l.date,
 waist: Number(l.waistCircumference),
 }));
 }, [allBodyLogs]);

 const filteredData = useMemo(() => {
 if (chartData.length === 0) return [];
 const ranges = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 99999 };
 const cutoff = subtractDays(today(), ranges[range] || 90);
 return chartData.filter(d => d.date >= cutoff);
 }, [chartData, range]);

 // Waist-to-height ratio
 const heightInches = settings?.heightInches ? Number(settings.heightInches) : null;
 const whrText = useMemo(() => {
 if (!heightInches || chartData.length === 0) return null;
 const latest = chartData[chartData.length - 1].waist;
 const heightCm = heightInches * 2.54; // heightInches is always stored in inches
 const waistCm = waistUnit === 'cm' ? latest : latest * 2.54;
 const ratio = (waistCm / (heightCm || 1)).toFixed(2);
 const risk = ratio < 0.5 ? 'healthy' : ratio < 0.6 ? 'elevated' : 'high';
 return { ratio, risk };
 }, [chartData, heightInches, waistUnit]);

 if (chartData.length === 0) {
 return null; // Don't show empty waist chart — less important than weight/bf/nutrition
 }
 if (filteredData.length < 2) {
 return (
 <GlassCard style={{ padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
 <div style={{ fontSize: '13px', color: T.text3 }}>Need at least 2 waist entries for this range</div>
 </GlassCard>
 );
 }

 const W = 420, H = 150, PAD = { top: 10, right: 10, bottom: 28, left: 44 };
 const cW = W - PAD.left - PAD.right;
 const cH = H - PAD.top - PAD.bottom;

 const vals = filteredData.map(d => d.waist);
 const minW = Math.floor(Math.min(...vals) - 1);
 const maxW = Math.ceil(Math.max(...vals) + 1);
 const yRange = maxW - minW || 1;

 const xPos = (i) => PAD.left + (i / Math.max(filteredData.length - 1, 1)) * cW;
 const yPos = (v) => PAD.top + (1 - (v - minW) / yRange) * cH;

 const linePath = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.waist).toFixed(1)}`).join(' ');
 const areaPath = linePath + ` L${xPos(filteredData.length - 1).toFixed(1)},${(PAD.top + cH).toFixed(1)} L${PAD.left},${(PAD.top + cH).toFixed(1)} Z`;

 const ySteps = 4;
 const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
 const v = minW + (yRange * i) / ySteps;
 return { v: Math.round(v * 10) / 10, py: yPos(v) };
 });

 const xLabelCount = Math.min(filteredData.length, 5);
 const xStep = Math.max(1, Math.floor((filteredData.length - 1) / Math.max(xLabelCount - 1, 1)));

 // Deltas
 const deltas = useMemo(() => {
 if (chartData.length < 2) return [];
 const latest = chartData[chartData.length - 1].waist;
 return [7, 30, 90].map(d => {
 const cutoff = subtractDays(today(), d);
 const past = chartData.find(s => s.date >= cutoff);
 if (!past) return null;
 const delta = Math.round((latest - past.waist) * 10) / 10;
 return { label: `${d}d`, delta };
 }).filter(Boolean);
 }, [chartData]);

 return (
 <div style={{ marginBottom: '16px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
 <div>
 <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'inline' }}>Waist</h3>
 {whrText && (
 <span style={{
 fontSize: '11px', marginLeft: '8px',
 color: whrText.risk === 'healthy' ? T.teal : whrText.risk === 'elevated' ? T.warn : T.danger,
 }}>
 W:H ratio {whrText.ratio} ({whrText.risk})
 </span>
 )}
 </div>
 <div style={{ display: 'flex', gap: '3px' }}>
 {['1M', '3M', '6M', '1Y', 'All'].map(r => (
 <button key={r} onClick={() => setRange(r)} style={{
 padding: '6px 10px', borderRadius: '6px', border: 'none', fontSize: '10px', fontWeight: 600, cursor: 'pointer', minHeight: '32px',
 background: range === r ? T.accentSoft : 'transparent',
 color: range === r ? T.accent : T.text3,
 }}>{r}</button>
 ))}
 </div>
 </div>

 <GlassCard animate={false} style={{ padding: '12px 8px 8px', overflow: 'hidden' }}>
 <svg key={range} className="chart-svg" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}
 role="img" aria-label={`Waist measurement trend chart over ${range}`}
 onMouseLeave={() => setHoverIdx(null)} onTouchEnd={() => setHoverIdx(null)}>
 <defs>
 <linearGradient id="waistGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor={T.accent} stopOpacity="0.12" />
 <stop offset="100%" stopColor={T.accent} stopOpacity="0" />
 </linearGradient>
 </defs>

 {/* Grid */}
 {yLabels.map((l, i) => (
 <g key={i}>
 <line x1={PAD.left} y1={l.py} x2={W - PAD.right} y2={l.py} stroke={T.border} strokeWidth="0.5" />
 <text x={PAD.left - 6} y={l.py + 3.5} fill={T.text3} fontSize="9" fontFamily={T.mono} textAnchor="end">{l.v}</text>
 </g>
 ))}

 {/* Area + Line */}
 <path d={areaPath} fill="url(#waistGrad)" />
 <path d={linePath} fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

 {/* Dots */}
 {filteredData.map((d, i) => (
 <circle key={i} cx={xPos(i)} cy={yPos(d.waist)} r="2.5" fill={T.text3} opacity="0.4"
 onMouseEnter={() => setHoverIdx(i)} onTouchStart={() => setHoverIdx(i)} />
 ))}

 {/* X-axis */}
 {filteredData.filter((_, i) => i % xStep === 0 || i === filteredData.length - 1).map((d) => {
 const i = filteredData.indexOf(d);
 return <text key={d.date} x={xPos(i)} y={H - 4} fill={T.text3} fontSize="8.5" fontFamily={T.mono} textAnchor="middle">{d.date.slice(5)}</text>;
 })}

 {/* Hover */}
 {hoverIdx !== null && filteredData[hoverIdx] && (
 <g>
 <line x1={xPos(hoverIdx)} y1={PAD.top} x2={xPos(hoverIdx)} y2={PAD.top + cH} stroke={T.text2} strokeWidth="0.5" strokeDasharray="3,2" />
 <circle cx={xPos(hoverIdx)} cy={yPos(filteredData[hoverIdx].waist)} r="4" fill={T.accent} stroke={T.bg} strokeWidth="1.5" />
 <rect x={Math.max(2, Math.min(xPos(hoverIdx) - 50, W - 102))} y={PAD.top - 2} width="100" height="22" rx="4"
 fill={T.bgGlass} stroke={T.border} strokeWidth="0.5" />
 <text x={Math.max(52, Math.min(xPos(hoverIdx), W - 52))} y={PAD.top + 13} fill={T.text} fontSize="9" fontFamily={T.mono} textAnchor="middle">
 {filteredData[hoverIdx].date.slice(5)} {filteredData[hoverIdx].waist} {waistUnit}
 </text>
 </g>
 )}
 </svg>

 {/* Deltas */}
 {deltas.length > 0 && (
 <div style={{ display: 'flex', gap: '6px', padding: '8px 4px 0', flexWrap: 'wrap' }}>
 {deltas.map(d => {
 const isGood = d.delta < 0; // smaller waist = good
 return (
 <div key={d.label} style={{
 padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontFamily: T.mono,
 background: isGood ? 'rgba(78,205,196,0.08)' : d.delta > 0 ? 'rgba(255,183,77,0.08)' : 'rgba(255,255,255,0.04)',
 color: isGood ? T.teal : d.delta > 0 ? T.warn : T.text2,
 }}>
 {d.label}: {d.delta > 0 ? '+' : ''}{d.delta} {waistUnit}
 </div>
 );
 })}
 </div>
 )}
 </GlassCard>
 </div>
 );
}

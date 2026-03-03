import React, { useState, useMemo } from 'react';
import { Scale } from 'lucide-react';
import { T } from '@/design/tokens';
import { today, subtractDays } from '@/lib/dateUtils';
import { loadBodyLogs, getSmoothedWeights } from '@/lib/weightSmoothing';
import GlassCard from '@/components/GlassCard';

export default function WeightTrendChart({ settings, nutritionConfig, goToToday, bodyLogs }) {
 const [range, setRange] = useState('1M');
 const [hoverIdx, setHoverIdx] = useState(null);
 const allLogs = useMemo(() => bodyLogs || loadBodyLogs(), [bodyLogs]);
 const smoothed = useMemo(() => getSmoothedWeights(allLogs, nutritionConfig), [allLogs, nutritionConfig]);

 // Filter by time range
 const filteredData = useMemo(() => {
 if (smoothed.length === 0) return [];
 const now = new Date();
 const ranges = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 730 };
 const days = ranges[range] || 30;
 const cutoff = new Date(now);
 cutoff.setDate(cutoff.getDate() - days);
 const cutoffStr = cutoff.toISOString().split('T')[0];
 const filtered = smoothed.filter(d => d.date >= cutoffStr);
 // Limit data points for rendering performance
 if (filtered.length > 365) {
 const step = Math.ceil(filtered.length / 365);
 const sampled = filtered.filter((_, i) => i % step === 0 || i === filtered.length - 1);
 return sampled;
 }
 return filtered;
 }, [smoothed, range]);

 // Delta indicators
 const deltas = useMemo(() => {
 if (smoothed.length < 2) return [];
 const latest = smoothed[smoothed.length - 1]?.trend;
 return [3, 7, 14, 30, 90].map(d => {
 const cutoff = subtractDays(today(), d);
 const past = smoothed.find(s => s.date >= cutoff);
 if (!past) return null;
 const delta = Math.round((latest - past.trend) * 10) / 10;
 return { label: `${d}d`, delta };
 }).filter(Boolean);
 }, [smoothed]);

 const pointCount = filteredData.length;

 if (allLogs.length === 0) {
 return (
 <GlassCard style={{ padding:'20px', textAlign:'center', marginBottom:'16px' }}>
 <Scale size={24} color={T.text3} style={{ marginBottom:'8px' }} />
 <div style={{ fontSize:'14px', color:T.text2, marginBottom:'4px' }}>No weight data yet</div>
 <div style={{ fontSize:'12px', color:T.text3 }}>Log your weight on the Today tab to see trends</div>
 <button
 type="button"
 onClick={goToToday}
 style={{ fontSize:'11px', color:T.accent, marginTop:'8px', cursor:'pointer', opacity:0.7, background:'none', border:'none' }}
 >
 {'<- Switch to Today to start logging'}
 </button>
 </GlassCard>
 );
 }

 if (filteredData.length < 2) {
 return (
 <GlassCard style={{ padding:'20px', textAlign:'center', marginBottom:'16px' }}>
 <div style={{ fontSize:'13px', color:T.text3 }}>Need at least 2 data points for this range</div>
 </GlassCard>
 );
 }

 // Chart dimensions
 const W = 420, H = 180, PAD = { top: 10, right: 10, bottom: 28, left: 44 };
 const cW = W - PAD.left - PAD.right;
 const cH = H - PAD.top - PAD.bottom;

 const raws = filteredData.map(d => d.raw);
 const trends = filteredData.map(d => d.trend);
 const allVals = [...raws,...trends];
 const minW = Math.floor(Math.min(...allVals) - 2);
 const maxW = Math.ceil(Math.max(...allVals) + 2);
 const yRange = maxW - minW || 1;

 const x = (i) => PAD.left + (i / Math.max(filteredData.length - 1, 1)) * cW;
 const y = (v) => PAD.top + (1 - (v - minW) / yRange) * cH;

 // Trend line path
 const trendPath = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.trend).toFixed(1)}`).join(' ');
 // Area fill path
 const areaPath = trendPath + ` L${x(filteredData.length - 1).toFixed(1)},${(PAD.top + cH).toFixed(1)} L${PAD.left},${(PAD.top + cH).toFixed(1)} Z`;

 // Y-axis labels
 const ySteps = 5;
 const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
 const v = minW + (yRange * i) / ySteps;
 return { v: Math.round(v * 10) / 10, py: y(v) };
 });

 // X-axis labels (smart density)
 const xLabelCount = Math.min(filteredData.length, range === '1W' ? 7 : range === '1M' ? 6 : 5);
 const xStep = Math.max(1, Math.floor((filteredData.length - 1) / Math.max(xLabelCount - 1, 1)));

 // Goal line
 const goalWeight = settings?.bodyWeight ? Number(settings.bodyWeight) : null;

 const wUnit = settings?.weightUnit || 'lbs';

 return (
 <div style={{ marginBottom:'16px' }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
 <h3 style={{ fontSize:'15px', fontWeight:600 }}>Weight Trend</h3>
 <div style={{ display:'flex', gap:'3px' }}>
 {['1W','1M','3M','6M','1Y','All'].map(r => (
 <button key={r} onClick={() => setRange(r)} style={{
 padding:'6px 10px', borderRadius:'6px', border:'none', fontSize:'10px', fontWeight:600, cursor:'pointer', minHeight:'32px',
 background: range === r ? T.accentSoft : 'transparent',
 color: range === r ? T.accent : T.text3,
 }}>{r}</button>
 ))}
 </div>
 </div>

 <GlassCard animate={false} style={{ padding:'12px 8px 8px', overflow:'hidden' }}>
 <svg key={range} className="chart-svg" viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', display:'block' }}
 role="img" aria-label={`Weight trend chart showing ${pointCount} data points over ${range}`}
 onMouseLeave={() => setHoverIdx(null)} onTouchEnd={() => setHoverIdx(null)}>
 <defs>
 <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor={T.accent} stopOpacity="0.15" />
 <stop offset="100%" stopColor={T.accent} stopOpacity="0" />
 </linearGradient>
 </defs>

 {/* Grid lines */}
 {yLabels.map((l, i) => (
 <g key={i}>
 <line x1={PAD.left} y1={l.py} x2={W - PAD.right} y2={l.py}
 stroke={T.border} strokeWidth="0.5" />
 <text x={PAD.left - 6} y={l.py + 3.5} fill={T.text3}
 fontSize="9" fontFamily={T.mono} textAnchor="end">{l.v}</text>
 </g>
 ))}

 {/* Goal line */}
 {goalWeight && goalWeight >= minW && goalWeight <= maxW && (
 <line x1={PAD.left} y1={y(goalWeight)} x2={W - PAD.right} y2={y(goalWeight)}
 stroke={T.teal} strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
 )}

 {/* Area fill */}
 <path d={areaPath} fill="url(#trendGrad)" />

 {/* Trend line */}
 <path d={trendPath} fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

 {/* Raw data dots */}
 {filteredData.map((d, i) => (
 <circle key={i} cx={x(i)} cy={y(d.raw)} r="2.5"
 fill={T.text3} opacity="0.4"
 onMouseEnter={() => setHoverIdx(i)}
 onTouchStart={() => setHoverIdx(i)} />
 ))}

 {/* X-axis labels */}
 {filteredData.filter((_, i) => i % xStep === 0 || i === filteredData.length - 1).map((d) => {
 const i = filteredData.indexOf(d);
 const label = d.date.slice(5); // MM-DD
 return (
 <text key={d.date} x={x(i)} y={H - 4} fill={T.text3}
 fontSize="8.5" fontFamily={T.mono} textAnchor="middle">{label}</text>
 );
 })}

 {/* Hover crosshair */}
 {hoverIdx !== null && filteredData[hoverIdx] && (
 <g>
 <line x1={x(hoverIdx)} y1={PAD.top} x2={x(hoverIdx)} y2={PAD.top + cH}
 stroke={T.text2} strokeWidth="0.5" strokeDasharray="3,2" />
 <circle cx={x(hoverIdx)} cy={y(filteredData[hoverIdx].trend)} r="4"
 fill={T.accent} stroke={T.bg} strokeWidth="1.5" />
 <rect x={Math.max(2, Math.min(x(hoverIdx) - 50, W - 102))} y={PAD.top - 2} width="100" height="30" rx="4"
 fill={T.bgGlass} stroke={T.border} strokeWidth="0.5" />
 <text x={Math.max(52, Math.min(x(hoverIdx), W - 52))} y={PAD.top + 10} fill={T.text} fontSize="9" fontFamily={T.mono} textAnchor="middle">
 {filteredData[hoverIdx].date.slice(5)} {filteredData[hoverIdx].trend} {wUnit}
 </text>
 <text x={Math.max(52, Math.min(x(hoverIdx), W - 52))} y={PAD.top + 22} fill={T.text3} fontSize="8" fontFamily={T.mono} textAnchor="middle">
 raw: {filteredData[hoverIdx].raw}
 </text>
 </g>
 )}
 </svg>

 {/* Delta indicators */}
 {deltas.length > 0 && (
 <div style={{ display:'flex', gap:'6px', padding:'8px 4px 0', flexWrap:'wrap' }}>
 {deltas.map(d => {
 const goal = nutritionConfig?.goal || 'lose';
 const isGood = (goal === 'lose' && d.delta < 0) || (goal === 'gain' && d.delta > 0) || (goal === 'maintain' && Math.abs(d.delta) < 0.5);
 return (
 <div key={d.label} style={{
 padding:'3px 8px', borderRadius:'6px', fontSize:'10px', fontFamily:T.mono,
 background: isGood ? 'rgba(78,205,196,0.08)' : 'rgba(255,255,255,0.04)',
 color: isGood ? T.teal : T.text2,
 }}>
 {d.label}: {d.delta > 0 ? '+' : ''}{d.delta} {wUnit}
 </div>
 );
 })}
 </div>
 )}
 </GlassCard>
 </div>
 );
}

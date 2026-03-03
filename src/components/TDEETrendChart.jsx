import React, { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { T } from '@/design/tokens';
import { today, subtractDays } from '@/lib/dateUtils';
import { DEFAULT_NUTRITION_CONFIG } from '@/data/defaults';
import GlassCard from '@/components/GlassCard';

export default function TDEETrendChart({ nutritionConfig }) {
 const [range, setRange] = useState('3M');
 const [hoverIdx, setHoverIdx] = useState(null);
 const cfg = nutritionConfig || DEFAULT_NUTRITION_CONFIG;

 const chartData = useMemo(() => {
 const hist = cfg.tdeeHistory || [];
 return hist.filter(h => h.date && h.tdee).sort((a, b) => a.date.localeCompare(b.date));
 }, [cfg.tdeeHistory]);

 const filteredData = useMemo(() => {
 if (chartData.length === 0) return [];
 const ranges = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 99999 };
 const cutoff = subtractDays(today(), ranges[range] || 90);
 return chartData.filter(d => d.date >= cutoff);
 }, [chartData, range]);

 // Delta (adaptation detection)
 const delta30 = useMemo(() => {
 if (chartData.length < 2) return null;
 const cutoff = subtractDays(today(), 30);
 const recent = chartData.filter(d => d.date >= cutoff);
 if (recent.length < 2) return null;
 const diff = recent[recent.length - 1].tdee - recent[0].tdee;
 return Math.round(diff);
 }, [chartData]);

 if (chartData.length < 3) {
 return (
 <GlassCard style={{ padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
 <TrendingUp size={24} color={T.text3} style={{ marginBottom: '8px' }} />
 <div style={{ fontSize: '14px', color: T.text2, marginBottom: '4px' }}>TDEE tracking needs more data</div>
 <div style={{ fontSize: '12px', color: T.text3 }}>Log weight + calories for 7+ days to see adaptive TDEE</div>
 </GlassCard>
 );
 }
 if (filteredData.length < 3) {
 return (
 <GlassCard style={{ padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
 <div style={{ fontSize: '13px', color: T.text3 }}>Need at least 3 TDEE data points for this range</div>
 </GlassCard>
 );
 }

 const W = 420, H = 160, PAD = { top: 10, right: 10, bottom: 28, left: 48 };
 const cW = W - PAD.left - PAD.right;
 const cH = H - PAD.top - PAD.bottom;

 const vals = filteredData.map(d => d.tdee);
 const minT = Math.floor((Math.min(...vals) - 50) / 50) * 50;
 const maxT = Math.ceil((Math.max(...vals) + 50) / 50) * 50;
 const yRange = maxT - minT || 1;

 const xPos = (i) => PAD.left + (i / Math.max(filteredData.length - 1, 1)) * cW;
 const yPos = (v) => PAD.top + (1 - (v - minT) / yRange) * cH;

 const linePath = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.tdee).toFixed(1)}`).join(' ');
 const areaPath = linePath + ` L${xPos(filteredData.length - 1).toFixed(1)},${(PAD.top + cH).toFixed(1)} L${PAD.left},${(PAD.top + cH).toFixed(1)} Z`;

 // Confidence shading (wider early, narrower later)
 const totalDays = chartData.length;
 const confWidth = totalDays < 14 ? 100 : totalDays < 30 ? 50 : 25;
 const confTopPath = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.tdee + confWidth).toFixed(1)}`).join(' ');
 const confBotPath = [...filteredData].reverse().map((d, i) => {
 const origIdx = filteredData.length - 1 - i;
 return `L${xPos(origIdx).toFixed(1)},${yPos(d.tdee - confWidth).toFixed(1)}`;
 }).join(' ');
 const confPath = confTopPath + ' ' + confBotPath + ' Z';

 const ySteps = 4;
 const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
 const v = minT + (yRange * i) / ySteps;
 return { v: Math.round(v), py: yPos(v) };
 });

 const xLabelCount = Math.min(filteredData.length, 5);
 const xStep = Math.max(1, Math.floor((filteredData.length - 1) / Math.max(xLabelCount - 1, 1)));

 return (
 <div style={{ marginBottom: '16px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
 <div>
 <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'inline' }}>Estimated TDEE</h3>
 {delta30 !== null && (
 <span style={{
 fontSize: '11px', fontFamily: T.mono, marginLeft: '8px',
 color: Math.abs(delta30) < 20 ? T.text3 : delta30 < 0 ? T.warn : T.teal,
 }}>
 TDEE {delta30 > 0 ? '↑' : delta30 < 0 ? '↓' : '→'}{Math.abs(delta30)} kcal / 30d
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
 role="img" aria-label={`TDEE trend chart over ${range}`}
 onMouseLeave={() => setHoverIdx(null)} onTouchEnd={() => setHoverIdx(null)}>
 <defs>
 <linearGradient id="tdeeGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor={T.teal} stopOpacity="0.12" />
 <stop offset="100%" stopColor={T.teal} stopOpacity="0" />
 </linearGradient>
 </defs>

 {/* Grid */}
 {yLabels.map((l, i) => (
 <g key={i}>
 <line x1={PAD.left} y1={l.py} x2={W - PAD.right} y2={l.py} stroke={T.border} strokeWidth="0.5" />
 <text x={PAD.left - 6} y={l.py + 3.5} fill={T.text3} fontSize="9" fontFamily={T.mono} textAnchor="end">{l.v}</text>
 </g>
 ))}

 {/* Confidence band */}
 <path d={confPath} fill={T.tealGlow} opacity="0.3" />

 {/* Area fill */}
 <path d={areaPath} fill="url(#tdeeGrad)" />

 {/* TDEE line */}
 <path d={linePath} fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

 {/* Data dots */}
 {filteredData.map((d, i) => (
 <circle key={i} cx={xPos(i)} cy={yPos(d.tdee)} r="2" fill={T.teal} opacity="0.5"
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
 <circle cx={xPos(hoverIdx)} cy={yPos(filteredData[hoverIdx].tdee)} r="4" fill={T.teal} stroke={T.bg} strokeWidth="1.5" />
 <rect x={Math.max(2, Math.min(xPos(hoverIdx) - 50, W - 102))} y={PAD.top - 2} width="100" height="22" rx="4"
 fill={T.bgGlass} stroke={T.border} strokeWidth="0.5" />
 <text x={Math.max(52, Math.min(xPos(hoverIdx), W - 52))} y={PAD.top + 13} fill={T.text} fontSize="9" fontFamily={T.mono} textAnchor="middle">
 {filteredData[hoverIdx].date.slice(5)} {filteredData[hoverIdx].tdee} kcal
 </text>
 </g>
 )}
 </svg>
 </GlassCard>
 </div>
 );
}

import React, { useState, useMemo } from 'react';
import { Utensils } from 'lucide-react';
import { T } from '@/design/tokens';
import { today, subtractDays } from '@/lib/dateUtils';
import { DEFAULT_NUTRITION_CONFIG } from '@/data/defaults';
import { loadAllBodyLogs } from '@/lib/weightSmoothing';
import GlassCard from '@/components/GlassCard';

export default function NutritionChart({ nutritionConfig, goToToday, allBodyLogs }) {
 const [range, setRange] = useState('1M');
 const [hoverIdx, setHoverIdx] = useState(null);
 const cfg = nutritionConfig || DEFAULT_NUTRITION_CONFIG;

 const chartData = useMemo( => {
 return (allBodyLogs || loadAllBodyLogs).filter(l => l.calories).map(l => ({
 date: l.date,
 calories: Number(l.calories),
 protein: l.protein ? Number(l.protein) : null,
 }));
 }, [allBodyLogs]);

 const filteredData = useMemo( => {
 if (chartData.length === 0) return [];
 const ranges = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 99999 };
 const cutoff = subtractDays(today, ranges[range] || 30);
 return chartData.filter(d => d.date >= cutoff);
 }, [chartData, range]);

 // 7-day rolling average
 const rollingAvg = useMemo( => {
 if (chartData.length < 2) return [];
 return filteredData.map((d, i) => {
 // Look back 7 days in the full dataset
 const cutoff = subtractDays(d.date, 7);
 const window = chartData.filter(c => c.date > cutoff && c.date <= d.date);
 if (window.length === 0) return null;
 return { date: d.date, avg: Math.round(window.reduce((s, w) => s + w.calories, 0) / window.length) };
 }).filter(Boolean);
 }, [chartData, filteredData]);

 if (chartData.length === 0) {
 return (
 <GlassCard style={{ padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
 <Utensils size={24} color={T.text3} style={{ marginBottom: '8px' }} />
 <div style={{ fontSize: '14px', color: T.text2, marginBottom: '4px' }}>No nutrition data yet</div>
 <div style={{ fontSize: '12px', color: T.text3 }}>Log calories on the Today tab to see trends</div>
 <div style={{ fontSize:'11px', color:T.accent, marginTop:'8px', cursor:'pointer', opacity:0.7 }}
 onClick={goToToday} role="button" tabIndex={0}>← Switch to Today to start logging</div>
 </GlassCard>
 );
 }
 if (filteredData.length < 2) {
 return (
 <GlassCard style={{ padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
 <div style={{ fontSize: '13px', color: T.text3 }}>Need at least 2 nutrition entries for this range</div>
 </GlassCard>
 );
 }

 const W = 420, H = 200, PAD = { top: 10, right: 40, bottom: 28, left: 44 };
 const cW = W - PAD.left - PAD.right;
 const cH = H - PAD.top - PAD.bottom;

 const calTarget = cfg.dailyCalorieTarget || 2200;
 const protTarget = cfg.dailyProteinTarget || 165;
 const tdee = cfg.estimatedTDEE || 2500;

 // Y-axis for calories
 const allCals = [...filteredData.map(d => d.calories), calTarget, tdee];
 const minCal = Math.floor((Math.min(...allCals) - 100) / 100) * 100;
 const maxCal = Math.ceil((Math.max(...allCals) + 100) / 100) * 100;
 const calRange = maxCal - minCal || 1;

 // Protein secondary Y-axis
 const prots = filteredData.filter(d => d.protein != null).map(d => d.protein);
 const minProt = prots.length > 0 ? Math.floor(Math.min(...prots, protTarget) / 10) * 10 - 10 : 0;
 const maxProt = prots.length > 0 ? Math.ceil(Math.max(...prots, protTarget) / 10) * 10 + 10 : 200;
 const protRange = maxProt - minProt || 1;

 const xPos = (i) => PAD.left + (i / Math.max(filteredData.length - 1, 1)) * cW;
 const yCal = (v) => PAD.top + (1 - (v - minCal) / calRange) * cH;
 const yProt = (v) => PAD.top + (1 - (v - minProt) / protRange) * cH;

 const barW = Math.max(2, Math.min(12, (cW / filteredData.length) * 0.65));

 // Color coding (adherence-neutral)
 const barColor = (cal) => {
 const ratio = cal / calTarget;
 if (ratio >= 0.95 && ratio <= 1.05) return T.teal;
 if (ratio > 1.05) return T.warn;
 return T.text2;
 };

 // Protein line
 const protData = filteredData.filter(d => d.protein != null);
 const protPath = protData.length >= 2 ? protData.map((d, pi) => {
 const i = filteredData.indexOf(d);
 return `${pi === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yProt(d.protein).toFixed(1)}`;
 }).join(' ') : '';

 // 7-day average band
 const avgBandPath = rollingAvg.length >= 2 ? ( => {
 const top = rollingAvg.map((r, ri) => {
 const fi = filteredData.findIndex(d => d.date === r.date);
 if (fi < 0) return null;
 return `${ri === 0 ? 'M' : 'L'}${xPos(fi).toFixed(1)},${yCal(r.avg).toFixed(1)}`;
 }).filter(Boolean).join(' ');
 return top;
 }) : '';

 // Y-axis labels (calories)
 const ySteps = 5;
 const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
 const v = minCal + (calRange * i) / ySteps;
 return { v: Math.round(v), py: yCal(v) };
 });

 // Right Y-axis labels (protein)
 const yProtLabels = prots.length > 0 ? Array.from({ length: 4 }, (_, i) => {
 const v = minProt + (protRange * i) / 3;
 return { v: Math.round(v), py: yProt(v) };
 }) : [];

 const xLabelCount = Math.min(filteredData.length, range === '1W' ? 7 : range === '1M' ? 6 : 5);
 const xStep = Math.max(1, Math.floor((filteredData.length - 1) / Math.max(xLabelCount - 1, 1)));

 return (
 <div style={{ marginBottom: '16px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
 <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Nutrition</h3>
 <div style={{ display: 'flex', gap: '3px' }}>
 {['1W', '1M', '3M', '6M', '1Y', 'All'].map(r => (
 <button key={r} onClick={ => setRange(r)} style={{
 padding: '6px 10px', borderRadius: '6px', border: 'none', fontSize: '10px', fontWeight: 600, cursor: 'pointer', minHeight: '32px',
 background: range === r ? T.accentSoft : 'transparent',
 color: range === r ? T.accent : T.text3,
 }}>{r}</button>
 ))}
 </div>
 </div>

 <GlassCard animate={false} style={{ padding: '12px 8px 8px', overflow: 'hidden' }}>
 <svg key={range} className="chart-svg" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}
 role="img" aria-label={`Nutrition tracking chart showing calories and protein over ${range}`}
 onMouseLeave={ => setHoverIdx(null)} onTouchEnd={ => setHoverIdx(null)}>

 {/* Grid */}
 {yLabels.map((l, i) => (
 <g key={i}>
 <line x1={PAD.left} y1={l.py} x2={W - PAD.right} y2={l.py} stroke={T.border} strokeWidth="0.5" />
 <text x={PAD.left - 6} y={l.py + 3.5} fill={T.text3} fontSize="9" fontFamily={T.mono} textAnchor="end">{l.v}</text>
 </g>
 ))}

 {/* Right Y-axis labels (protein) */}
 {yProtLabels.map((l, i) => (
 <text key={i} x={W - PAD.right + 6} y={l.py + 3.5} fill={T.accent} fontSize="8" fontFamily={T.mono} textAnchor="start" opacity="0.6">{l.v}g</text>
 ))}

 {/* Calorie target line */}
 <line x1={PAD.left} y1={yCal(calTarget)} x2={W - PAD.right} y2={yCal(calTarget)}
 stroke={T.teal} strokeWidth="1" strokeDasharray="5,3" opacity="0.5" />

 {/* TDEE line */}
 {tdee >= minCal && tdee <= maxCal && (
 <line x1={PAD.left} y1={yCal(tdee)} x2={W - PAD.right} y2={yCal(tdee)}
 stroke={T.warn} strokeWidth="1" strokeDasharray="3,4" opacity="0.4" />
 )}

 {/* Protein target line */}
 {protTarget >= minProt && protTarget <= maxProt && (
 <line x1={PAD.left} y1={yProt(protTarget)} x2={W - PAD.right} y2={yProt(protTarget)}
 stroke={T.accent} strokeWidth="0.8" strokeDasharray="2,3" opacity="0.35" />
 )}

 {/* 7-day rolling average */}
 {avgBandPath && <path d={avgBandPath} fill="none" stroke={T.teal} strokeWidth="1.5" strokeDasharray="1,2" opacity="0.45" />}

 {/* Calorie bars */}
 {filteredData.map((d, i) => (
 <rect key={i} x={xPos(i) - barW / 2} y={Math.min(yCal(d.calories), yCal(0))}
 width={barW} height={Math.abs(yCal(d.calories) - yCal(minCal > 0 ? minCal : 0))}
 fill={barColor(d.calories)} opacity="0.55" rx="1"
 onMouseEnter={ => setHoverIdx(i)} onTouchStart={ => setHoverIdx(i)} />
 ))}

 {/* Protein line */}
 {protPath && <path d={protPath} fill="none" stroke={T.accent} strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />}

 {/* X-axis labels */}
 {filteredData.filter((_, i) => i % xStep === 0 || i === filteredData.length - 1).map((d) => {
 const i = filteredData.indexOf(d);
 return <text key={d.date} x={xPos(i)} y={H - 4} fill={T.text3} fontSize="8.5" fontFamily={T.mono} textAnchor="middle">{d.date.slice(5)}</text>;
 })}

 {/* Hover tooltip */}
 {hoverIdx !== null && filteredData[hoverIdx] && (
 <g>
 <line x1={xPos(hoverIdx)} y1={PAD.top} x2={xPos(hoverIdx)} y2={PAD.top + cH} stroke={T.text2} strokeWidth="0.5" strokeDasharray="3,2" />
 <rect x={Math.max(2, Math.min(xPos(hoverIdx) - 55, W - 112))} y={PAD.top - 2} width="110" height="38" rx="4"
 fill={T.bgGlass} stroke={T.border} strokeWidth="0.5" />
 <text x={Math.max(57, Math.min(xPos(hoverIdx), W - 57))} y={PAD.top + 10} fill={T.text} fontSize="9" fontFamily={T.mono} textAnchor="middle">
 {filteredData[hoverIdx].date.slice(5)} {filteredData[hoverIdx].calories} kcal
 </text>
 <text x={Math.max(57, Math.min(xPos(hoverIdx), W - 57))} y={PAD.top + 22} fill={T.text3} fontSize="8" fontFamily={T.mono} textAnchor="middle">
 {filteredData[hoverIdx].protein != null ? `protein: ${filteredData[hoverIdx].protein}g` : 'no protein logged'}
 </text>
 {rollingAvg.find(r => r.date === filteredData[hoverIdx].date) && (
 <text x={Math.max(57, Math.min(xPos(hoverIdx), W - 57))} y={PAD.top + 33} fill={T.teal} fontSize="7.5" fontFamily={T.mono} textAnchor="middle">
 7d avg: {rollingAvg.find(r => r.date === filteredData[hoverIdx].date)?.avg} kcal
 </text>
 )}
 </g>
 )}
 </svg>

 {/* Legend */}
 <div style={{ display: 'flex', gap: '10px', padding: '6px 4px 0', fontSize: '10px', flexWrap: 'wrap' }}>
 <span style={{ color: T.text2 }}>▮ Calories</span>
 <span style={{ color: T.accent, opacity: 0.75 }}>― Protein</span>
 <span style={{ color: T.teal }}>┈ Target</span>
 <span style={{ color: T.warn, opacity: 0.6 }}>┈ TDEE</span>
 <span style={{ color: T.teal, opacity: 0.5 }}>┈ 7d avg</span>
 </div>
 </GlassCard>
 </div>
 );
}

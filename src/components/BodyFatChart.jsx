import React, { useState, useMemo } from 'react';
import { Activity } from 'lucide-react';
import { T } from '@/design/tokens';
import { today, subtractDays } from '@/lib/dateUtils';
import { LS } from '@/lib/storage';
import { DEFAULT_CALIBRATION } from '@/data/defaults';
import { loadAllBodyLogs } from '@/lib/weightSmoothing';
import { getCalibratedBodyFat } from '@/lib/bodyFatCalibration';
import GlassCard from '@/components/GlassCard';

export default function BodyFatChart({ settings, nutritionConfig, goToToday, allBodyLogs }) {
 const [range, setRange] = useState('3M');
 const [hoverIdx, setHoverIdx] = useState(null);

 const cal = useMemo( => LS.get('bfCalibration', DEFAULT_CALIBRATION), []);

 const chartData = useMemo( => {
 const logs = (allBodyLogs || loadAllBodyLogs).filter(l => l.bodyFat?.value);
 return logs.map(l => {
 const rawBF = Number(l.bodyFat.value);
 const calibrated = getCalibratedBodyFat(rawBF, cal);
 const isDEXA = l.bodyFat.source === 'dexa';
 return { date: l.date, raw: rawBF, calibrated: calibrated.value, confidence: calibrated.confidence, isDEXA, isCal: calibrated.calibrated };
 });
 }, [cal, allBodyLogs]);

 const filteredData = useMemo( => {
 if (chartData.length === 0) return [];
 const ranges = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 99999 };
 const days = ranges[range] || 90;
 const cutoff = subtractDays(today, days);
 return chartData.filter(d => d.date >= cutoff);
 }, [chartData, range]);

 if (chartData.length === 0) {
 return (
 <GlassCard style={{ padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
 <Activity size={24} color={T.text3} style={{ marginBottom: '8px' }} />
 <div style={{ fontSize: '14px', color: T.text2, marginBottom: '4px' }}>No body fat data yet</div>
 <div style={{ fontSize: '12px', color: T.text3 }}>Log body fat % on the Today tab to track composition</div>
 <div style={{ fontSize:'11px', color:T.accent, marginTop:'8px', cursor:'pointer', opacity:0.7 }}
 onClick={goToToday} role="button" tabIndex={0}>← Switch to Today to start logging</div>
 </GlassCard>
 );
 }
 if (filteredData.length < 2) {
 return (
 <GlassCard style={{ padding: '20px', textAlign: 'center', marginBottom: '16px' }}>
 <div style={{ fontSize: '13px', color: T.text3 }}>Need at least 2 body fat entries for this range</div>
 </GlassCard>
 );
 }

 const W = 420, H = 180, PAD = { top: 10, right: 10, bottom: 28, left: 44 };
 const cW = W - PAD.left - PAD.right;
 const cH = H - PAD.top - PAD.bottom;

 const allVals = [...filteredData.map(d => d.raw),...filteredData.map(d => d.calibrated)];
 const minV = Math.floor(Math.min(...allVals) - 2);
 const maxV = Math.ceil(Math.max(...allVals) + 2);
 const yRange = maxV - minV || 1;

 const xPos = (i) => PAD.left + (i / Math.max(filteredData.length - 1, 1)) * cW;
 const yPos = (v) => PAD.top + (1 - (v - minV) / yRange) * cH;

 // Calibrated line path
 const calPath = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.calibrated).toFixed(1)}`).join(' ');

 // Confidence band (wider with fewer calibration points)
 const calPts = cal.points?.length || 0;
 const bandWidth = calPts === 0 ? 3 : calPts === 1 ? 2 : calPts >= 3 ? 0.8 : 1.2;
 const bandTop = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.calibrated + bandWidth).toFixed(1)}`).join(' ');
 const bandBot = [...filteredData].reverse.map((d, i) => {
 const origIdx = filteredData.length - 1 - i;
 return `L${xPos(origIdx).toFixed(1)},${yPos(d.calibrated - bandWidth).toFixed(1)}`;
 }).join(' ');
 const bandPath = bandTop + ' ' + bandBot + ' Z';

 // Y-axis labels
 const ySteps = 5;
 const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
 const v = minV + (yRange * i) / ySteps;
 return { v: Math.round(v * 10) / 10, py: yPos(v) };
 });

 const xLabelCount = Math.min(filteredData.length, range === '1W' ? 7 : range === '1M' ? 6 : 5);
 const xStep = Math.max(1, Math.floor((filteredData.length - 1) / Math.max(xLabelCount - 1, 1)));

 return (
 <div style={{ marginBottom: '16px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
 <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Body Fat Trend</h3>
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
 role="img" aria-label={`Body fat percentage chart over ${range}`}
 onMouseLeave={ => setHoverIdx(null)} onTouchEnd={ => setHoverIdx(null)}>
 <defs>
 <linearGradient id="bfBandGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor={T.teal} stopOpacity="0.12" />
 <stop offset="100%" stopColor={T.teal} stopOpacity="0.03" />
 </linearGradient>
 </defs>

 {/* Grid */}
 {yLabels.map((l, i) => (
 <g key={i}>
 <line x1={PAD.left} y1={l.py} x2={W - PAD.right} y2={l.py} stroke={T.border} strokeWidth="0.5" />
 <text x={PAD.left - 6} y={l.py + 3.5} fill={T.text3} fontSize="9" fontFamily={T.mono} textAnchor="end">{l.v}%</text>
 </g>
 ))}

 {/* Confidence band */}
 {cal.points?.length > 0 && <path d={bandPath} fill="url(#bfBandGrad)" />}

 {/* Calibrated line */}
 <path d={calPath} fill="none" stroke={T.teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

 {/* Raw BIA dots */}
 {filteredData.map((d, i) => d.isDEXA ? (
 <g key={i} onMouseEnter={ => setHoverIdx(i)} onTouchStart={ => setHoverIdx(i)}>
 <polygon points={`${xPos(i)},${yPos(d.raw) - 6} ${xPos(i) + 5},${yPos(d.raw)} ${xPos(i)},${yPos(d.raw) + 6} ${xPos(i) - 5},${yPos(d.raw)}`}
 fill={T.warn} stroke={T.bg} strokeWidth="1" />
 <text x={xPos(i)} y={yPos(d.raw) - 9} fill={T.warn} fontSize="7" fontFamily={T.mono} textAnchor="middle">DEXA</text>
 </g>
 ) : (
 <circle key={i} cx={xPos(i)} cy={yPos(d.raw)} r="2.5" fill={T.text3} opacity="0.4"
 onMouseEnter={ => setHoverIdx(i)} onTouchStart={ => setHoverIdx(i)} />
 ))}

 {/* X-axis labels */}
 {filteredData.filter((_, i) => i % xStep === 0 || i === filteredData.length - 1).map((d) => {
 const i = filteredData.indexOf(d);
 return <text key={d.date} x={xPos(i)} y={H - 4} fill={T.text3} fontSize="8.5" fontFamily={T.mono} textAnchor="middle">{d.date.slice(5)}</text>;
 })}

 {/* Hover */}
 {hoverIdx !== null && filteredData[hoverIdx] && (
 <g>
 <line x1={xPos(hoverIdx)} y1={PAD.top} x2={xPos(hoverIdx)} y2={PAD.top + cH} stroke={T.text2} strokeWidth="0.5" strokeDasharray="3,2" />
 <circle cx={xPos(hoverIdx)} cy={yPos(filteredData[hoverIdx].calibrated)} r="4" fill={T.teal} stroke={T.bg} strokeWidth="1.5" />
 <rect x={Math.max(2, Math.min(xPos(hoverIdx) - 55, W - 112))} y={PAD.top - 2} width="110" height="30" rx="4"
 fill={T.bgGlass} stroke={T.border} strokeWidth="0.5" />
 <text x={Math.max(57, Math.min(xPos(hoverIdx), W - 57))} y={PAD.top + 10} fill={T.text} fontSize="9" fontFamily={T.mono} textAnchor="middle">
 {filteredData[hoverIdx].date.slice(5)} {filteredData[hoverIdx].calibrated}%
 </text>
 <text x={Math.max(57, Math.min(xPos(hoverIdx), W - 57))} y={PAD.top + 22} fill={T.text3} fontSize="8" fontFamily={T.mono} textAnchor="middle">
 raw: {filteredData[hoverIdx].raw}%{filteredData[hoverIdx].isDEXA ? ' (DEXA)' : ''}
 </text>
 </g>
 )}
 </svg>

 {/* Legend */}
 <div style={{ display: 'flex', gap: '12px', padding: '6px 4px 0', fontSize: '10px' }}>
 <span style={{ color: T.text3 }}>● BIA</span>
 <span style={{ color: T.teal }}>● Calibrated</span>
 <span style={{ color: T.warn }}>◆ DEXA</span>
 </div>
 </GlassCard>
 </div>
 );
}

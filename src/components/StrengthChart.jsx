import React, { useState, useMemo } from 'react';
import { Dumbbell } from 'lucide-react';
import { T } from '@/design/tokens';
import { LS } from '@/lib/storage';
import { estimate1RM, getExerciseHistory } from '@/lib/progressiveOverload';
import { getWorkoutExercises } from '@/lib/workoutNormalize';
import GlassCard from '@/components/GlassCard';

function ExerciseProgressChart({ settings }) {
 const [selectedExId, setSelectedExId] = useState(null);
 const [hoverIdx, setHoverIdx] = useState(null);
 const wUnit = settings?.weightUnit || 'lbs';

 // Build a list of exercises the user has history for, sorted by most recently trained
 const exerciseList = useMemo(() => {
 const exMap = {};
 const keys = LS.keys('workout:').sort((a, b) => b.localeCompare(a));
 for (const key of keys) {
 const raw = LS.get(key, null);
 const exercises = getWorkoutExercises(raw);
 const dateStr = key.replace('workout:', '');
 for (const ex of exercises) {
 const doneSets = (ex.logSets || []).filter(s => s.done && (s.weight || s.reps));
 if (doneSets.length === 0) continue;
 if (!exMap[ex.id]) {
 exMap[ex.id] = { id: ex.id, name: ex.name || ex.id, sessions: 0, lastDate: dateStr };
 }
 exMap[ex.id].sessions++;
 }
 }
 return Object.values(exMap).sort((a, b) => b.lastDate.localeCompare(a.lastDate));
 }, []);

 // Get data for the selected exercise
 const chartData = useMemo(() => {
 if (!selectedExId) return [];
 const history = getExerciseHistory(selectedExId, 20);
 if (!history || history.length === 0) return [];
 return history.map(session => {
 const sets = session.sets || [];
 let maxWeight = 0, bestE1RM = 0, totalVolume = 0, maxReps = 0;
 for (const s of sets) {
 const w = parseFloat(s.weight) || 0;
 const r = parseInt(s.reps) || 0;
 if (w > maxWeight) maxWeight = w;
 if (r > maxReps) maxReps = r;
 totalVolume += w * r;
 const e = estimate1RM(w, r);
 if (e > bestE1RM) bestE1RM = Math.round(e);
 }
 return { date: session.date, maxWeight, bestE1RM, totalVolume, maxReps, sets: sets.length };
 }).reverse(); // Chronological order
 }, [selectedExId]);

 // All-time stats
 const stats = useMemo(() => {
 if (chartData.length === 0) return null;
 return {
 bestWeight: Math.max(...chartData.map(d => d.maxWeight)),
 bestE1RM: Math.max(...chartData.map(d => d.bestE1RM)),
 bestVolume: Math.max(...chartData.map(d => d.totalVolume)),
 totalSessions: chartData.length,
 firstDate: chartData[0]?.date,
 lastDate: chartData[chartData.length - 1]?.date,
 };
 }, [chartData]);

 if (exerciseList.length === 0) return null;

 // Auto-select first exercise if none selected
 const activeExId = selectedExId || exerciseList[0]?.id;
 const activeData = selectedExId ? chartData : [];

 // Chart rendering
 const W = 420, H = 200, PAD = { top: 16, right: 14, bottom: 32, left: 44 };
 const cW = W - PAD.left - PAD.right;
 const cH = H - PAD.top - PAD.bottom;

 const data = activeData;
 const hasData = data.length >= 1;

 // Scales
 const weights = data.map(d => d.maxWeight);
 const e1rms = data.map(d => d.bestE1RM);
 const volumes = data.map(d => d.totalVolume);
 const allYVals = [...weights,...e1rms].filter(v => v > 0);
 const minY = allYVals.length > 0 ? Math.floor(Math.min(...allYVals) * 0.9) : 0;
 const maxY = allYVals.length > 0 ? Math.ceil(Math.max(...allYVals) * 1.05) : 100;
 const yRange = maxY - minY || 1;
 const maxVol = Math.max(...volumes, 1);

 const xPos = (i) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * cW : cW / 2);
 const yPos = (v) => PAD.top + (1 - (v - minY) / yRange) * cH;
 const volH = (v) => (v / maxVol) * cH * 0.5; // Volume bars — half height

 // Line paths
 const weightPath = data.length > 1
 ? data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.maxWeight).toFixed(1)}`).join(' ')
 : '';
 const e1rmPath = data.length > 1
 ? data.filter(d => d.bestE1RM > 0).map((d, i) => {
 const idx = data.indexOf(d);
 return `${i === 0 ? 'M' : 'L'}${xPos(idx).toFixed(1)},${yPos(d.bestE1RM).toFixed(1)}`;
 }).join(' ')
 : '';

 // Y-axis labels
 const ySteps = 4;
 const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
 const v = minY + (yRange * i) / ySteps;
 return { v: Math.round(v), py: yPos(v) };
 });

 // X-axis labels
 const xLabelStep = Math.max(1, Math.floor((data.length - 1) / Math.max(4, 1)));

 return (
 <div style={{ marginBottom:'20px' }}>
 <h3 style={{ fontSize:'15px', fontWeight:600, marginBottom:'12px' }}>Exercise Progress</h3>
 <GlassCard animate={false} style={{ padding:'16px' }}>
 {/* Exercise selector */}
 <div style={{ marginBottom:'14px' }}>
 <select
 value={activeExId || ''}
 onChange={e => setSelectedExId(e.target.value)}
 aria-label="Select exercise to view progress"
 style={{
 width:'100%', padding:'10px 12px', borderRadius:'10px',
 border:`1px solid ${T.border}`, background:'rgba(255,255,255,0.04)',
 color:T.text, fontSize:'14px', fontFamily:T.font, outline:'none',
 cursor:'pointer', appearance:'none',
 backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
 backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center',
 }}>
 {exerciseList.map(ex => (
 <option key={ex.id} value={ex.id} style={{ background:T.bg, color:T.text }}>
 {ex.name} ({ex.sessions} session{ex.sessions !== 1 ? 's' : ''})
 </option>
 ))}
 </select>
 </div>

 {!hasData && (
 <div style={{ textAlign:'center', padding:'24px 16px', color:T.text3, fontSize:'13px' }}>
 {selectedExId ? 'Select an exercise above to see progress' : 'Select an exercise to view strength trends'}
 </div>
 )}

 {hasData && data.length === 1 && (
 <div style={{ textAlign:'center', padding:'16px', color:T.text3, fontSize:'13px' }}>
 <Dumbbell size={20} style={{ marginBottom:'8px', opacity:0.5 }} />
 <div>1 session logged. Train again to see trends.</div>
 <div style={{ marginTop:'8px', fontSize:'12px', fontFamily:T.mono }}>
 Max: {data[0].maxWeight} {wUnit} · e1RM: {data[0].bestE1RM} {wUnit} · Vol: {data[0].totalVolume.toLocaleString()}
 </div>
 </div>
 )}

 {hasData && data.length >= 2 && (
 <>
 {/* Legend */}
 <div style={{ display:'flex', gap:'12px', marginBottom:'8px', fontSize:'10px', flexWrap:'wrap' }}>
 <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <span style={{ width:12, height:3, borderRadius:2, background:T.accent, display:'inline-block' }} />
 <span style={{ color:T.text3 }}>Top Weight</span>
 </span>
 <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <span style={{ width:12, height:3, borderRadius:2, background:T.teal, display:'inline-block' }} />
 <span style={{ color:T.text3 }}>Est. 1RM</span>
 </span>
 <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <span style={{ width:12, height:8, borderRadius:2, background:'rgba(255,255,255,0.08)', display:'inline-block' }} />
 <span style={{ color:T.text3 }}>Volume</span>
 </span>
 </div>

 {/* SVG Chart */}
 <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', display:'block' }}
 role="img" aria-label={`Strength progress chart for selected exercise`}
 onMouseLeave={() => setHoverIdx(null)} onTouchEnd={() => setHoverIdx(null)}>

 <defs>
 <linearGradient id="exWeightGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor={T.accent} stopOpacity="0.12" />
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

 {/* Volume bars */}
 {data.map((d, i) => {
 const barW = Math.max(6, (cW / data.length) * 0.5);
 const barH = volH(d.totalVolume);
 return (
 <rect key={`vol-${i}`}
 x={xPos(i) - barW / 2} y={PAD.top + cH - barH}
 width={barW} height={barH}
 fill="rgba(255,255,255,0.06)" rx="2"
 onMouseEnter={() => setHoverIdx(i)}
 onTouchStart={() => setHoverIdx(i)}
 style={{ cursor:'pointer' }}
 />
 );
 })}

 {/* Weight line + area */}
 {weightPath && (
 <>
 <path d={weightPath + ` L${xPos(data.length - 1).toFixed(1)},${(PAD.top + cH).toFixed(1)} L${PAD.left},${(PAD.top + cH).toFixed(1)} Z`}
 fill="url(#exWeightGrad)" />
 <path d={weightPath} fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
 </>
 )}

 {/* e1RM line */}
 {e1rmPath && (
 <path d={e1rmPath} fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
 strokeDasharray="6,3" />
 )}

 {/* Data points */}
 {data.map((d, i) => (
 <g key={`dots-${i}`}>
 <circle cx={xPos(i)} cy={yPos(d.maxWeight)} r="3.5"
 fill={T.accent} stroke={T.bg} strokeWidth="1"
 onMouseEnter={() => setHoverIdx(i)}
 onTouchStart={() => setHoverIdx(i)}
 style={{ cursor:'pointer' }} />
 {d.bestE1RM > 0 && (
 <circle cx={xPos(i)} cy={yPos(d.bestE1RM)} r="3"
 fill={T.teal} stroke={T.bg} strokeWidth="1"
 onMouseEnter={() => setHoverIdx(i)}
 onTouchStart={() => setHoverIdx(i)}
 style={{ cursor:'pointer' }} />
 )}
 </g>
 ))}

 {/* X-axis labels */}
 {data.filter((_, i) => i % xLabelStep === 0 || i === data.length - 1).map((d) => {
 const i = data.indexOf(d);
 const parts = d.date.split('-');
 const label = parts.length >= 3
 ? new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' })
 : d.date.slice(5);
 return (
 <text key={d.date} x={xPos(i)} y={H - 4} fill={T.text3}
 fontSize="8" fontFamily={T.mono} textAnchor="middle">{label}</text>
 );
 })}

 {/* Hover tooltip */}
 {hoverIdx !== null && data[hoverIdx] && (() => {
 const d = data[hoverIdx];
 const tx = Math.max(60, Math.min(xPos(hoverIdx), W - 60));
 return (
 <g>
 <line x1={xPos(hoverIdx)} y1={PAD.top} x2={xPos(hoverIdx)} y2={PAD.top + cH}
 stroke={T.text2} strokeWidth="0.5" strokeDasharray="3,2" />
 <rect x={tx - 56} y={PAD.top - 4} width="112" height="44" rx="6"
 fill={T.bgGlass} stroke={T.border} strokeWidth="0.5" />
 <text x={tx} y={PAD.top + 8} fill={T.text} fontSize="9" fontFamily={T.mono} textAnchor="middle" fontWeight="600">
 {d.maxWeight} {wUnit} · e1RM {d.bestE1RM}
 </text>
 <text x={tx} y={PAD.top + 20} fill={T.text3} fontSize="8" fontFamily={T.mono} textAnchor="middle">
 Vol: {d.totalVolume.toLocaleString()} · {d.sets} sets
 </text>
 <text x={tx} y={PAD.top + 32} fill={T.text3} fontSize="8" fontFamily={T.mono} textAnchor="middle">
 {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'2-digit' })}
 </text>
 </g>
 );
 })()}
 </svg>
 </>
 )}

 {/* Stats summary */}
 {stats && data.length >= 2 && (
 <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginTop:'12px' }}>
 {[
 { label:'Best Weight', value:`${stats.bestWeight}`, sub:wUnit, color:T.accent },
 { label:'Best e1RM', value:`${stats.bestE1RM}`, sub:wUnit, color:T.teal },
 { label:'Best Volume', value: stats.bestVolume >= 10000 ? `${(stats.bestVolume/1000).toFixed(1)}k` : stats.bestVolume.toLocaleString(), sub:wUnit, color:T.text2 },
 ].map((s, i) => (
 <div key={i} style={{
 background:'rgba(255,255,255,0.03)', borderRadius:'10px', padding:'10px 8px', textAlign:'center',
 }}>
 <div style={{ fontSize:'16px', fontWeight:700, fontFamily:T.mono, color:s.color, lineHeight:1 }}>
 {s.value}
 </div>
 <div style={{ fontSize:'9px', color:T.text3, marginTop:'3px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
 {s.sub} · {s.label}
 </div>
 </div>
 ))}
 </div>
 )}
 {stats && (
 <div style={{ fontSize:'11px', color:T.text3, marginTop:'8px', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'4px' }}>
 <span>{stats.totalSessions} session{stats.totalSessions !== 1 ? 's' : ''} logged</span>
 {stats.firstDate && (
 <span>Since {new Date(stats.firstDate + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</span>
 )}
 </div>
 )}
 </GlassCard>
 </div>
 );
}

export default ExerciseProgressChart;

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Dumbbell, Check, Clock, RotateCcw, Flame, Trophy, X,
  Heart, Activity
} from 'lucide-react';
import { T } from '@/design/tokens';
import { XP_REWARDS } from '@/data/levels';
import { EXERCISES } from '@/data/exercises';
import { SPLIT_TEMPLATES, selectSplit } from '@/data/splitTemplates';
import { today } from '@/lib/dateUtils';
import { LS } from '@/lib/storage';
import { normalizeWorkout, getWorkoutExercises } from '@/lib/workoutNormalize';
import { isWorkingVolume } from '@/lib/progressiveOverload';
import GlassCard from '@/components/GlassCard';
import ExerciseCard from '@/components/ExerciseCard';
import { WorkoutTimerBar } from '@/components/RestTimerBar';
import DailyLogCard from '@/components/DailyLogCard';
import JournalCard from '@/components/JournalCard';

// ============================================================
// SESSION FEEDBACK CARD
// ============================================================

export function SessionFeedbackCard({ allDone, exercises, workout, weightUnit = 'lbs', sessionRPE, durationMinutes, onSessionMeta, sessionPRCount = 0 }) {
 const [localRPE, setLocalRPE] = useState(sessionRPE || null);
 const [localDuration, setLocalDuration] = useState(durationMinutes || '');
 const [saved, setSaved] = useState(sessionRPE !== null);
 const rpeLabels = { 1:'Very Easy', 2:'Easy', 3:'Moderate', 4:'Somewhat Hard', 5:'Hard',
 6:'Harder', 7:'Very Hard', 8:'Extremely Hard', 9:'Near Max', 10:'Max Effort' };
 const rpeColor = (v) => v <= 3 ? T.success : v <= 6 ? T.teal : v <= 8 ? T.warn : T.danger;

 // ---- Compute session summary ----
 const summary = useMemo(() => {
 if (!exercises) return null;
 let totalVolume = 0, setsCompleted = 0, totalSets = 0, exercisesCompleted = 0;
 const exerciseNames = [];
 const muscleGroups = new Set();
 for (const ex of exercises) {
 const sets = ex.logSets || [];
 totalSets += sets.length;
 const doneSets = sets.filter(s => s.done);
 setsCompleted += doneSets.length;
 if (doneSets.length === sets.length && sets.length > 0) exercisesCompleted++;
 for (const s of doneSets) {
 if (!isWorkingVolume(s)) continue; // warm-up sets excluded from volume
 const w = parseFloat(s.weight) || 0;
 const r = parseInt(s.reps) || 0;
 totalVolume += w * r;
 }
 if (doneSets.length > 0) {
 exerciseNames.push(ex.name);
 if (ex.primaryMuscleGroup) muscleGroups.add(ex.primaryMuscleGroup);
 }
 }
 // Auto-compute duration from startedAt
 const autoMinutes = workout?.startedAt ? Math.round((Date.now() - workout.startedAt) / 60000) : null;
 return { totalVolume, setsCompleted, totalSets, exercisesCompleted, totalExercises: exercises.length, autoMinutes, exerciseNames, muscleGroups: [...muscleGroups] };
 }, [exercises, workout?.startedAt]);

 // ---- Compare to last session of same split ----
 const comparison = useMemo(() => {
 if (!workout?.splitDay || !summary) return null;
 try {
 const todayStr = today();
 const keys = LS.keys('workout:').sort((a, b) => b.localeCompare(a));
 for (const key of keys) {
 const dateStr = key.replace('workout:', '');
 if (dateStr === todayStr) continue;
 const raw = LS.get(key, null);
 const prev = normalizeWorkout(raw);
 if (!prev || prev.splitDay !== workout.splitDay) continue;
 // Found last session of same split — compute its volume
 const prevExercises = prev.exercises || [];
 let prevVolume = 0, prevSets = 0;
 for (const ex of prevExercises) {
 for (const s of (ex.logSets || []).filter(s => s.done && isWorkingVolume(s))) {
 prevVolume += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
 prevSets++;
 }
 }
 if (prevVolume === 0 && prevSets === 0) continue;
 const volDelta = summary.totalVolume - prevVolume;
 const volPct = prevVolume > 0 ? Math.round((volDelta / prevVolume) * 100) : 0;
 return { prevVolume, prevSets, volDelta, volPct, date: dateStr };
 }
 } catch(e) {}
 return null;
 }, [workout?.splitDay, summary]);

 // Pre-fill auto duration
 useEffect(() => {
 if (summary?.autoMinutes && !localDuration && !durationMinutes) {
 setLocalDuration(String(summary.autoMinutes));
 }
 }, [summary?.autoMinutes]); // eslint-disable-line react-hooks/exhaustive-deps

 const handleSave = () => {
 if (onSessionMeta) {
 onSessionMeta({ sessionRPE: localRPE, durationMinutes: localDuration ? Number(localDuration) : null });
 setSaved(true);
 }
 };

 const fmtVol = (v) => v >= 10000 ? `${(v/1000).toFixed(1)}k` : v.toLocaleString();

 return (
 <GlassCard style={{
 background: allDone ? 'rgba(0,230,118,0.08)' : 'rgba(255,107,53,0.08)',
 border: `1px solid ${allDone ? 'rgba(0,230,118,0.15)' : 'rgba(255,107,53,0.15)'}`,
 textAlign: 'center', marginTop: '16px',
 }}>
 <div style={{ fontSize:'24px', marginBottom:'8px' }}>{allDone ? '\uD83C\uDF89' : '\uD83D\uDCAA'}</div>
 <h3 style={{ fontSize:'16px', fontWeight:700, marginBottom:'4px' }}>
 {allDone ? 'Workout Complete!' : 'Mandatory Complete!'}
 </h3>
 <p style={{ fontSize:'13px', color:T.text2, marginBottom:'16px' }}>
 {allDone ? (saved ? 'Great work. Rest up and recover.' : 'Here\'s what you did.') : 'Bonus exercises remaining if you have energy.'}
 </p>

 {/* ---- Session Summary Stats ---- */}
 {summary && (summary.setsCompleted > 0) && (
 <div style={{ marginBottom:'16px' }}>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'12px' }}>
 {[
 { label: 'Volume', value: fmtVol(summary.totalVolume), sub: weightUnit },
 { label: 'Sets', value: `${summary.setsCompleted}/${summary.totalSets}`, sub: 'completed' },
 { label: 'Duration', value: summary.autoMinutes ? `${summary.autoMinutes}` : '\u2014', sub: summary.autoMinutes ? 'min' : '' },
 ].map((stat, i) => (
 <div key={i} style={{
 background:'rgba(255,255,255,0.04)', borderRadius:'10px', padding:'10px 6px',
 border:`1px solid rgba(255,255,255,0.04)`,
 }}>
 <div style={{ fontSize:'18px', fontWeight:700, fontFamily:T.mono, color:T.text, lineHeight:1 }}>
 {stat.value}
 </div>
 <div style={{ fontSize:'9px', color:T.text3, marginTop:'2px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
 {stat.sub && <span style={{ fontWeight:400 }}>{stat.sub} · </span>}{stat.label}
 </div>
 </div>
 ))}
 </div>

 {/* Exercises completed list */}
 <div style={{ fontSize:'12px', color:T.text3, lineHeight:1.6, marginBottom: (comparison || sessionPRCount > 0) ? '12px' : '0' }}>
 {summary.exercisesCompleted}/{summary.totalExercises} exercises: {summary.exerciseNames.slice(0, 4).join(', ')}{summary.exerciseNames.length > 4 ? ` +${summary.exerciseNames.length - 4} more` : ''}
 </div>

 {/* Session PRs */}
 {sessionPRCount > 0 ? (
 <div style={{
 display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
 padding:'8px 12px', borderRadius:'8px', marginBottom: comparison ? '12px' : '0',
 background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)',
 }}>
 <Trophy size={14} style={{ color: '#FFD700' }} />
 <span style={{ fontSize:'13px', color:'#FFD700', fontWeight:600 }}>
 {sessionPRCount + ' Personal Record' + (sessionPRCount !== 1 ? 's' : '') + ' today!'}
 </span>
 </div>
 ) : null}

 {/* Comparison to last session */}
 {comparison && comparison.prevVolume > 0 && (
 <div style={{
 display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
 padding:'8px 12px', borderRadius:'8px',
 background: comparison.volDelta >= 0 ? 'rgba(0,230,118,0.06)' : 'rgba(255,107,53,0.06)',
 border: `1px solid ${comparison.volDelta >= 0 ? 'rgba(0,230,118,0.12)' : 'rgba(255,107,53,0.12)'}`,
 }}>
 <span style={{ fontSize:'13px', color: comparison.volDelta >= 0 ? T.success : T.accent, fontWeight:600 }}>
 {comparison.volDelta >= 0 ? '\u2191' : '\u2193'} {Math.abs(comparison.volPct)}% volume
 </span>
 <span style={{ fontSize:'11px', color:T.text3 }}>
 vs last {workout?.splitDay?.replace(/_/g, ' ')} ({fmtVol(comparison.prevVolume)} {weightUnit})
 </span>
 </div>
 )}
 </div>
 )}

 {/* ---- RPE & Duration Input ---- */}
 {!saved && allDone && (
 <div style={{ textAlign:'left', borderTop:`1px solid rgba(255,255,255,0.06)`, paddingTop:'16px' }}>
 <div style={{ marginBottom:'12px' }}>
 <div style={{ fontSize:'11px', fontWeight:600, color:T.text3, textTransform:'uppercase', letterSpacing:'0.3px', marginBottom:'8px' }}>Session RPE</div>
 <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', justifyContent:'center' }}>
 {[1,2,3,4,5,6,7,8,9,10].map(v => (
 <button key={v} onClick={() => setLocalRPE(v)} style={{
 width:'40px', height:'40px', borderRadius:'8px', border:'none', cursor:'pointer',
 fontSize:'13px', fontWeight:700, fontFamily:T.mono, transition:'all 0.15s',
 background: localRPE === v ? rpeColor(v) : 'rgba(255,255,255,0.04)',
 color: localRPE === v ? '#fff' : T.text3,
 transform: localRPE === v ? 'scale(1.1)' : 'scale(1)',
 }}>{v}</button>
 ))}
 </div>
 {localRPE && (
 <div style={{ textAlign:'center', marginTop:'4px', fontSize:'11px', color:rpeColor(localRPE), fontWeight:600 }}>{rpeLabels[localRPE]}</div>
 )}
 </div>
 <div style={{ marginBottom:'16px' }}>
 <div style={{ fontSize:'11px', fontWeight:600, color:T.text3, textTransform:'uppercase', letterSpacing:'0.3px', marginBottom:'6px' }}>
 Duration (minutes){summary?.autoMinutes ? ' \u00B7 auto-tracked' : ''}
 </div>
 <input type="number" value={localDuration} onChange={e => setLocalDuration(e.target.value)}
 placeholder="e.g. 45" min="1" max="300" aria-label="Workout duration in minutes"
 style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:`1px solid ${T.border}`,
 background:'rgba(255,255,255,0.04)', color:T.text, fontSize:'16px', fontFamily:T.mono, outline:'none', textAlign:'center' }} />
 </div>
 <button onClick={handleSave} disabled={!localRPE}
 style={{ width:'100%', padding:'12px', borderRadius:'10px', border:'none',
 background: localRPE ? `linear-gradient(135deg, ${T.accent}, #FF8C42)` : 'rgba(255,255,255,0.06)',
 color: localRPE ? '#fff' : T.text3, fontSize:'14px', fontWeight:600,
 cursor: localRPE ? 'pointer' : 'default' }}>
 {localRPE ? 'Save Session Feedback' : 'Select RPE to save'}
 </button>
 </div>
 )}
 {saved && sessionRPE && (
 <div style={{ borderTop:`1px solid rgba(255,255,255,0.06)`, paddingTop:'10px' }}>
 <div style={{ display:'flex', justifyContent:'center', gap:'16px' }}>
 <span style={{ fontSize:'12px', color:T.text3 }}>RPE: <strong style={{ color:rpeColor(sessionRPE) }}>{sessionRPE}</strong></span>
 {durationMinutes && <span style={{ fontSize:'12px', color:T.text3 }}>Duration: <strong>{durationMinutes} min</strong></span>}
 </div>
 </div>
 )}
 </GlassCard>
 );
}

// ============================================================
// WORKOUT SUMMARY MODAL (Full-screen overlay)
// ============================================================

export function WorkoutSummaryModal({ exercises, workout, weightUnit = 'lbs', sessionPRCount = 0, onClose, onSaveNotes }) {
 const dialogRef = useRef(null);
 const [sessionNotes, setSessionNotes] = useState(workout?.sessionNotes || '');

 useEffect(() => {
 const el = dialogRef.current;
 if (!el) return;
 const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
 focusable[0]?.focus();
 }, []);

 const summary = useMemo(() => {
 if (!exercises) return null;
 let totalVolume = 0, warmupVolume = 0, setsCompleted = 0, totalSets = 0, exercisesCompleted = 0;
 const muscleGroups = new Set();
 const exerciseNames = [];
 for (const ex of exercises) {
 const sets = ex.logSets || [];
 totalSets += sets.length;
 const doneSets = sets.filter(s => s.done);
 setsCompleted += doneSets.length;
 if (doneSets.length === sets.length && sets.length > 0) exercisesCompleted++;
 for (const s of doneSets) {
 const w = parseFloat(s.weight) || 0;
 const r = parseInt(s.reps) || 0;
 const vol = w * r;
 if (isWorkingVolume(s)) totalVolume += vol;
 else warmupVolume += vol;
 }
 if (doneSets.length > 0) {
 exerciseNames.push(ex.name);
 if (ex.primaryMuscleGroup) muscleGroups.add(ex.primaryMuscleGroup);
 for (const sec of (ex.secondaryMuscleGroups || [])) muscleGroups.add(sec);
 }
 }
 const autoMinutes = workout?.startedAt ? Math.round((Date.now() - workout.startedAt) / 60000) : null;
 const durationMin = workout?.durationMinutes || autoMinutes;
 return { totalVolume, warmupVolume, setsCompleted, totalSets, exercisesCompleted, totalExercises: exercises.length, muscleGroups: [...muscleGroups], exerciseNames, durationMin };
 }, [exercises, workout]);

 if (!summary) return null;

 const fmtVol = (v) => v >= 10000 ? `${(v/1000).toFixed(1)}k` : v.toLocaleString();

 const muscleColors = {
 chest: T.accent, back: T.teal, shoulders: '#B39DDB', triceps: '#FF8A65',
 biceps: '#4FC3F7', legs: T.success, core: T.warn, glutes: '#F06292',
 forearms: '#A1887F', 'front_delts': '#B39DDB', 'rear_delts': '#B39DDB',
 };

 const handleClose = () => {
 if (sessionNotes.trim() && onSaveNotes) onSaveNotes(sessionNotes.trim());
 onClose();
 };

 return (
 <div onClick={handleClose} onKeyDown={(e) => { if (e.key === 'Escape') handleClose(); }}
 style={{
 position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.7)',
 backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
 display:'flex', alignItems:'center', justifyContent:'center', padding:'20px',
 animation:'fadeIn 0.3s ease-out',
 }}>
 <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Workout Summary"
 onClick={e => e.stopPropagation()} style={{
 width:'100%', maxWidth:'400px', maxHeight:'85vh', overflow:'auto',
 borderRadius:'24px', background:`linear-gradient(180deg, rgba(15,15,30,0.98), rgba(7,7,14,0.98))`,
 border:`1px solid ${T.border}`, boxShadow:'0 32px 64px rgba(0,0,0,0.6)',
 padding: '32px 24px',
 }}>

 {/* Header */}
 <div style={{ textAlign:'center', marginBottom:'24px' }}>
 <div style={{ fontSize:'48px', marginBottom:'8px', animation:'pulse 0.6s ease-out' }}>
 {sessionPRCount > 0 ? '\uD83C\uDFC6' : '\uD83C\uDF89'}
 </div>
 <h2 style={{ fontSize:'22px', fontWeight:800, letterSpacing:'-0.02em', marginBottom:'4px',
 background:`linear-gradient(135deg, ${T.accent}, ${T.teal})`,
 WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
 Workout Complete!
 </h2>
 {workout?.splitDay && (
 <div style={{ fontSize:'13px', color:T.text3, textTransform:'capitalize' }}>
 {workout.splitDay.replace(/_/g, ' ')}
 </div>
 )}
 </div>

 {/* Stats grid */}
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px' }}>
 {[
 { label:'Total Volume', value: fmtVol(summary.totalVolume), sub: weightUnit, big: summary.totalVolume >= 10000 },
 { label:'Duration', value: summary.durationMin ? `${summary.durationMin}` : '\u2014', sub: summary.durationMin ? 'min' : '' },
 { label:'Sets', value: `${summary.setsCompleted}/${summary.totalSets}` },
 { label:'Exercises', value: `${summary.exercisesCompleted}/${summary.totalExercises}` },
 ].map((stat, i) => (
 <div key={i} style={{
 background:'rgba(255,255,255,0.04)', borderRadius:'14px', padding:'14px 12px', textAlign:'center',
 border: stat.big ? `1px solid rgba(255,107,53,0.15)` : `1px solid rgba(255,255,255,0.04)`,
 animation: `fadeUp 0.3s ease-out ${0.1 + i * 0.05}s both`,
 }}>
 <div style={{ fontSize:'24px', fontWeight:800, fontFamily:T.mono, color: stat.big ? T.accent : T.text, lineHeight:1 }}>
 {stat.value}
 </div>
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'4px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
 {stat.sub ? `${stat.sub} \u00B7 ` : ''}{stat.label}
 </div>
 </div>
 ))}
 </div>

 {/* PRs */}
 {sessionPRCount > 0 && (
 <div style={{
 display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
 padding:'12px 16px', borderRadius:'12px', marginBottom:'16px',
 background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.2)',
 animation: 'fadeUp 0.3s ease-out 0.25s both',
 }}>
 <Trophy size={18} style={{ color:'#FFD700' }} />
 <span style={{ fontSize:'15px', color:'#FFD700', fontWeight:700 }}>
 {sessionPRCount} Personal Record{sessionPRCount !== 1 ? 's' : ''}!
 </span>
 </div>
 )}

 {/* Muscle groups */}
 {summary.muscleGroups.length > 0 && (
 <div style={{ marginBottom:'16px', animation:'fadeUp 0.3s ease-out 0.3s both' }}>
 <div style={{ fontSize:'10px', color:T.text3, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px', fontWeight:600 }}>
 Muscles Hit
 </div>
 <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
 {summary.muscleGroups.map(mg => (
 <span key={mg} style={{
 padding:'4px 10px', borderRadius:'8px', fontSize:'11px', fontWeight:600,
 background:`${muscleColors[mg] || T.accent}18`,
 color: muscleColors[mg] || T.accent,
 border:`1px solid ${muscleColors[mg] || T.accent}30`,
 textTransform:'capitalize',
 }}>
 {mg.replace(/_/g, ' ')}
 </span>
 ))}
 </div>
 </div>
 )}

 {/* Session RPE */}
 {workout?.sessionRPE && (
 <div style={{ display:'flex', justifyContent:'center', gap:'16px', marginBottom:'16px',
 fontSize:'13px', color:T.text2, animation:'fadeUp 0.3s ease-out 0.35s both' }}>
 <span>Session RPE: <strong style={{ color: workout.sessionRPE <= 5 ? T.success : workout.sessionRPE <= 7 ? T.teal : workout.sessionRPE <= 8 ? T.warn : T.danger }}>{workout.sessionRPE}</strong></span>
 {summary.warmupVolume > 0 && (
 <span>Warm-up: <strong>{fmtVol(summary.warmupVolume)} {weightUnit}</strong></span>
 )}
 </div>
 )}

 {/* Session notes */}
 <div style={{ marginBottom:'20px', animation:'fadeUp 0.3s ease-out 0.4s both' }}>
 <div style={{ fontSize:'10px', color:T.text3, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px', fontWeight:600 }}>
 How did it feel?
 </div>
 <textarea
 value={sessionNotes} onChange={e => setSessionNotes(e.target.value)}
 placeholder="Optional notes about this workout."
 rows={2} maxLength={500}
 style={{
 width:'100%', padding:'10px 12px', borderRadius:'10px',
 border:`1px solid ${T.border}`, background:'rgba(255,255,255,0.04)',
 color:T.text, fontSize:'14px', fontFamily:T.font, outline:'none',
 resize:'vertical', minHeight:'48px',
 }}
 onFocus={e => e.target.style.borderColor = T.accent}
 onBlur={e => e.target.style.borderColor = T.border}
 />
 </div>

 {/* Close button */}
 <button onClick={handleClose} style={{
 width:'100%', padding:'14px', borderRadius:'14px', border:'none',
 background:`linear-gradient(135deg, ${T.accent}, #FF8C42)`,
 color:'#fff', fontSize:'15px', fontWeight:700, cursor:'pointer',
 boxShadow:`0 8px 24px ${T.accentGlow}`,
 animation:'fadeUp 0.3s ease-out 0.45s both',
 }}>
 Done
 </button>
 </div>
 </div>
 );
}

// ============================================================
// WORKOUT HISTORY DETAIL MODAL
// ============================================================

export function WorkoutDetailModal({ date, onClose }) {
 const dialogRef = useRef(null);
 const workoutRaw = LS.get(`workout:${date}`, null);
 const workout = normalizeWorkout(workoutRaw);
 const rehabRaw = LS.get(`rehab:${date}`, null);
 const cardioRaw = LS.get(`cardio:${date}`, null);

 // Focus trap: keep focus inside modal
 useEffect(() => {
 const el = dialogRef.current;
 if (!el) return;
 const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
 const first = focusable[0];
 const last = focusable[focusable.length - 1];
 first?.focus();
 const trap = (e) => {
 if (e.key !== 'Tab') return;
 if (e.shiftKey) {
 if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
 } else {
 if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
 }
 };
 el.addEventListener('keydown', trap);
 return () => el.removeEventListener('keydown', trap);
 }, []);

 const formatted = (() => {
 try {
 const d = new Date(date + 'T12:00:00');
 return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
 } catch { return date; }
 })();

 const exercises = workout?.exercises || [];
 const totalVolume = exercises.reduce((sum, ex) => {
 return sum + (ex.logSets || []).filter(s => s.done && isWorkingVolume(s)).reduce((sv, s) => sv + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0);
 }, 0);
 const totalSets = exercises.reduce((sum, ex) => sum + (ex.logSets || []).filter(s => s.done).length, 0);
 const totalSetsAll = exercises.reduce((sum, ex) => sum + (ex.logSets || []).length, 0);

 const hasAnyData = workout || rehabRaw || cardioRaw;

 return (
 <div onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }} style={{
 position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.6)',
 backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
 display:'flex', alignItems:'center', justifyContent:'center', padding:'20px',
 animation:'fadeIn 0.2s ease-out',
 }}>
 <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Workout details for ${formatted}`} onClick={e => e.stopPropagation()} style={{
 width:'100%', maxWidth:'440px', maxHeight:'80vh', overflow:'auto',
 borderRadius:'18px', background:T.bgGlass, border:`1px solid ${T.border}`,
 boxShadow:'0 24px 48px rgba(0,0,0,0.4)',
 }}>
 {/* Header */}
 <div style={{
 display:'flex', justifyContent:'space-between', alignItems:'center',
 padding:'18px 20px 14px', borderBottom:`1px solid ${T.border}`, position:'sticky', top:0,
 background:T.bgGlass, zIndex:1, borderRadius:'18px 18px 0 0',
 }}>
 <div>
 <div style={{ fontSize:'16px', fontWeight:700, color:T.text }}>{formatted}</div>
 {workout?.splitDay && (
 <div style={{ fontSize:'12px', color:T.accent, fontWeight:600, marginTop:'2px', textTransform:'capitalize' }}>
 {workout.splitDay.replace(/_/g, ' ')}
 </div>
 )}
 </div>
 <button onClick={onClose} aria-label="Close workout details" style={{
 background:'rgba(255,255,255,0.06)', border:'none', borderRadius:'10px',
 width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
 }}>
 <X size={16} color={T.text2} />
 </button>
 </div>

 <div style={{ padding:'16px 20px 20px' }}>
 {!hasAnyData && (
 <div style={{ textAlign:'center', padding:'32px 16px', color:T.text3, fontSize:'13px' }}>
 No data recorded for this date.
 </div>
 )}

 {/* Session meta */}
 {workout && (
 <div style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
 {workout.sessionRPE && (
 <div style={{ padding:'6px 12px', borderRadius:'8px', background:'rgba(255,107,53,0.1)', fontSize:'12px', fontWeight:600 }}>
 RPE {workout.sessionRPE}
 </div>
 )}
 {workout.durationMinutes && (
 <div style={{ padding:'6px 12px', borderRadius:'8px', background:'rgba(78,205,196,0.1)', fontSize:'12px', fontWeight:600, color:T.teal }}>
 <Clock size={12} style={{ verticalAlign:'middle', marginRight:'4px' }} />
 {workout.durationMinutes} min
 </div>
 )}
 <div style={{ padding:'6px 12px', borderRadius:'8px', background:'rgba(255,255,255,0.04)', fontSize:'12px', fontWeight:600, color:T.text2 }}>
 {totalSets}/{totalSetsAll} sets
 </div>
 {totalVolume > 0 && (
 <div style={{ padding:'6px 12px', borderRadius:'8px', background:'rgba(255,255,255,0.04)', fontSize:'12px', fontWeight:600, color:T.text2, fontFamily:T.mono }}>
 {totalVolume.toLocaleString()} vol
 </div>
 )}
 </div>
 )}

 {/* Exercises */}
 {exercises.map((ex, i) => {
 const doneSets = (ex.logSets || []).filter(s => s.done);
 if ((ex.logSets || []).length === 0) return null;
 return (
 <div key={i} style={{
 marginBottom:'12px', padding:'12px', borderRadius:'12px',
 background:'rgba(255,255,255,0.03)', border:`1px solid ${T.border}`,
 }}>
 <div style={{ fontSize:'13px', fontWeight:600, marginBottom:'8px', color:T.text }}>
 {ex.name || ex.id}
 </div>
 <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr 1fr', gap:'4px 12px', fontSize:'11px' }}>
 <div style={{ color:T.text3, fontWeight:600 }}>Set</div>
 <div style={{ color:T.text3, fontWeight:600 }}>Weight</div>
 <div style={{ color:T.text3, fontWeight:600 }}>Reps</div>
 <div style={{ color:T.text3, fontWeight:600 }}>RPE</div>
 {(ex.logSets || []).map((s, j) => (
 <React.Fragment key={j}>
 <div style={{ color: s.done ? T.text : T.text3, fontFamily:T.mono, display:'flex', alignItems:'center', gap:'3px' }}>
 {s.setType && s.setType !== 'working' && (
 <span style={{
 fontSize:'8px', fontWeight:800, padding:'1px 3px', borderRadius:'3px',
 background: s.setType === 'warmup' ? 'rgba(255,255,255,0.08)' : s.setType === 'drop' ? T.accentSoft : s.setType === 'failure' ? 'rgba(255,82,82,0.12)' : T.tealGlow,
 color: s.setType === 'warmup' ? T.text3 : s.setType === 'drop' ? T.accent : s.setType === 'failure' ? T.danger : T.teal,
 }}>{s.setType === 'warmup' ? 'W' : s.setType === 'drop' ? 'D' : s.setType === 'failure' ? 'F' : 'A'}</span>
 )}
 {j+1}
 </div>
 <div style={{ color: s.done ? T.text : T.text3, fontFamily:T.mono, opacity: s.done ? 1 : 0.4 }}>
 {s.weight || '\u2014'}
 </div>
 <div style={{ color: s.done ? T.text : T.text3, fontFamily:T.mono, opacity: s.done ? 1 : 0.4 }}>
 {s.reps || '\u2014'}
 </div>
 <div style={{ color: s.done ? T.text : T.text3, fontFamily:T.mono, opacity: s.done ? 1 : 0.4 }}>
 {s.rpe || '\u2014'}
 </div>
 </React.Fragment>
 ))}
 </div>
 {doneSets.length > 0 && (
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'6px', fontFamily:T.mono }}>
 Vol: {doneSets.filter(s => isWorkingVolume(s)).reduce((v,s) => v + (parseFloat(s.weight)||0)*(parseInt(s.reps)||0), 0).toLocaleString()}
 {doneSets.some(s => s.setType === 'warmup') && <span style={{ opacity:0.5 }}> (excl. warm-up)</span>}
 </div>
 )}
 </div>
 );
 })}

 {/* Rehab data */}
 {rehabRaw && (
 <div style={{ marginTop:'12px', padding:'12px', borderRadius:'12px', background:'rgba(78,205,196,0.06)', border:`1px solid rgba(78,205,196,0.15)` }}>
 <div style={{ fontSize:'12px', fontWeight:600, color:T.teal, marginBottom:'6px', display:'flex', alignItems:'center', gap:'6px' }}>
 <Heart size={14} /> Rehab
 </div>
 <div style={{ fontSize:'12px', color:T.text2 }}>
 {typeof rehabRaw === 'object' ? (
 Object.entries(rehabRaw).filter(([,v]) => v).map(([k]) => (
 <span key={k} style={{ display:'inline-block', padding:'3px 8px', borderRadius:'6px', background:'rgba(78,205,196,0.1)', marginRight:'6px', marginBottom:'4px', fontSize:'11px' }}>
 {k.replace(/_/g, ' ')}
 </span>
 ))
 ) : 'Completed'}
 </div>
 </div>
 )}

 {/* Cardio data */}
 {cardioRaw && (
 <div style={{ marginTop:'12px', padding:'12px', borderRadius:'12px', background:'rgba(255,107,53,0.06)', border:`1px solid rgba(255,107,53,0.15)` }}>
 <div style={{ fontSize:'12px', fontWeight:600, color:T.accent, marginBottom:'6px', display:'flex', alignItems:'center', gap:'6px' }}>
 <Activity size={14} /> Cardio
 </div>
 <div style={{ fontSize:'12px', color:T.text2 }}>
 {typeof cardioRaw === 'object' ? (
 <>
 {cardioRaw.type && <span style={{ textTransform:'capitalize' }}>{cardioRaw.type}</span>}
 {cardioRaw.duration && <span> &mdash; {cardioRaw.duration} min</span>}
 {cardioRaw.distance && <span> &mdash; {cardioRaw.distance} mi</span>}
 </>
 ) : 'Completed'}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}

// ============================================================
// TAB: TODAY
// ============================================================

function TodayTab({ profile, workout, onGenerateWorkout, onUpdateExercise, onSessionMeta, onAddXP, settings, goToSettings, nutritionConfig, calibration, onSaveBodyLog, onRemoveExercise, isGeneratingWorkout = false, restTimers = {}, onRestTimerChange }) {
 // Extract exercises from v2 format
 const exercises = workout?.exercises || (Array.isArray(workout) ? workout : null);
 const splitLabel = workout?.splitDay?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Full Body';

 // Split selector state
 const [selectedSplit, setSelectedSplit] = useState(null); // null = auto
 const [selectedDayIdx, setSelectedDayIdx] = useState(0);

 const handleSwapExercise = useCallback((currentId, newId) => {
 if (!newId || !workout?.exercises) return;
 const newExercise = EXERCISES.find(e => e.id === newId);
 if (!newExercise) return;
 const current = workout.exercises.find(e => e.id === currentId);
 if (!current) return;
 const trainingGoal = settings?.trainingGoal || 'hypertrophy';
 const repRange = newExercise.repRanges?.[trainingGoal] || newExercise.repRanges?.hypertrophy;
 const restTime = repRange?.rest || newExercise.rest || 90;
 const numSets = newExercise.sets || 3;
 const swapped = {
 ...newExercise,
 slot: current.slot, mandatory: current.mandatory, rest: restTime, prescription: null,
 logSets: Array.from({ length: numSets }, () => ({ weight: '', reps: '', rpe: '', done: false })),
 };
 onUpdateExercise(swapped, currentId);
 }, [workout, settings, onUpdateExercise]);

 // PR tracking state (must be declared before early return per Rules of Hooks)
 const [sessionPRCount, setSessionPRCount] = useState(0);
 const sessionPRsRef = useRef({});
 const handlePRDetected = useCallback((exerciseId, prs) => {
 sessionPRsRef.current[exerciseId] = prs;
 const total = Object.values(sessionPRsRef.current).reduce((sum, arr) => sum + arr.length, 0);
 setSessionPRCount(total);
 if (prs.length > 0 && onAddXP) onAddXP(XP_REWARDS.pr || 100, '\uD83C\uDFC6 PR! +' + (XP_REWARDS.pr || 100) + ' XP');
 }, [onAddXP]);

 // Workout Summary Modal state
 const [showSummary, setShowSummary] = useState(false);
 const handleSaveSessionNotes = useCallback((notes) => {
 if (onSessionMeta) onSessionMeta({ sessionNotes: notes });
 }, [onSessionMeta]);

 if (!exercises) {
 const autoSplit = selectSplit(settings?.daysPerWeek || 3, settings?.experienceLevel || 'beginner');
 const activeSplit = selectedSplit || autoSplit;
 const activeTemplate = SPLIT_TEMPLATES[activeSplit];
 const splitOptions = Object.entries(SPLIT_TEMPLATES);

 return (
 <div style={{ animation:'fadeIn 0.5s ease-out' }}>
 <DailyLogCard settings={settings} nutritionConfig={nutritionConfig} calibration={calibration}
 profile={profile} onSave={onSaveBodyLog} onAddXP={onAddXP} />

 {/* Journal Card */}
 <JournalCard workout={workout} />

 {/* Scroll hint for workout section below */}
 <div style={{
 textAlign:'center', padding:'16px 0 8px', display:'flex',
 alignItems:'center', gap:'10px', justifyContent:'center',
 }}>
 <div style={{ height:'1px', flex:1, background:T.border }} />
 <span style={{ fontSize:'11px', color:T.text3, fontWeight:600, textTransform:'uppercase',
 letterSpacing:'1px', display:'flex', alignItems:'center', gap:'4px' }}>
 <Dumbbell size={12} /> Today's Workout
 </span>
 <div style={{ height:'1px', flex:1, background:T.border }} />
 </div>

 <div style={{ textAlign:'center', paddingTop:'24px' }}>
 <div style={{
 width:80, height:80, borderRadius:'24px', background:T.accentSoft,
 display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px',
 }}>
 <Dumbbell size={36} color={T.accent} />
 </div>
 <h2 style={{ fontSize:'22px', fontWeight:700, marginBottom:'8px' }}>Ready to train?</h2>
 <p style={{ color:T.text2, fontSize:'14px', marginBottom:'24px', lineHeight:1.5 }}>
 Choose your split and day, or let the app decide.
 </p>

 {/* Split Type Selector */}
 <div style={{ marginBottom:'16px' }}>
 <div style={{ fontSize:'11px', color:T.text3, fontWeight:600, textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>
 Split Type
 </div>
 <div style={{ display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap' }}>
 {splitOptions.map(([key, tmpl]) => {
 const isActive = activeSplit === key;
 const isAuto = !selectedSplit && key === autoSplit;
 return (
 <button key={key} onClick={() => { setSelectedSplit(key); setSelectedDayIdx(0); }}
 style={{
 padding:'10px 16px', borderRadius:'12px', border:`1px solid ${isActive ? T.accent : T.border}`,
 background: isActive ? T.accentSoft : T.bgCard, color: isActive ? T.accent : T.text2,
 fontSize:'13px', fontWeight: isActive ? 700 : 500, cursor:'pointer',
 transition:'all 0.2s', position:'relative',
 }}>
 {tmpl.name}
 {isAuto && !selectedSplit && (
 <span style={{ position:'absolute', top:'-6px', right:'-4px', fontSize:'8px', background:T.teal,
 color:'#000', padding:'1px 5px', borderRadius:'6px', fontWeight:700 }}>AUTO</span>
 )}
 </button>
 );
 })}
 </div>
 </div>

 {/* Day Selector (only show if split has multiple days) */}
 {activeTemplate && activeTemplate.days.length > 1 && (
 <div style={{ marginBottom:'24px' }}>
 <div style={{ fontSize:'11px', color:T.text3, fontWeight:600, textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>
 Today's Focus
 </div>
 <div style={{ display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap' }}>
 {activeTemplate.days.map((day, idx) => {
 const isActive = selectedDayIdx === idx;
 return (
 <button key={idx} onClick={() => setSelectedDayIdx(idx)}
 style={{
 padding:'10px 20px', borderRadius:'12px', border:`1px solid ${isActive ? T.teal : T.border}`,
 background: isActive ? T.tealGlow : T.bgCard, color: isActive ? T.teal : T.text2,
 fontSize:'13px', fontWeight: isActive ? 700 : 500, cursor:'pointer', transition:'all 0.2s',
 }}>
 {day.name}
 <div style={{ fontSize:'10px', color: isActive ? 'rgba(78,205,196,0.7)' : T.text3, marginTop:'2px' }}>
 {day.slots.slice(0, 4).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
 {day.slots.length > 4 ? ` +${day.slots.length - 4}` : ''}
 </div>
 </button>
 );
 })}
 </div>
 </div>
 )}

 <button
 disabled={isGeneratingWorkout}
 onClick={() => !isGeneratingWorkout && onGenerateWorkout({ forceSplit: activeSplit, forceDayIndex: selectedDayIdx })} style={{
 padding:'16px 40px', background: isGeneratingWorkout ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${T.accent}, #FF8C42)`,
 border:'none', borderRadius:'16px', color:'white', fontWeight:700, fontSize:'16px',
 cursor: isGeneratingWorkout ? 'default' : 'pointer', boxShadow: isGeneratingWorkout ? 'none' : `0 8px 32px ${T.accentGlow}`,
 transition:'transform 0.15s', letterSpacing:'-0.01em',
 opacity: isGeneratingWorkout ? 0.6 : 1,
 }}
 onMouseDown={e => !isGeneratingWorkout && (e.target.style.transform='scale(0.97)')}
 onMouseUp={e => e.target.style.transform='scale(1)'}
 onMouseLeave={e => e.target.style.transform='scale(1)'}
 >
 {isGeneratingWorkout ? 'Generating...' : `Generate ${activeTemplate?.days[selectedDayIdx]?.name || 'Full Body'} Workout`}
 </button>
 <p style={{ color:T.text3, fontSize:'12px', marginTop:'16px' }}>
 {activeTemplate?.name || 'Full Body'} &middot; ~45 min &middot; {EXERCISES.filter(e => e.phase?.[profile.phase]?.s !== 'avoid' && e.location?.[profile.location]).length} exercises available
 </p>
 </div>
 </div>
 );
 }

 const mandatory = exercises.filter(e => e.mandatory);
 const bonus = exercises.filter(e => !e.mandatory);
 const allMandatoryDone = mandatory.every(e => e.logSets?.every(s => s.done));
 const allDone = exercises.every(e => e.logSets?.every(s => s.done));
 const hasAnyDone = exercises.some(e => e.logSets?.some(s => s.done));

 return (
 <div style={{ animation:'fadeIn 0.3s ease-out' }}>
 <DailyLogCard settings={settings} nutritionConfig={nutritionConfig} calibration={calibration}
 profile={profile} onSave={onSaveBodyLog} onAddXP={onAddXP} />

 {/* Journal Card */}
 <JournalCard workout={workout} />

 {/* Workout Duration Timer */}
 {hasAnyDone && <WorkoutTimerBar startedAt={workout?.startedAt} />}

 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
 <div>
 <h2 style={{ fontSize:'20px', fontWeight:700, letterSpacing:'-0.02em' }}>
 {"Today's Workout"}
 {sessionPRCount > 0 ? (
 <span style={{ marginLeft: '8px', fontSize: '13px', color: '#FFD700', fontWeight: 600, verticalAlign: 'middle' }}>
 {'\uD83C\uDFC6 ' + sessionPRCount + ' PR' + (sessionPRCount !== 1 ? 's' : '')}
 </span>
 ) : null}
 </h2>
 <p style={{ fontSize:'12px', color:T.text3, marginTop:'2px' }}>
 {splitLabel} &middot; {exercises.length} exercises &middot; {mandatory.length} mandatory
 </p>
 </div>
 <button disabled={isGeneratingWorkout} onClick={() => !isGeneratingWorkout && onGenerateWorkout()} style={{
 background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:'10px',
 padding:'8px 12px', color:T.text2, fontSize:'12px', cursor: isGeneratingWorkout ? 'default' : 'pointer',
 display:'flex', alignItems:'center', gap:'4px',
 opacity: isGeneratingWorkout ? 0.5 : 1,
 }}>
 <RotateCcw size={14} /> {isGeneratingWorkout ? '...' : 'New'}
 </button>
 </div>

 {/* Mandatory exercises */}
 {mandatory.map(ex => (
 <ExerciseCard key={ex.id} exercise={ex} onUpdate={onUpdateExercise} onSwapExercise={handleSwapExercise}
 onRemoveExercise={onRemoveExercise} stats={profile}
 weightUnit={settings?.weightUnit} defaultRestTimer={settings?.defaultRestTimer}
 showRPE={settings?.showRPE !== false} goToSettings={goToSettings}
 autoStartTimer={settings?.autoStartTimer !== false}
 timerVibrate={settings?.timerVibrate !== false}
 weightIncrementUpper={settings?.weightIncrementUpper || 5}
 weightIncrementLower={settings?.weightIncrementLower || 10}
 trainingGoal={settings?.trainingGoal || 'hypertrophy'}
 enableProgressiveOverload={settings?.enableProgressiveOverload !== false}
 restEndTime={restTimers[ex.id] || null}
 onRestTimerChange={(endTime) => onRestTimerChange?.(ex.id, endTime)}
 onPRDetected={handlePRDetected} />
 ))}

 {/* Bonus section */}
 {bonus.length > 0 && (
 <>
 <div style={{ display:'flex', alignItems:'center', gap:'8px', margin:'20px 0 12px' }}>
 <div style={{ height:'1px', flex:1, background:T.border }} />
 <span style={{ fontSize:'11px', color:T.text3, fontWeight:600, textTransform:'uppercase', letterSpacing:'1px' }}>
 Bonus
 </span>
 <div style={{ height:'1px', flex:1, background:T.border }} />
 </div>
 {bonus.map(ex => (
 <ExerciseCard key={ex.id} exercise={ex} onUpdate={onUpdateExercise} onSwapExercise={handleSwapExercise}
 onRemoveExercise={onRemoveExercise} stats={profile}
 weightUnit={settings?.weightUnit} defaultRestTimer={settings?.defaultRestTimer}
 showRPE={settings?.showRPE !== false} goToSettings={goToSettings}
 autoStartTimer={settings?.autoStartTimer !== false}
 timerVibrate={settings?.timerVibrate !== false}
 weightIncrementUpper={settings?.weightIncrementUpper || 5}
 weightIncrementLower={settings?.weightIncrementLower || 10}
 trainingGoal={settings?.trainingGoal || 'hypertrophy'}
 enableProgressiveOverload={settings?.enableProgressiveOverload !== false}
 restEndTime={restTimers[ex.id] || null}
 onRestTimerChange={(endTime) => onRestTimerChange?.(ex.id, endTime)}
 onPRDetected={handlePRDetected} />
 ))}
 </>
 )}

 {/* Completion banner with session feedback */}
 {allMandatoryDone && (
 <SessionFeedbackCard
 allDone={allDone}
 exercises={exercises}
 workout={workout}
 weightUnit={settings?.weightUnit || 'lbs'}
 sessionRPE={workout?.sessionRPE}
 durationMinutes={workout?.durationMinutes}
 onSessionMeta={onSessionMeta}
 sessionPRCount={sessionPRCount}
 />
 )}

 {/* Finish Workout button — shows after at least one set is done */}
 {hasAnyDone && (
 <button onClick={() => setShowSummary(true)} style={{
 width:'100%', padding:'14px', borderRadius:'14px', border:'none', marginTop:'12px',
 background: allDone
 ? `linear-gradient(135deg, ${T.success}, #00C853)`
 : `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))`,
 color: allDone ? '#07070E' : T.text2, fontSize:'14px', fontWeight:700, cursor:'pointer',
 display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
 boxShadow: allDone ? '0 8px 24px rgba(0,230,118,0.2)' : 'none',
 transition:'all 0.3s',
 }}>
 <Trophy size={16} />
 {allDone ? 'View Workout Summary' : 'Finish Workout Early'}
 </button>
 )}

 {/* Workout Summary Modal */}
 {showSummary && (
 <WorkoutSummaryModal
 exercises={exercises}
 workout={workout}
 weightUnit={settings?.weightUnit || 'lbs'}
 sessionPRCount={sessionPRCount}
 onClose={() => setShowSummary(false)}
 onSaveNotes={handleSaveSessionNotes}
 />
 )}
 </div>
 );
}

export default TodayTab;

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
 Dumbbell, Heart, Activity, TrendingUp, MessageCircle,
 ChevronDown, ChevronRight, Check, Clock, Play, Pause,
 RotateCcw, Flame, Zap, Star, AlertTriangle, X, Send,
 Settings, Moon, Sun, Trophy, Target, Plus, Minus, Info,
 Download, Upload, Trash2, ChevronUp, Database, FileText,
 Calendar, Loader, Scale, Utensils, Ruler, Lock, Eye, EyeOff,
 Shuffle, BookOpen, ArrowRight, SkipForward, Replace, XCircle, ChevronLeft
} from 'lucide-react';
import { T, css } from '@/design/tokens';
import { LEVELS, XP_REWARDS, BODY_XP } from '@/data/levels';
import { DEFAULT_SETTINGS, DEFAULT_NUTRITION_CONFIG, DEFAULT_CALIBRATION, DEFAULT_BODY_LOG, DEFAULT_STREAKS } from '@/data/defaults';
import { DAILY_REHAB } from '@/data/dailyRehab';
import { CARDIO_OPTIONS } from '@/data/cardioOptions';
import { UPPER_CATEGORIES, VOLUME_LANDMARKS, getAdjustedLandmarks } from '@/data/volumeLandmarks';
import { SPLIT_TEMPLATES, selectSplit, getSplitDay } from '@/data/splitTemplates';
import { today, dayKey, subtractDays } from '@/lib/dateUtils';
import { LS } from '@/lib/storage';
import { loadBodyLogs, loadAllBodyLogs, smoothEWMA, smoothBidirectional, smoothTimeAdaptive, interpolateMissing, getSmoothedWeights } from '@/lib/weightSmoothing';
import { recalcCalibration, getCalibratedBodyFat } from '@/lib/bodyFatCalibration';
import { linearRegressionSlope, updateExpenditure, computeCalorieTarget } from '@/lib/tdee';
import { updateStreaks, checkCombinedStreak } from '@/lib/streaks';
import { EXERCISES, EXERCISE_MAP } from '@/data/exercises';
import { VIDEO_URLS, SEARCH_FALLBACKS, getVideoUrl } from '@/data/videoUrls';
import { normalizeWorkout, getWorkoutExercises } from '@/lib/workoutNormalize';
import { estimate1RM, isWorkingVolume, getExerciseHistory, prescribeNextSession, detectStall } from '@/lib/progressiveOverload';
import { getPRData, savePRData, detectPRs } from '@/lib/prDetection';
import { computeWeightedMuscleVolume, MUSCLE_PAIRS, analyzeMuscleBalance } from '@/lib/muscleBalance';
import { generateWorkout } from '@/lib/workoutGenerator';



// ============================================================
// COMPONENTS
// ============================================================

function GlassCard({ children, style, onClick, animate = true, className = '' }) {
 return (
 <div onClick={onClick} className={className} style={{
 background: T.bgCard,
 backdropFilter: 'blur(20px)',
 WebkitBackdropFilter: 'blur(20px)',
 border: `1px solid ${T.border}`,
 borderRadius: T.radius,
 padding: '16px',
 animation: animate ? 'fadeUp 0.4s ease-out both' : 'none',
 transition: 'background 0.2s, transform 0.15s',
 cursor: onClick ? 'pointer' : 'default',
.style
 }}>
 {children}
 </div>
 );
}

function CircularTimer({ duration, timeLeft, size = 56, strokeWidth = 3 }) {
 const radius = (size - strokeWidth) / 2;
 const circumference = 2 * Math.PI * radius;
 const progress = duration > 0 ? (timeLeft / duration) : 0;
 const dashoffset = circumference * (1 - progress);

 return (
 <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
 <circle cx={size/2} cy={size/2} r={radius} stroke={T.border} strokeWidth={strokeWidth} fill="none" />
 <circle cx={size/2} cy={size/2} r={radius} stroke={timeLeft > 10 ? T.teal : T.accent}
 strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={dashoffset}
 strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
 </svg>
 );
}

function WorkoutTimerBar({ startedAt }) {
 const [elapsed, setElapsed] = useState(0);
 useEffect( => {
 if (!startedAt) return;
 setElapsed(Math.floor((Date.now - startedAt) / 1000));
 const iv = setInterval( => setElapsed(Math.floor((Date.now - startedAt) / 1000)), 1000);
 return => clearInterval(iv);
 }, [startedAt]);
 if (!startedAt) return null;
 const mins = Math.floor(elapsed / 60);
 const secs = elapsed % 60;
 const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
 return (
 <div style={{
 height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
 background: 'rgba(78,205,196,0.08)', borderBottom: `1px solid ${T.border}`,
 position: 'sticky', top: 0, zIndex: 25, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
 }}>
 <Clock size={14} style={{ color: T.teal }} />
 <span style={{ fontFamily: T.mono, fontSize: '14px', fontWeight: 600, color: T.teal, letterSpacing: '0.5px' }}>
 {display}
 </span>
 </div>
 );
}

function RestTimer({ endTime, duration, onComplete, onPauseState, vibrate = true }) {
 // Timestamp-based timer: survives unmount/remount because endTime is in parent state
 const [now, setNow] = useState(Date.now);
 const [paused, setPaused] = useState(false);
 const [pausedRemaining, setPausedRemaining] = useState(null); // ms remaining when paused
 const [finished, setFinished] = useState(false);
 const completedRef = useRef(false);

 useEffect( => {
 if (paused || finished) return;
 const tick = setInterval( => setNow(Date.now), 250); // 250ms for smoother visual
 return => clearInterval(tick);
 }, [paused, finished]);

 const timeLeftMs = paused ? (pausedRemaining || 0) : Math.max(0, endTime - now);
 const timeLeft = Math.ceil(timeLeftMs / 1000);

 useEffect( => {
 if (timeLeft <= 0 && !finished && !paused && !completedRef.current) {
 completedRef.current = true;
 setFinished(true);
 if (vibrate && navigator.vibrate) {
 try { navigator.vibrate([150, 80, 150]); } catch(e) {}
 }
 setTimeout( => { onComplete?.; }, 3000);
 }
 }, [timeLeft, finished, paused, onComplete, vibrate]);

 const handlePause = => {
 if (paused) {
 // Resume: tell parent to set a new endTime
 const newEndTime = Date.now + (pausedRemaining || 0);
 setPaused(false);
 setPausedRemaining(null);
 onPauseState?.(newEndTime); // parent updates endTime
 } else {
 // Pause: capture remaining time
 const remaining = Math.max(0, endTime - Date.now);
 setPaused(true);
 setPausedRemaining(remaining);
 }
 };

 const handleReset = => {
 const newEndTime = Date.now + duration * 1000;
 setPaused(false);
 setPausedRemaining(null);
 setFinished(false);
 completedRef.current = false;
 onPauseState?.(newEndTime);
 };

 const min = Math.floor(timeLeft / 60);
 const sec = timeLeft % 60;

 return (
 <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px',
 background: finished ? 'rgba(0,230,118,0.08)' : T.bgCard,
 borderRadius: T.radiusSm, border:`1px solid ${finished ? 'rgba(0,230,118,0.25)' : T.border}`,
 transition:'all 0.4s ease', animation: finished ? 'timerPulse 1.5s ease-in-out 2' : 'none',
 }} role="timer" aria-live="polite" aria-label={finished ? 'Rest complete' : `Rest timer: ${min}:${sec.toString.padStart(2,'0')} remaining`}>
 <div style={{ position:'relative', width:48, height:48, display:'flex', alignItems:'center', justifyContent:'center' }}>
 <CircularTimer duration={duration} timeLeft={timeLeft} size={48} />
 <span style={{ position:'absolute', fontSize:'11px', fontFamily:T.mono,
 color: finished ? T.success : timeLeft > 10 ? T.teal : T.accent,
 fontWeight: finished ? 700 : 400 }}>
 {finished ? '✓' : `${min}:${sec.toString.padStart(2,'0')}`}
 </span>
 </div>
 <span style={{ fontSize:'13px', color: finished ? T.success : T.text2, flex:1, fontWeight: finished ? 600 : 400 }}>
 {finished ? 'Rest complete' : paused ? 'Paused' : 'Rest'}
 </span>
 {!finished && (
 <>
 <button onClick={handlePause} aria-label={paused ? 'Resume timer' : 'Pause timer'} style={{ background:'none', border:'none', color:T.teal, cursor:'pointer', padding:'8px' }}>
 {paused ? <Play size={18} /> : <Pause size={18} />}
 </button>
 <button onClick={handleReset} aria-label="Reset timer"
 style={{ background:'none', border:'none', color:T.text3, cursor:'pointer', padding:'8px' }}>
 <RotateCcw size={16} />
 </button>
 </>
 )}
 {finished && (
 <button onClick={ => onComplete?.} aria-label="Dismiss rest timer" style={{ background:'none', border:'none', color:T.text3, cursor:'pointer', padding:'8px', fontSize:'12px' }}>
 Dismiss
 </button>
 )}
 </div>
 );
}

function StepperField({ value, onChange, step, min = 0, max = 9999, unit, placeholder, done, color }) {
 const [editing, setEditing] = useState(false);
 const inputRef = useRef(null);
 const numVal = parseFloat(value) || 0;

 useEffect( => {
 if (editing && inputRef.current) {
 inputRef.current.focus;
 inputRef.current.select;
 }
 }, [editing]);

 const increment = => onChange(String(Math.min(max, +(numVal + step).toFixed(1))));
 const decrement = => onChange(String(Math.max(min, +(numVal - step).toFixed(1))));

 // Clamp value to min/max on blur
 const handleBlur = => {
 const num = parseFloat(value);
 if (!isNaN(num)) {
 const clamped = Math.max(min, Math.min(max, num));
 if (clamped !== num) onChange(String(+(clamped).toFixed(1)));
 }
 setEditing(false);
 };

 const btnStyle = (side) => ({
 width: 44, height: 44, minWidth: 44,
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 background: done ? 'rgba(0,230,118,0.08)' : 'rgba(255,255,255,0.04)',
 border: `1px solid ${done ? 'rgba(0,230,118,0.15)' : T.border}`,
 borderRadius: side === 'left' ? '12px 0 0 12px' : '0 12px 12px 0',
 cursor: 'pointer', color: done ? T.success : T.text2,
 transition: 'all 0.15s', flexShrink: 0,
 WebkitTapHighlightColor: 'transparent',
 });

 const fieldLabel = unit || placeholder || 'value';

 if (editing) {
 return (
 <input ref={inputRef} type="number" inputMode="decimal" value={value}
 aria-label={`Edit ${fieldLabel}`}
 onChange={e => onChange(e.target.value)}
 onBlur={handleBlur}
 onKeyDown={e => { if (e.key === 'Enter') handleBlur; }}
 style={{
 width: '100%', height: 44, background: 'rgba(255,255,255,0.06)',
 border: `2px solid ${T.accent}`, borderRadius: '12px',
 padding: '0 8px', textAlign: 'center', color: T.text,
 fontSize: '16px', fontWeight: 700, fontFamily: T.mono, outline: 'none',
 }}
 />
 );
 }

 return (
 <div style={{ display: 'flex', alignItems: 'center', width: '100%' }} role="group" aria-label={`${fieldLabel} stepper`}>
 <button onClick={decrement} aria-label={`Decrease ${fieldLabel}`} style={btnStyle('left')}>
 <Minus size={16} strokeWidth={2.5} />
 </button>
 <button onClick={ => setEditing(true)} aria-label={`${value || 'empty'} ${fieldLabel}, tap to edit`} style={{
 flex: 1, height: 44, minWidth: 56,
 display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
 background: done ? 'rgba(0,230,118,0.06)' : 'rgba(255,255,255,0.02)',
 borderTop: `1px solid ${done ? 'rgba(0,230,118,0.15)' : T.border}`,
 borderBottom: `1px solid ${done ? 'rgba(0,230,118,0.15)' : T.border}`,
 cursor: 'pointer', padding: 0,
 WebkitTapHighlightColor: 'transparent',
 }}>
 <span style={{
 fontSize: '16px', fontWeight: 700, fontFamily: T.mono,
 color: value ? (done ? T.success : (color || T.text)) : T.text3,
 lineHeight: 1,
 }}>
 {value || placeholder || '—'}
 </span>
 {unit && <span style={{ fontSize: '10px', color: T.text3, marginTop: '1px', lineHeight: 1 }}>{unit}</span>}
 </button>
 <button onClick={increment} aria-label={`Increase ${fieldLabel}`} style={btnStyle('right')}>
 <Plus size={16} strokeWidth={2.5} />
 </button>
 </div>
 );
}

function SetRow({ index, set, reps, onUpdate, onToggle, onSetType, weightUnit = 'lbs', showRPE = true, weightIncrement = 5, category = '', prescription = null }) {
 const prescWeight = prescription?.prescribedWeight;
 const prescReps = prescription?.prescribedReps;
 const showTarget = prescription && !set.done && index === 0;

 const SET_TYPES = ['working', 'warmup', 'drop', 'failure', 'amrap'];
 const SET_TYPE_META = {
 working: { label: null, color: null },
 warmup: { label: 'W', color: T.text3, bg: 'rgba(255,255,255,0.08)' },
 drop: { label: 'D', color: T.accent, bg: T.accentSoft },
 failure: { label: 'F', color: T.danger, bg: 'rgba(255,82,82,0.12)' },
 amrap: { label: 'A', color: T.teal, bg: T.tealGlow },
 };
 const currentType = set.setType || 'working';
 const typeMeta = SET_TYPE_META[currentType];

 const cycleType = => {
 const idx = SET_TYPES.indexOf(currentType);
 const next = SET_TYPES[(idx + 1) % SET_TYPES.length];
 onSetType?.(index, next);
 };

 return (
 <div style={{
 display: 'flex', flexDirection: 'column', gap: '8px',
 padding: '12px', marginBottom: '8px',
 background: set.done ? 'rgba(0,230,118,0.04)' : currentType === 'warmup' ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.015)',
 borderRadius: '12px', border: `1px solid ${set.done ? 'rgba(0,230,118,0.1)' : 'rgba(255,255,255,0.03)'}`,
 animation: `fadeUp 0.3s ease-out ${index * 0.05}s both`,
 transition: 'all 0.2s',
 }}>
 {/* Row label + check button */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
 <span style={{
 fontSize: '11px', fontWeight: 700, color: set.done ? T.success : T.text3,
 textTransform: 'uppercase', letterSpacing: '0.5px',
 display: 'flex', alignItems: 'center', gap: '6px',
 }}>
 {/* Set type badge — tap to cycle */}
 {typeMeta.label ? (
 <button onClick={(e) => { e.stopPropagation; cycleType; }}
 title={`Set type: ${currentType}. Tap to change.`}
 aria-label={`Set type: ${currentType}. Tap to cycle through types.`}
 style={{
 width: 28, height: 28, minWidth: 28, borderRadius: '7px', border: 'none',
 background: typeMeta.bg, color: typeMeta.color, fontSize: '11px', fontWeight: 800,
 cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontFamily: T.mono, padding: '8px', lineHeight: 1, boxSizing: 'content-box',
 }}>
 {typeMeta.label}
 </button>
 ) : (
 <button onClick={(e) => { e.stopPropagation; cycleType; }}
 title="Working set. Tap to change type."
 aria-label="Working set. Tap to cycle through set types."
 style={{
 width: 28, height: 28, minWidth: 28, borderRadius: '7px',
 border: `1px dashed rgba(255,255,255,0.1)`, background: 'transparent',
 color: T.text3, fontSize: '11px', fontWeight: 600, cursor: 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontFamily: T.mono, padding: '8px', opacity: 0.4, boxSizing: 'content-box',
 }}>
 {index + 1}
 </button>
 )}
 Set {index + 1}
 {set.done && <Check size={11} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
 {/* Show delta after completing */}
 {set.done && prescWeight > 0 && parseFloat(set.weight) > 0 && (
 <span style={{ marginLeft: 6, fontSize: '10px', fontWeight: 500,
 color: parseFloat(set.weight) > prescWeight ? T.success : parseFloat(set.weight) < prescWeight ? T.warn : T.text3
 }}>
 {parseFloat(set.weight) > prescWeight ? `↑${(parseFloat(set.weight) - prescWeight)} ${weightUnit}` :
 parseFloat(set.weight) < prescWeight ? `↓${(prescWeight - parseFloat(set.weight))} ${weightUnit}` : '→ on target'}
 </span>
 )}
 </span>
 <button onClick={ => onToggle(index)}
 aria-label={set.done ? `Unmark set ${index + 1} as done` : `Mark set ${index + 1} as done${!set.weight && !set.reps ? ' (enter weight or reps first)' : ''}`}
 style={{
 width: 48, height: 48, minWidth: 48, borderRadius: '14px',
 border: set.done ? 'none' : `2px solid ${set.weight || set.reps ? T.accent : T.text3}`,
 background: set.done
 ? T.success
 : (set.weight || set.reps)
 ? `linear-gradient(135deg, ${T.accent}, #FF8C42)`
 : 'rgba(255,255,255,0.03)',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 cursor: 'pointer', transition: 'all 0.2s',
 boxShadow: set.done ? `0 4px 16px rgba(0,230,118,0.25)` : (set.weight || set.reps) ? `0 4px 16px ${T.accentGlow}` : 'none',
 }}>
 <Check size={22} color={set.done ? '#07070E' : (set.weight || set.reps ? '#fff' : T.text3)} strokeWidth={3} />
 </button>
 </div>

 {/* Stepper fields row */}
 <div style={{ display: 'grid', gridTemplateColumns: showRPE ? '1fr 1fr 0.8fr' : '1fr 1fr', gap: '8px' }}>
 <div>
 <div style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.3px',
 marginBottom: '4px', textAlign: 'center', fontWeight: 600 }}>Weight</div>
 <StepperField
 value={set.weight} onChange={v => onUpdate(index, 'weight', v)}
 step={weightIncrement} min={0} max={999}
 unit={weightUnit} placeholder="0" done={set.done}
 />
 </div>
 <div>
 <div style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.3px',
 marginBottom: '4px', textAlign: 'center', fontWeight: 600 }}>Reps</div>
 <StepperField
 value={set.reps} onChange={v => onUpdate(index, 'reps', v)}
 step={1} min={0} max={100}
 placeholder={reps || '—'} done={set.done} color={T.teal}
 />
 </div>
 {showRPE && (
 <div>
 <div style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.3px',
 marginBottom: '4px', textAlign: 'center', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
 RPE
 <span title="Rate of Perceived Exertion (1-10).&#10;6 = Could do 4+ more reps&#10;7 = Could do 3 more&#10;8 = Could do 2 more&#10;9 = Could do 1 more&#10;10 = Max effort (avoid)"
 style={{ cursor: 'help', opacity: 0.7, display: 'inline-flex' }}>
 <Info size={10} />
 </span>
 </div>
 <StepperField
 value={set.rpe} onChange={v => onUpdate(index, 'rpe', v)}
 step={0.5} min={1} max={10}
 placeholder="—" done={set.done} color={T.warn}
 />
 </div>
 )}
 </div>
 </div>
 );
}

function ExerciseCard({ exercise, onUpdate, onSwapExercise, onRemoveExercise, stats, weightUnit = 'lbs', defaultRestTimer = 90, showRPE = true, goToSettings, autoStartTimer = true, timerVibrate = true, weightIncrementUpper = 5, weightIncrementLower = 10, trainingGoal = 'hypertrophy', enableProgressiveOverload = true, restEndTime = null, onRestTimerChange, onPRDetected }) {
 const [expanded, setExpanded] = useState(false);
 const [showCues, setShowCues] = useState(false);
 const [showSwapPanel, setShowSwapPanel] = useState(false);
 const [sessionPRs, setSessionPRs] = useState([]);
 
 const completedSets = exercise.logSets?.filter(s => s.done).length || 0;
 const totalSets = exercise.logSets?.length || 0;
 const allDone = completedSets === totalSets && totalSets > 0;
 const phaseData = exercise.phase?.[stats?.phase || 'acute'] || {};

 const isUpper = UPPER_CATEGORIES.has(exercise.category);
 const weightIncrement = isUpper ? weightIncrementUpper : weightIncrementLower;

 // Progressive overload data
 const prescription = exercise.prescription || null;
 const stall = enableProgressiveOverload ? detectStall(exercise.id) : { stalled: false, fatigued: false };
 const e1RM = prescription?.estimated1RM || 0;

 const updateSet = (idx, field, value) => {
 // Sanitize numeric fields: reject negative values
 let sanitized = value;
 if ((field === 'weight' || field === 'reps') && value !== '') {
 const num = parseFloat(value);
 if (!isNaN(num) && num < 0) sanitized = '0';
 }
 if (field === 'rpe' && value !== '') {
 const num = parseFloat(value);
 if (!isNaN(num)) sanitized = String(Math.max(1, Math.min(10, num)));
 }
 const newSets = [.exercise.logSets];
 newSets[idx] = {.newSets[idx], [field]: sanitized };
 onUpdate({.exercise, logSets: newSets });
 };

 const updateSetType = (idx, type) => {
 const newSets = [.exercise.logSets];
 newSets[idx] = {.newSets[idx], setType: type };
 onUpdate({.exercise, logSets: newSets });
 };

 const toggleSet = (idx) => {
 const newSets = [.exercise.logSets];
 const wasDone = newSets[idx].done;
 // Prevent marking done if both weight and reps are empty (avoids zero-volume logs)
 if (!wasDone && !newSets[idx].weight && !newSets[idx].reps) {
 return; // Don't toggle — require at least reps to be entered
 }
 newSets[idx] = {.newSets[idx], done: !wasDone };
 onUpdate({.exercise, logSets: newSets });
 // Auto-start rest timer when marking a set as done (not when un-marking)
 if (!wasDone && autoStartTimer) {
 const restDuration = exercise.rest || defaultRestTimer || 90;
 onRestTimerChange?.(Date.now + restDuration * 1000);
 }
 // PR detection on set completion
 if (!wasDone) {
 try {
 const prs = detectPRs(exercise.id, newSets);
 if (prs.length > 0) {
 setSessionPRs(prs);
 onPRDetected?.(exercise.id, prs);
 }
 } catch(e) { /* silent */ }
 }
 };

 return (
 <div style={{
 background: allDone ? T.successSoft : T.bgCard,
 backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
 border: `1px solid ${allDone ? 'rgba(0,230,118,0.15)' : T.border}`,
 borderRadius: T.radius, marginBottom: '12px', overflow: 'hidden',
 transition: 'all 0.3s',
 }}>
 {/* Header */}
 <div onClick={ => setExpanded(!expanded)}
 role="button" tabIndex={0} aria-expanded={expanded}
 aria-label={`${exercise.name}, ${completedSets} of ${totalSets} sets completed${allDone ? ', exercise complete' : ''}. ${expanded ? 'Collapse' : 'Expand'} details.`}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault; setExpanded(!expanded); } }}
 style={{
 padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
 }}>
 <div style={{
 width: 40, height: 40, borderRadius: '12px',
 background: allDone ? T.successSoft : T.accentSoft,
 display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
 }}>
 {allDone ? <Check size={20} color={T.success} /> : <Dumbbell size={18} color={T.accent} />}
 </div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.3 }}>{exercise.name}</div>
 <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap' }}>
 <span style={{ fontSize: '12px', color: T.text3 }}>{exercise.sets}×{exercise.reps}</span>
 {e1RM > 0 && (
 <span style={{ fontSize: '10px', color: T.teal, background: T.tealGlow, padding: '1px 6px', borderRadius: '4px' }}>
 e1RM: {e1RM} {weightUnit}
 </span>
 )}
 {prescription?.action === 'increase_weight' && (
 <span style={{ fontSize: '10px', color: T.success, background: T.successSoft, padding: '1px 6px', borderRadius: '4px' }}>
 ↑ Progress
 </span>
 )}
 {prescription?.action === 'decrease_weight' && (
 <span style={{ fontSize: '10px', color: T.warn, background: T.warnSoft, padding: '1px 6px', borderRadius: '4px' }}>
 ↓ Deload
 </span>
 )}
 {prescription?.action === 'progress_exercise' && (
 <span style={{ fontSize: '10px', color: T.success, background: T.successSoft, padding: '1px 6px', borderRadius: '4px' }}>
 🚀 Ready to advance
 </span>
 )}
 {prescription?.action === 'regress_exercise' && (
 <span style={{ fontSize: '10px', color: T.warn, background: T.warnSoft, padding: '1px 6px', borderRadius: '4px' }}
 title={`Stalled — consider switching to ${prescription.regressionExercise || 'easier variant'}`}>
 ↓ Try easier variant
 </span>
 )}
 {stall.stalled && (
 <span style={{ fontSize: '10px', color: T.danger, background: 'rgba(255,82,82,0.1)', padding: '1px 6px', borderRadius: '4px' }}
 title="Weight and reps unchanged for 3+ sessions">
 ⚠ Stalled
 </span>
 )}
 {stall.fatigued && !stall.stalled && (
 <span style={{ fontSize: '10px', color: T.warn, background: T.warnSoft, padding: '1px 6px', borderRadius: '4px' }}
 title="RPE trending upward at same load">
 ⚡ Fatigue
 </span>
 )}
 {phaseData.s === 'caution' && (
 <span style={{ fontSize: '10px', color: T.warn, background: T.warnSoft, padding: '1px 6px', borderRadius: '4px' }}>
 ⚠ caution
 </span>
 )}
 {!exercise.mandatory && (
 <span style={{ fontSize: '10px', color: T.teal, background: T.tealGlow, padding: '1px 6px', borderRadius: '4px' }}>
 bonus
 </span>
 )}
 </div>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <div
 onClick={(e) => { e.stopPropagation; window.open(getVideoUrl(exercise.id, exercise.name), '_blank'); }}
 role="button" tabIndex={0} aria-label="Watch form tutorial video"
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault; e.stopPropagation; window.open(getVideoUrl(exercise.id, exercise.name), '_blank'); } }}
 style={{
 width: 32, height: 32, borderRadius: '8px',
 background: 'rgba(255,0,0,0.12)',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 flexShrink: 0, cursor: 'pointer', transition: 'background 0.2s',
 padding: '6px',
 }}
 onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,0,0,0.25)'}
 onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,0,0,0.12)'}
 title="Watch form tutorial"
 >
 <Play size={14} color="#FF4444" fill="#FF4444" />
 </div>
 <span aria-label={`${completedSets} of ${totalSets} sets completed`} style={{ fontSize: '13px', fontFamily: T.mono, color: allDone ? T.success : T.text2 }}>
 {completedSets}/{totalSets}
 </span>
 <ChevronDown size={18} color={T.text3} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} aria-hidden="true" />
 </div>
 </div>

 {/* Progress bar */}
 <div role="progressbar" aria-valuenow={completedSets} aria-valuemin={0} aria-valuemax={totalSets}
 aria-label={`${exercise.name} progress`}
 style={{ height: '2px', background: 'rgba(255,255,255,0.04)' }}>
 <div style={{ height: '100%', width: `${(completedSets/totalSets)*100}%`, 
 background: allDone ? T.success : `linear-gradient(90deg, ${T.accent}, ${T.teal})`,
 transition: 'width 0.4s ease-out', borderRadius: '2px' }} />
 </div>

 {/* Expanded content */}
 {expanded && (
 <div style={{ padding: '0 16px 16px', animation: 'fadeUp 0.2s ease-out' }}>
 {/* Phase note */}
 {phaseData.n && (
 <div style={{ fontSize: '12px', color: T.text2, padding: '10px 12px', margin: '12px 0 8px',
 background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `3px solid ${T.accent}` }}>
 {phaseData.n}
 </div>
 )}

 {/* Prescription target */}
 {enableProgressiveOverload && prescription && (
 <div style={{
 padding: '10px 12px', margin: '8px 0', borderRadius: '8px',
 background: prescription.action === 'increase_weight' ? 'rgba(0,230,118,0.05)'
 : prescription.action === 'decrease_weight' ? 'rgba(255,183,77,0.05)'
 : 'rgba(78,205,196,0.05)',
 border: `1px solid ${prescription.action === 'increase_weight' ? 'rgba(0,230,118,0.1)'
 : prescription.action === 'decrease_weight' ? 'rgba(255,183,77,0.1)'
 : 'rgba(78,205,196,0.08)'}`,
 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div>
 <div style={{ fontSize: '11px', fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '2px' }}>Target</div>
 <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: T.mono, color: T.text }}>
 {prescription.prescribedWeight > 0 ? `${prescription.prescribedWeight} ${weightUnit} × ${prescription.prescribedReps}` : `${prescription.prescribedReps} reps`}
 </div>
 </div>
 <div style={{ textAlign: 'right' }}>
 {prescription.lastWeight > 0 && (
 <div style={{ fontSize: '11px', color: T.text3 }}>
 Last: {prescription.lastWeight} × {prescription.lastAvgReps}
 </div>
 )}
 <div style={{ fontSize: '11px', color:
 prescription.action === 'increase_weight' ? T.success
 : prescription.action === 'decrease_weight' ? T.warn
 : T.teal,
 fontWeight: 600
 }}>
 {prescription.action === 'increase_weight' && `↑ +${(prescription.prescribedWeight - prescription.lastWeight)} ${weightUnit}`}
 {prescription.action === 'decrease_weight' && `↓ Deload -${(prescription.lastWeight - prescription.prescribedWeight)} ${weightUnit}`}
 {prescription.action === 'add_rep' && '→ Add rep'}
 {prescription.action === 'maintain' && '→ Maintain'}
 {prescription.action === 'progress_exercise' && `🚀 → ${prescription.progressionExercise}`}
 </div>
 </div>
 </div>
 {prescription.action === 'progress_exercise' && prescription.progressionExercise && onSwapExercise && (
 <button
 onClick={(e) => { e.stopPropagation; onSwapExercise(exercise.id, prescription.progressionIds?.[0] || null); }}
 style={{
 marginTop: '8px', width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid rgba(0,230,118,0.2)`,
 background: 'rgba(0,230,118,0.08)', color: T.success, fontSize: '12px', fontWeight: 600,
 cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
 }}
 >
 🚀 Swap to {prescription.progressionExercise}
 </button>
 )}
 </div>
 )}

 {/* Per-set last session display */}
 {exercise.lastSessionSets && exercise.lastSessionSets.length > 0 && ( => {
 const setsText = exercise.lastSessionSets.map((s, i) => {
 const lbl = s.weight > 0 ? (s.weight + '\u00D7' + s.reps) : (s.reps + ' reps');
 const isLast = i === exercise.lastSessionSets.length - 1;
 return isLast ? lbl : lbl + ', ';
 }).join('');
 return (
 <div style={{ fontSize: '11px', color: T.text3, fontFamily: T.mono, padding: '6px 0 2px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
 <RotateCcw size={10} style={{ opacity: 0.5, flexShrink: 0 }} />
 <span style={{ opacity: 0.6 }}>{'Last: '}</span>
 <span>{setsText}</span>
 </div>
 );
 })}
 {!exercise.lastSessionSets && !prescription && (
 <div style={{ fontSize: '11px', color: T.text3, padding: '4px 0 2px', opacity: 0.5, fontStyle: 'italic' }}>
 {'First time \u2014 no previous data'}
 </div>
 )}

 {/* PR badges */}
 {sessionPRs.length > 0 && (
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '6px 0' }}>
 {sessionPRs.map((pr, i) => {
 let label = '';
 if (pr.type === 'weight') label = 'Weight PR! ' + pr.value + ' ' + weightUnit;
 if (pr.type === 'volume') label = 'Volume PR! ' + pr.value.toLocaleString + ' ' + weightUnit;
 if (pr.type === 'e1rm') label = 'e1RM PR! ' + pr.value + ' ' + weightUnit;
 if (pr.type === 'reps') label = 'Rep PR! ' + pr.value + ' reps' + (pr.weightTier > 0 ? (' @ ' + pr.weightTier + weightUnit) : '');
 return (
 <div key={i} style={{
 display: 'inline-flex', alignItems: 'center', gap: '4px',
 background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)',
 borderRadius: '8px', padding: '3px 8px', fontSize: '11px', fontWeight: 600,
 color: '#FFD700', animation: 'fadeUp 0.3s ease-out both',
 }}>
 <Trophy size={11} />
 {label}
 </div>
 );
 })}
 </div>
 )}

 {/* Set header */}
 {exercise.logSets?.length > 0 && (
 <div style={{ fontSize:'11px', color:T.text3, padding:'8px 0 4px', fontWeight:600,
 display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <span>
 {completedSets}/{totalSets} sets · {weightIncrement}{weightUnit}/step
 </span>
 {exercise.logSets.some(s => s.weight || s.reps) && !allDone && (
 <span style={{ fontSize:'10px', color:T.accent, fontWeight:500 }}>
 Pre-filled from last session
 </span>
 )}
 </div>
 )}

 {/* Sets */}
 {exercise.logSets?.map((set, i) => (
 <SetRow key={i} index={i} set={set} reps={exercise.reps} onUpdate={updateSet} onToggle={toggleSet} onSetType={updateSetType}
 weightUnit={weightUnit} showRPE={showRPE} weightIncrement={weightIncrement} category={exercise.category}
 prescription={enableProgressiveOverload ? prescription : null} />
 ))}

 {/* Rest timer */}
 {restEndTime && !allDone && (
 <div style={{ marginTop: '12px', position:'relative' }}>
 <RestTimer endTime={restEndTime} duration={exercise.rest || defaultRestTimer} onComplete={ => onRestTimerChange?.(null)} onPauseState={(newEnd) => onRestTimerChange?.(newEnd)} vibrate={timerVibrate} />
 {goToSettings && (
 <button onClick={(e) => { e.stopPropagation; goToSettings('workout'); }}
 title="Timer settings"
 style={{ position:'absolute', top:'10px', right:'0px', background:'none', border:'none',
 color:T.text3, cursor:'pointer', padding:'10px', opacity:0.4, zIndex:2, minWidth:'44px', minHeight:'44px',
 display:'flex', alignItems:'center', justifyContent:'center' }}>
 <Settings size={14} />
 </button>
 )}
 </div>
 )}

 {/* Skip / Swap Exercise Panel */}
 <div style={{ display:'flex', gap:'8px', marginTop:'12px' }}>
 <button onClick={(e) => { e.stopPropagation; setShowSwapPanel(!showSwapPanel); }}
 style={{ background: showSwapPanel ? 'rgba(255,82,82,0.1)' : 'rgba(255,255,255,0.04)', 
 border:`1px solid ${showSwapPanel ? 'rgba(255,82,82,0.2)' : T.border}`, 
 borderRadius:'8px', color: showSwapPanel ? T.danger : T.text3, fontSize:'12px',
 cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', padding:'10px 14px',
 transition:'all 0.2s', fontWeight:500, minHeight:'44px' }}>
 <Shuffle size={13} /> {showSwapPanel ? 'Cancel' : 'Swap / Skip'}
 </button>
 </div>

 {showSwapPanel && ( => {
 const currentPhase = stats?.phase || 'acute';
 const currentLocation = stats?.location || 'gym';
 // Build alternatives: exercise.subs first, then same-category exercises
 const subsFromDb = (exercise.subs || [])
.map(id => EXERCISES.find(e => e.id === id))
.filter(e => e && e.phase?.[currentPhase]?.s !== 'avoid' && e.location?.[currentLocation]);
 
 const sameCategoryAlts = EXERCISES.filter(e => 
 e.category === exercise.category && 
 e.id !== exercise.id && 
 !subsFromDb.find(s => s.id === e.id) &&
 e.phase?.[currentPhase]?.s !== 'avoid' && 
 e.location?.[currentLocation]
 ).sort((a, b) => (b.phase?.[currentPhase]?.p || 0) - (a.phase?.[currentPhase]?.p || 0))
.slice(0, 5);

 const primarySub = subsFromDb[0] || null;
 const secondaryAlts = [.subsFromDb.slice(1),.sameCategoryAlts].slice(0, 6);

 return (
 <div style={{ marginTop:'8px', padding:'12px', background:'rgba(255,82,82,0.04)', 
 borderRadius:'10px', border:`1px solid rgba(255,82,82,0.1)`, animation:'fadeUp 0.2s ease-out' }}>
 <div style={{ fontSize:'11px', fontWeight:600, color:T.text3, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>
 Replace "{exercise.name}"
 </div>

 {/* Primary suggestion */}
 {primarySub && (
 <button onClick={(e) => { e.stopPropagation; onSwapExercise(exercise.id, primarySub.id); setShowSwapPanel(false); }}
 style={{
 width:'100%', padding:'10px 12px', marginBottom:'8px', borderRadius:'10px',
 background:`linear-gradient(135deg, rgba(0,230,118,0.08), rgba(78,205,196,0.06))`,
 border:`1px solid rgba(0,230,118,0.15)`, cursor:'pointer', textAlign:'left',
 display:'flex', alignItems:'center', gap:'10px', transition:'all 0.2s',
 }}
 onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,230,118,0.12)'}
 onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,230,118,0.08), rgba(78,205,196,0.06))'}
 >
 <div style={{ width:28, height:28, borderRadius:'8px', background:T.successSoft, 
 display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
 <Star size={14} color={T.success} />
 </div>
 <div style={{ flex:1 }}>
 <div style={{ fontSize:'13px', fontWeight:600, color:T.text }}>{primarySub.name}</div>
 <div style={{ fontSize:'11px', color:T.text3 }}>
 Suggested · {primarySub.sets}×{primarySub.reps} · {primarySub.phase?.[currentPhase]?.s || 'suitable'}
 </div>
 </div>
 <ArrowRight size={14} color={T.success} />
 </button>
 )}

 {/* Secondary alternatives */}
 {secondaryAlts.length > 0 && (
 <div style={{ marginBottom:'8px' }}>
 <div style={{ fontSize:'10px', color:T.text3, marginBottom:'4px', paddingLeft:'2px' }}>Other options:</div>
 <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
 {secondaryAlts.map(alt => (
 <button key={alt.id} onClick={(e) => { e.stopPropagation; onSwapExercise(exercise.id, alt.id); setShowSwapPanel(false); }}
 style={{
 padding:'10px 12px', borderRadius:'8px', background:T.bgCard, border:`1px solid ${T.border}`,
 cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:'8px',
 transition:'all 0.15s', color:T.text, fontSize:'12px', minHeight:'44px',
 }}
 onMouseEnter={e => e.currentTarget.style.background = T.bgCardHover}
 onMouseLeave={e => e.currentTarget.style.background = T.bgCard}
 >
 <Dumbbell size={12} color={T.text3} />
 <span style={{ flex:1 }}>{alt.name}</span>
 <span style={{ fontSize:'10px', color:T.text3 }}>{alt.sets}×{alt.reps}</span>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Remove entirely */}
 {onRemoveExercise && (
 <button onClick={(e) => { e.stopPropagation; onRemoveExercise(exercise.id); setShowSwapPanel(false); }}
 style={{
 width:'100%', padding:'12px', borderRadius:'8px',
 background:'rgba(255,82,82,0.06)', border:`1px solid rgba(255,82,82,0.12)`,
 cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', justifyContent:'center',
 color:T.danger, fontSize:'12px', fontWeight:500, transition:'all 0.15s', minHeight:'44px',
 }}
 onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,82,82,0.12)'}
 onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,82,82,0.06)'}
 >
 <XCircle size={13} /> Remove from today's workout
 </button>
 )}
 </div>
 );
 })}

 {/* Cues toggle */}
 <button onClick={(e) => { e.stopPropagation; setShowCues(!showCues); }}
 style={{ marginTop:'12px', background:'none', border:'none', color:T.teal, fontSize:'13px',
 cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', padding:'10px 0', minHeight:'44px' }}>
 <Info size={14} /> {showCues ? 'Hide cues' : 'Show cues & tips'}
 </button>

 {showCues && (
 <div style={{ marginTop:'8px', animation:'fadeUp 0.2s ease-out' }}>
 <div style={{ marginBottom:'8px' }}>
 <div style={{ fontSize:'11px', fontWeight:600, color:T.teal, textTransform:'uppercase',
 letterSpacing:'0.5px', marginBottom:'6px' }}>Cues</div>
 {exercise.cues?.map((c,i) => (
 <div key={i} style={{ fontSize:'12px', color:T.text2, padding:'4px 0', paddingLeft:'12px',
 borderLeft:`2px solid ${T.teal}`, marginBottom:'4px' }}>{c}</div>
 ))}
 </div>
 {exercise.mistakes?.length > 0 && (
 <div>
 <div style={{ fontSize:'11px', fontWeight:600, color:T.warn, textTransform:'uppercase',
 letterSpacing:'0.5px', marginBottom:'6px' }}>Avoid</div>
 {exercise.mistakes.map((m,i) => (
 <div key={i} style={{ fontSize:'12px', color:T.text2, padding:'4px 0', paddingLeft:'12px',
 borderLeft:`2px solid ${T.warn}`, marginBottom:'4px' }}>
 <strong style={{color:T.text}}>{m.m}</strong> — {m.f}
 </div>
 ))}
 </div>
 )}
 {exercise.why && (
 <div style={{ marginTop:'8px', fontSize:'12px', color:T.text3, fontStyle:'italic' }}>
 💡 {exercise.why}
 </div>
 )}
 </div>
 )}
 </div>
 )}
 </div>
 );
}

function Toast({ message, xp }) {
 return (
 <div role="alert" aria-live="assertive" style={{
 position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
 background: 'rgba(255,107,53,0.95)', color: 'white', padding: '10px 20px',
 borderRadius: '24px', fontSize: '14px', fontWeight: 600, zIndex: 1000,
 animation: 'toast 2.5s ease-out forwards', display: 'flex', alignItems: 'center', gap: '8px',
 boxShadow: '0 8px 32px rgba(255,107,53,0.3)',
 }}>
 <Zap size={16} /> {message} {xp && <span style={{opacity:0.8}}>+{xp} XP</span>}
 </div>
 );
}

function MuscleMap({ recentMuscles }) {
 // Simplified front/back body SVG with muscle group regions
 const muscles = {
 chest: { x:45, y:22, w:10, label:'Chest' },
 shoulders: { x:33, y:18, w:8, label:'Shoulders' },
 back: { x:45, y:25, w:10, label:'Back' },
 biceps: { x:30, y:30, w:6, label:'Biceps' },
 triceps: { x:60, y:30, w:6, label:'Triceps' },
 core: { x:45, y:35, w:8, label:'Core' },
 quads: { x:40, y:52, w:8, label:'Quads' },
 hamstrings: { x:50, y:52, w:8, label:'Hamstrings' },
 glutes: { x:45, y:45, w:8, label:'Glutes' },
 calves: { x:45, y:68, w:6, label:'Calves' },
 };

 const getColor = (cat) => {
 // Merge sub-muscle-group hours into display groups
 let hours = recentMuscles?.[cat];
 if (cat === 'shoulders') {
 const variants = ['shoulders', 'side_delts', 'rear_delts', 'front_delts'];
 const found = variants.map(k => recentMuscles?.[k]).filter(v => v !== undefined);
 if (found.length > 0) hours = Math.min(.found);
 }
 if (!hours && hours !== 0) return 'rgba(255,255,255,0.06)';
 if (hours < 48) return T.success;
 if (hours < 96) return T.warn;
 return T.danger;
 };

 return (
 <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'6px' }}>
 {Object.entries(muscles).map(([key, m]) => (
 <div key={key} style={{
 background: getColor(key), borderRadius:'8px', padding:'10px 4px',
 textAlign:'center', fontSize:'10px', color:T.text, fontWeight:500,
 transition:'all 0.3s', border:`1px solid ${T.border}`,
 }}>
 {m.label}
 </div>
 ))}
 </div>
 );
}

function CalendarHeatmap({ history, onDayClick }) {
 const now = new Date;
 const [monthOffset, setMonthOffset] = useState(0);
 const viewDate = new Date(now.getFullYear, now.getMonth + monthOffset, 1);
 const daysInMonth = new Date(viewDate.getFullYear, viewDate.getMonth + 1, 0).getDate;
 const startDay = viewDate.getDay;
 const monthStr = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
 const yymm = `${viewDate.getFullYear}-${String(viewDate.getMonth+1).padStart(2,'0')}`;

 return (
 <GlassCard animate={false} style={{ padding:'16px' }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
 <button onClick={ => setMonthOffset(m => m-1)} aria-label="Previous month" style={{ background:'none', border:'none', color:T.text2, cursor:'pointer', padding:'8px' }}>‹</button>
 <span style={{ fontSize:'14px', fontWeight:600 }}>{monthStr}</span>
 <button onClick={ => setMonthOffset(m => Math.min(m+1, 0))} aria-label="Next month" style={{ background:'none', border:'none', color:T.text2, cursor:'pointer', padding:'8px' }}>›</button>
 </div>
 <div role="grid" aria-label={`Activity calendar for ${monthStr}`} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px', textAlign:'center' }}>
 {['S','M','T','W','T','F','S'].map((d,i) => (
 <div key={i} style={{ fontSize:'10px', color:T.text3, padding:'4px 0', fontWeight:600 }}>{d}</div>
 ))}
 {Array(startDay).fill(null).map((_,i) => <div key={`p${i}`} />)}
 {Array.from({length:daysInMonth}, (_,i) => {
 const d = i+1;
 const dateStr = `${yymm}-${String(d).padStart(2,'0')}`;
 const acts = history[dateStr] || [];
 const hasWorkout = acts.includes('workout');
 const hasRehab = acts.includes('rehab');
 const hasCardio = acts.includes('cardio');
 const hasAny = acts.length > 0;
 const isToday = dateStr === today;

 let bg = 'rgba(255,255,255,0.03)';
 if (hasWorkout) bg = T.accent;
 else if (hasRehab || hasCardio) bg = T.teal;

 const activityDesc = [hasWorkout && 'workout', hasRehab && 'rehab', hasCardio && 'cardio'].filter(Boolean).join(', ') || 'no activity';
 const fullDate = new Date(viewDate.getFullYear, viewDate.getMonth, d).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

 return (
 <div key={d} role="gridcell"
 aria-label={`${fullDate}${isToday ? ' (today)' : ''}, ${activityDesc}`}
 tabIndex={hasAny ? 0 : -1}
 onClick={ => hasAny && onDayClick?.(dateStr)}
 onKeyDown={(e) => { if (hasAny && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault; onDayClick?.(dateStr); } }}
 style={{
 aspectRatio:'1', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center',
 fontSize:'12px', fontWeight: hasAny ? 600 : 400,
 color: hasAny ? '#fff' : T.text3, background:bg,
 border: isToday ? `2px solid ${T.accent}` : '1px solid transparent',
 transition:'all 0.2s', cursor: hasAny ? 'pointer' : 'default',
 }}>{d}</div>
 );
 })}
 </div>
 <div style={{ display:'flex', gap:'16px', justifyContent:'center', marginTop:'12px', fontSize:'10px', color:T.text3 }}>
 <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <div style={{ width:8, height:8, borderRadius:'3px', background:T.accent }} /> Workout
 </div>
 <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <div style={{ width:8, height:8, borderRadius:'3px', background:T.teal }} /> Rehab/Cardio
 </div>
 </div>
 </GlassCard>
 );
}

// ============================================================
// BODY LOG: Daily Entry Card
// ============================================================

function DailyLogCard({ settings, nutritionConfig, calibration, profile, onSave, onAddXP }) {
 const [selectedDate, setSelectedDate] = useState(today);
 const existing = LS.get(`bodyLog:${selectedDate}`, null);
 const prevLog = LS.get(`bodyLog:${subtractDays(selectedDate, 1)}`, null);

 const [weight, setWeight] = useState(existing?.weight != null ? String(existing.weight) : (prevLog?.weight ? String(prevLog.weight) : ''));
 const [calories, setCalories] = useState(existing?.calories != null ? String(existing.calories) : '');
 const [protein, setProtein] = useState(existing?.protein != null ? String(existing.protein) : '');
 const [bfValue, setBfValue] = useState(existing?.bodyFat?.value != null ? String(existing.bodyFat.value) : '');
 const [bfSource, setBfSource] = useState(existing?.bodyFat?.source ?? 'bia');
 const [waist, setWaist] = useState(existing?.waistCircumference != null ? String(existing.waistCircumference) : '');
 const [sleepHrs, setSleepHrs] = useState(existing?.sleep?.hours != null ? String(existing.sleep.hours) : '');
 const [sleepQuality, setSleepQuality] = useState(existing?.sleep?.quality ?? null);
 const [hrv, setHrv] = useState(existing?.sleep?.hrv != null ? String(existing.sleep.hrv) : '');
 const [notes, setNotes] = useState(existing?.notes ?? '');
 const [showMore, setShowMore] = useState(false);
 const [dexaBiaValue, setDexaBiaValue] = useState('');
 const [saved, setSaved] = useState(!!existing);

 // Reset form when date changes
 useEffect( => {
 const log = LS.get(`bodyLog:${selectedDate}`, null);
 const prev = LS.get(`bodyLog:${subtractDays(selectedDate, 1)}`, null);
 setWeight(log?.weight != null ? String(log.weight) : (prev?.weight ? String(prev.weight) : ''));
 setCalories(log?.calories != null ? String(log.calories) : '');
 setProtein(log?.protein != null ? String(log.protein) : '');
 setBfValue(log?.bodyFat?.value != null ? String(log.bodyFat.value) : '');
 setBfSource(log?.bodyFat?.source ?? 'bia');
 setWaist(log?.waistCircumference != null ? String(log.waistCircumference) : '');
 setSleepHrs(log?.sleep?.hours != null ? String(log.sleep.hours) : '');
 setSleepQuality(log?.sleep?.quality ?? null);
 setHrv(log?.sleep?.hrv != null ? String(log.sleep.hrv) : '');
 setNotes(log?.notes ?? '');
 setSaved(!!log);
 setDexaBiaValue('');
 }, [selectedDate]);

 const calibrated = bfValue && calibration?.points?.length > 0
 ? getCalibratedBodyFat(Number(bfValue), calibration) : null;

 const streaks = profile?.streaks || DEFAULT_STREAKS;
 const combinedStreak = streaks.combined?.current || 0;

 const handleSave = => {
 // Sanitize numeric inputs: reject non-positive weight, clamp calories
 const parsedWeight = weight ? Number(weight) : null;
 const parsedCals = calories ? Number(calories) : null;
 const parsedProtein = protein ? Number(protein) : null;
 const validWeight = (parsedWeight && parsedWeight > 0 && isFinite(parsedWeight)) ? parsedWeight : null;
 const validCals = (parsedCals && parsedCals > 0 && isFinite(parsedCals)) ? parsedCals : null;
 const validProtein = (parsedProtein && parsedProtein >= 0 && isFinite(parsedProtein)) ? parsedProtein : null;

 // Warn on suspiciously low/high calorie values
 if (validCals && (validCals < 200 || validCals > 15000)) {
 if (!window.confirm(`Calorie value of ${validCals} looks unusual. Save anyway?`)) return;
 }

 const log = {
 date: selectedDate,
 weight: validWeight,
 calories: validCals,
 protein: validProtein,
 bodyFat: bfValue ? {
 value: Number(bfValue),
 source: bfSource,
 device: calibration?.deviceId || '',
 calibratedValue: calibrated?.calibrated ? calibrated.value : null,
 } : null,
 waistCircumference: waist ? Number(waist) : null,
 sleep: (sleepHrs || sleepQuality || hrv) ? {
 hours: sleepHrs ? Number(sleepHrs) : null,
 quality: sleepQuality,
 hrv: hrv ? Number(hrv) : null,
 } : null,
 notes: notes || '',
 timestamp: Date.now,
 };

 // If DEXA source and we have a BIA reading too, auto-add calibration point
 const calPoint = (bfSource === 'dexa' && dexaBiaValue)
 ? { date: selectedDate, biaValue: Number(dexaBiaValue), dexaValue: Number(bfValue), weight: weight ? Number(weight) : null }
 : null;

 onSave(log, calPoint);
 setSaved(true);
 };

 const wUnit = settings?.weightUnit || 'lbs';
 const waistUnit = nutritionConfig?.waistUnit || 'in';
 const isToday = selectedDate === today;
 const isYesterday = selectedDate === subtractDays(today, 1);

 const InputField = ({ icon, label, value, onChange, unit, inputMode = 'decimal', placeholder }) => (
 <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
 <span style={{ fontSize:'16px', width:'24px', textAlign:'center' }} aria-hidden="true">{icon}</span>
 <span style={{ fontSize:'13px', color:T.text2, width:'70px', flexShrink:0 }}>{label}</span>
 <input
 type="text" inputMode={inputMode} placeholder={placeholder || '—'}
 value={value} onChange={e => onChange(e.target.value)}
 aria-label={`${label}${unit ? ` (${unit})` : ''}`}
 style={{
 flex:1, background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'8px', padding:'8px 10px', color:T.text, fontSize:'16px',
 fontFamily:T.mono, outline:'none', textAlign:'right', minWidth:0,
 }}
 />
 {unit && <span style={{ fontSize:'12px', color:T.text3, width:'32px', flexShrink:0 }} aria-hidden="true">{unit}</span>}
 {value && <Check size={14} color={T.teal} style={{ flexShrink:0 }} aria-hidden="true" />}
 </div>
 );

 return (
 <GlassCard style={{ marginBottom:'16px', padding:'16px' }}>
 {/* Header with date navigation */}
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <Scale size={18} color={T.accent} />
 <span style={{ fontSize:'15px', fontWeight:600 }}>Daily Log</span>
 </div>
 <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
 <button onClick={ => setSelectedDate(subtractDays(selectedDate, 1))}
 aria-label="Previous day"
 style={{ padding:'8px', borderRadius:'6px', border:'none', fontSize:'14px', cursor:'pointer',
 background:'rgba(255,255,255,0.04)', color:T.text3, lineHeight:1, minWidth:'44px', minHeight:'44px',
 display:'flex', alignItems:'center', justifyContent:'center' }}>
 <ChevronLeft size={14} />
 </button>
 <div style={{ position:'relative' }}>
 <input type="date" value={selectedDate}
 max={today}
 onChange={e => { if (e.target.value) setSelectedDate(e.target.value); }}
 aria-label="Select log date"
 style={{
 background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:'6px',
 padding:'4px 8px', color:T.text, fontSize:'16px', fontFamily:T.mono, outline:'none',
 cursor:'pointer', colorScheme:'dark', width:'130px',
 }} />
 </div>
 {!isToday && (
 <button onClick={ => setSelectedDate(today)}
 style={{ padding:'8px 12px', borderRadius:'6px', border:'none', fontSize:'11px', fontWeight:600,
 cursor:'pointer', background:T.accentSoft, color:T.accent, minHeight:'36px' }}>Today</button>
 )}
 {selectedDate !== subtractDays(today, 1) && !isToday && (
 <button onClick={ => setSelectedDate(subtractDays(today, 1))}
 style={{ padding:'8px 12px', borderRadius:'6px', border:'none', fontSize:'11px', fontWeight:500,
 cursor:'pointer', background:'rgba(255,255,255,0.04)', color:T.text3, minHeight:'36px' }}>Yest.</button>
 )}
 </div>
 </div>

 {/* Date context label */}
 {!isToday && (
 <div style={{ fontSize:'11px', color: isYesterday ? T.teal : T.warn, marginBottom:'8px', 
 padding:'4px 8px', borderRadius:'6px',
 background: isYesterday ? 'rgba(78,205,196,0.06)' : 'rgba(255,183,77,0.06)' }}>
 {isYesterday ? '📝 Logging for yesterday' : `📝 Logging for ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year: new Date(selectedDate).getFullYear !== new Date.getFullYear ? 'numeric' : undefined })}`}
 </div>
 )}

 {/* Core fields */}
 <InputField icon="⚖️" label="Weight" value={weight} onChange={setWeight} unit={wUnit} placeholder={prevLog?.weight ? String(prevLog.weight) : '—'} />
 <InputField icon="🔥" label="Calories" value={calories} onChange={setCalories} unit="kcal" inputMode="numeric" />
 <InputField icon="🥩" label="Protein" value={protein} onChange={setProtein} unit="g" inputMode="numeric" />

 {/* Body fat with source selector */}
 <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
 <span style={{ fontSize:'16px', width:'24px', textAlign:'center' }}>📐</span>
 <span style={{ fontSize:'13px', color:T.text2, width:'70px', flexShrink:0 }}>Body Fat</span>
 <input
 type="text" inputMode="decimal" placeholder="—"
 value={bfValue} onChange={e => setBfValue(e.target.value)}
 aria-label="Body fat percentage"
 style={{
 flex:1, background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'8px', padding:'8px 10px', color:T.text, fontSize:'14px',
 fontFamily:T.mono, outline:'none', textAlign:'right', minWidth:0,
 }}
 />
 <span style={{ fontSize:'12px', color:T.text3, width:'8px' }} aria-hidden="true">%</span>
 <select value={bfSource} onChange={e => setBfSource(e.target.value)} aria-label="Body fat measurement source" style={{
 background:'rgba(255,255,255,0.06)', border:`1px solid ${T.border}`, borderRadius:'6px',
 padding:'4px 6px', color:T.text2, fontSize:'11px', outline:'none',
 }}>
 <option value="bia">BIA</option>
 <option value="dexa">DEXA</option>
 <option value="calipers">Calipers</option>
 <option value="visual">Visual</option>
 <option value="manual">Manual</option>
 </select>
 </div>

 {/* Calibrated value display */}
 {bfValue && calibrated?.calibrated && (
 <div style={{ padding:'6px 0 6px 34px', fontSize:'12px', color:T.text3 }}>
 Calibrated: <span style={{ color:T.teal, fontWeight:600, fontFamily:T.mono }}>{calibrated.value}%</span>
 <span style={{ marginLeft:'6px', opacity:0.6 }}>({calibrated.confidence})</span>
 </div>
 )}

 {/* DEXA source: prompt for home scale reading */}
 {bfSource === 'dexa' && bfValue && (
 <div style={{ padding:'8px 12px', margin:'4px 0 4px 34px', background:'rgba(78,205,196,0.06)',
 borderRadius:'8px', border:`1px solid rgba(78,205,196,0.15)`, fontSize:'12px', color:T.text2 }}>
 <div style={{ marginBottom:'6px' }}>This will be used as a calibration point. Enter your home scale BIA reading from today (if available):</div>
 <input type="text" inputMode="decimal" placeholder="BIA reading" value={dexaBiaValue}
 onChange={e => setDexaBiaValue(e.target.value)}
 aria-label="BIA reading for calibration"
 style={{
 width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'6px', padding:'6px 8px', color:T.text, fontSize:'13px', fontFamily:T.mono, outline:'none',
 }} />
 </div>
 )}

 {/* Expandable optional fields */}
 <button onClick={ => setShowMore(!showMore)} aria-expanded={showMore} style={{
 background:'none', border:'none', color:T.text3, fontSize:'13px', cursor:'pointer',
 padding:'12px 8px', display:'flex', alignItems:'center', gap:'6px', width:'100%',
 minHeight:'44px',
 }}>
 {showMore ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
 {showMore ? 'Less' : 'More'} (waist, sleep, notes)
 </button>

 {showMore && (
 <div style={{ animation:'fadeIn 0.2s ease-out' }}>
 <InputField icon="📏" label="Waist" value={waist} onChange={setWaist} unit={waistUnit} />
 <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
 <span style={{ fontSize:'16px', width:'24px', textAlign:'center' }}>😴</span>
 <span style={{ fontSize:'13px', color:T.text2, width:'70px', flexShrink:0 }}>Sleep</span>
 <input type="text" inputMode="decimal" placeholder="hrs" value={sleepHrs}
 onChange={e => setSleepHrs(e.target.value)}
 aria-label="Sleep hours"
 style={{
 flex:1, background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'8px', padding:'8px 10px', color:T.text, fontSize:'14px',
 fontFamily:T.mono, outline:'none', textAlign:'right', minWidth:0,
 }} />
 <span style={{ fontSize:'12px', color:T.text3 }}>hrs</span>
 </div>
 <div style={{ display:'flex', gap:'6px', padding:'8px 0 8px 34px' }} role="group" aria-label="Sleep quality">
 {['poor','fair','good','excellent'].map(q => (
 <button key={q} onClick={ => setSleepQuality(sleepQuality === q ? null : q)} aria-pressed={sleepQuality === q} aria-label={`Sleep quality: ${q}`} style={{
 padding:'8px 12px', borderRadius:'6px', fontSize:'11px', fontWeight:500, border:'none', cursor:'pointer',
 background: sleepQuality === q ? T.tealGlow : 'rgba(255,255,255,0.04)',
 color: sleepQuality === q ? T.teal : T.text3,
 }}>{q}</button>
 ))}
 </div>
 <InputField icon="💓" label="HRV" value={hrv} onChange={setHrv} unit="ms" inputMode="numeric" />
 <div style={{ padding:'8px 0' }}>
 <textarea placeholder="Notes." value={notes} onChange={e => setNotes(e.target.value)}
 aria-label="Daily notes"
 style={{
 width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'8px', padding:'8px 10px', color:T.text, fontSize:'13px',
 fontFamily:T.font, outline:'none', resize:'vertical', minHeight:'48px', boxSizing:'border-box',
 }} />
 </div>
 </div>
 )}

 {/* Save button */}
 <button onClick={handleSave} style={{
 width:'100%', padding:'12px', marginTop:'8px',
 background: saved ? T.tealGlow : `linear-gradient(135deg, ${T.accent}, #FF8C42)`,
 border: saved ? `1px solid rgba(78,205,196,0.3)` : 'none',
 borderRadius:'10px', color: saved ? T.teal : '#fff',
 fontWeight:600, fontSize:'14px', cursor:'pointer',
 display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
 transition:'all 0.2s',
 }}>
 {saved ? <><Check size={16} /> Saved</> : 'Save'}
 </button>

 {/* Streak display */}
 {combinedStreak > 0 && (
 <div style={{
 textAlign:'center', marginTop:'10px', fontSize:'13px', fontWeight:600,
 color:T.accent, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
 }}>
 <Flame size={16} style={{ animation: combinedStreak > 7 ? 'pulse 2s infinite' : 'none' }} />
 Logging streak: {combinedStreak} day{combinedStreak !== 1 ? 's' : ''}
 <Flame size={16} style={{ animation: combinedStreak > 7 ? 'pulse 2s infinite' : 'none' }} />
 </div>
 )}
 </GlassCard>
 );
}

// ============================================================
// CHART: Weight Trend (inline SVG)
// ============================================================

function WeightTrendChart({ settings, nutritionConfig, goToToday, bodyLogs }) {
 const [range, setRange] = useState('1M');
 const [hoverIdx, setHoverIdx] = useState(null);
 const allLogs = useMemo( => bodyLogs || loadBodyLogs, [bodyLogs]);
 const smoothed = useMemo( => getSmoothedWeights(allLogs, nutritionConfig), [allLogs, nutritionConfig]);

 // Filter by time range
 const filteredData = useMemo( => {
 if (smoothed.length === 0) return [];
 const now = new Date;
 const ranges = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 730 };
 const days = ranges[range] || 30;
 const cutoff = new Date(now);
 cutoff.setDate(cutoff.getDate - days);
 const cutoffStr = cutoff.toISOString.split('T')[0];
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
 const deltas = useMemo( => {
 if (smoothed.length < 2) return [];
 const latest = smoothed[smoothed.length - 1]?.trend;
 return [3, 7, 14, 30, 90].map(d => {
 const cutoff = subtractDays(today, d);
 const past = smoothed.find(s => s.date >= cutoff);
 if (!past) return null;
 const delta = Math.round((latest - past.trend) * 10) / 10;
 return { label: `${d}d`, delta };
 }).filter(Boolean);
 }, [smoothed]);

 if (allLogs.length === 0) {
 return (
 <GlassCard style={{ padding:'20px', textAlign:'center', marginBottom:'16px' }}>
 <Scale size={24} color={T.text3} style={{ marginBottom:'8px' }} />
 <div style={{ fontSize:'14px', color:T.text2, marginBottom:'4px' }}>No weight data yet</div>
 <div style={{ fontSize:'12px', color:T.text3 }}>Log your weight on the Today tab to see trends</div>
 <div style={{ fontSize:'11px', color:T.accent, marginTop:'8px', cursor:'pointer', opacity:0.7 }}
 onClick={goToToday} role="button" tabIndex={0}>← Switch to Today to start logging</div>
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
 const allVals = [.raws,.trends];
 const minW = Math.floor(Math.min(.allVals) - 2);
 const maxW = Math.ceil(Math.max(.allVals) + 2);
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
 <button key={r} onClick={ => setRange(r)} style={{
 padding:'6px 10px', borderRadius:'6px', border:'none', fontSize:'10px', fontWeight:600, cursor:'pointer', minHeight:'32px',
 background: range === r ? T.accentSoft : 'transparent',
 color: range === r ? T.accent : T.text3,
 }}>{r}</button>
 ))}
 </div>
 </div>

 <GlassCard animate={false} style={{ padding:'12px 8px 8px', overflow:'hidden' }}>
 <svg key={range} className="chart-svg" viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', display:'block' }}
 role="img" aria-label={`Weight trend chart showing ${pts.length} data points over ${range}`}
 onMouseLeave={ => setHoverIdx(null)} onTouchEnd={ => setHoverIdx(null)}>
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
 onMouseEnter={ => setHoverIdx(i)}
 onTouchStart={ => setHoverIdx(i)} />
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

// ============================================================
// CHART: BODY FAT TREND
// ============================================================

function BodyFatChart({ settings, nutritionConfig, goToToday, allBodyLogs }) {
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

 const allVals = [.filteredData.map(d => d.raw),.filteredData.map(d => d.calibrated)];
 const minV = Math.floor(Math.min(.allVals) - 2);
 const maxV = Math.ceil(Math.max(.allVals) + 2);
 const yRange = maxV - minV || 1;

 const xPos = (i) => PAD.left + (i / Math.max(filteredData.length - 1, 1)) * cW;
 const yPos = (v) => PAD.top + (1 - (v - minV) / yRange) * cH;

 // Calibrated line path
 const calPath = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.calibrated).toFixed(1)}`).join(' ');

 // Confidence band (wider with fewer calibration points)
 const calPts = cal.points?.length || 0;
 const bandWidth = calPts === 0 ? 3 : calPts === 1 ? 2 : calPts >= 3 ? 0.8 : 1.2;
 const bandTop = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.calibrated + bandWidth).toFixed(1)}`).join(' ');
 const bandBot = [.filteredData].reverse.map((d, i) => {
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

// ============================================================
// CHART: NUTRITION (CALORIES + PROTEIN)
// ============================================================

function NutritionChart({ nutritionConfig, goToToday, allBodyLogs }) {
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
 const allCals = [.filteredData.map(d => d.calories), calTarget, tdee];
 const minCal = Math.floor((Math.min(.allCals) - 100) / 100) * 100;
 const maxCal = Math.ceil((Math.max(.allCals) + 100) / 100) * 100;
 const calRange = maxCal - minCal || 1;

 // Protein secondary Y-axis
 const prots = filteredData.filter(d => d.protein != null).map(d => d.protein);
 const minProt = prots.length > 0 ? Math.floor(Math.min(.prots, protTarget) / 10) * 10 - 10 : 0;
 const maxProt = prots.length > 0 ? Math.ceil(Math.max(.prots, protTarget) / 10) * 10 + 10 : 200;
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

// ============================================================
// CHART: TDEE TREND
// ============================================================

function TDEETrendChart({ nutritionConfig }) {
 const [range, setRange] = useState('3M');
 const [hoverIdx, setHoverIdx] = useState(null);
 const cfg = nutritionConfig || DEFAULT_NUTRITION_CONFIG;

 const chartData = useMemo( => {
 const hist = cfg.tdeeHistory || [];
 return hist.filter(h => h.date && h.tdee).sort((a, b) => a.date.localeCompare(b.date));
 }, [cfg.tdeeHistory]);

 const filteredData = useMemo( => {
 if (chartData.length === 0) return [];
 const ranges = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 99999 };
 const cutoff = subtractDays(today, ranges[range] || 90);
 return chartData.filter(d => d.date >= cutoff);
 }, [chartData, range]);

 // Delta (adaptation detection)
 const delta30 = useMemo( => {
 if (chartData.length < 2) return null;
 const cutoff = subtractDays(today, 30);
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
 const minT = Math.floor((Math.min(.vals) - 50) / 50) * 50;
 const maxT = Math.ceil((Math.max(.vals) + 50) / 50) * 50;
 const yRange = maxT - minT || 1;

 const xPos = (i) => PAD.left + (i / Math.max(filteredData.length - 1, 1)) * cW;
 const yPos = (v) => PAD.top + (1 - (v - minT) / yRange) * cH;

 const linePath = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.tdee).toFixed(1)}`).join(' ');
 const areaPath = linePath + ` L${xPos(filteredData.length - 1).toFixed(1)},${(PAD.top + cH).toFixed(1)} L${PAD.left},${(PAD.top + cH).toFixed(1)} Z`;

 // Confidence shading (wider early, narrower later)
 const totalDays = chartData.length;
 const confWidth = totalDays < 14 ? 100 : totalDays < 30 ? 50 : 25;
 const confTopPath = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.tdee + confWidth).toFixed(1)}`).join(' ');
 const confBotPath = [.filteredData].reverse.map((d, i) => {
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
 role="img" aria-label={`TDEE trend chart over ${range}`}
 onMouseLeave={ => setHoverIdx(null)} onTouchEnd={ => setHoverIdx(null)}>
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
 onMouseEnter={ => setHoverIdx(i)} onTouchStart={ => setHoverIdx(i)} />
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

// ============================================================
// CHART: WAIST CIRCUMFERENCE
// ============================================================

function WaistChart({ settings, nutritionConfig, allBodyLogs }) {
 const [range, setRange] = useState('3M');
 const [hoverIdx, setHoverIdx] = useState(null);
 const waistUnit = nutritionConfig?.waistUnit || 'in';

 const chartData = useMemo( => {
 return (allBodyLogs || loadAllBodyLogs).filter(l => l.waistCircumference).map(l => ({
 date: l.date,
 waist: Number(l.waistCircumference),
 }));
 }, [allBodyLogs]);

 const filteredData = useMemo( => {
 if (chartData.length === 0) return [];
 const ranges = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 99999 };
 const cutoff = subtractDays(today, ranges[range] || 90);
 return chartData.filter(d => d.date >= cutoff);
 }, [chartData, range]);

 // Waist-to-height ratio
 const heightInches = settings?.heightInches ? Number(settings.heightInches) : null;
 const whrText = useMemo( => {
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
 const minW = Math.floor(Math.min(.vals) - 1);
 const maxW = Math.ceil(Math.max(.vals) + 1);
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
 const deltas = useMemo( => {
 if (chartData.length < 2) return [];
 const latest = chartData[chartData.length - 1].waist;
 return [7, 30, 90].map(d => {
 const cutoff = subtractDays(today, d);
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
 role="img" aria-label={`Waist measurement trend chart over ${range}`}
 onMouseLeave={ => setHoverIdx(null)} onTouchEnd={ => setHoverIdx(null)}>
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
 onMouseEnter={ => setHoverIdx(i)} onTouchStart={ => setHoverIdx(i)} />
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

// ============================================================
// CHART: MULTI-METRIC OVERLAY
// ============================================================

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

 useEffect( => {
 if (!open) return;
 const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
 document.addEventListener('mousedown', handler);
 return => document.removeEventListener('mousedown', handler);
 }, [open]);

 return (
 <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
 <button onClick={ => setOpen(o => !o)} style={{
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
 <button key={m.key} onClick={ => { onChange(m.key); setOpen(false); }} style={{
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
 const allSeries = useMemo( => {
 const logs = allBodyLogs || loadAllBodyLogs;
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
 const { primaryData, secondaryData, alignedDates } = useMemo( => {
 const ranges = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': 99999 };
 const cutoff = subtractDays(today, ranges[range] || 30);

 const pRaw = (allSeries[primaryKey] || []).filter(d => d.date >= cutoff);
 const sRaw = (allSeries[secondaryKey] || []).filter(d => d.date >= cutoff);

 // Build union of all dates, sorted
 const dateSet = new Set([.pRaw.map(d => d.date),.sRaw.map(d => d.date)]);
 const dates = [.dateSet].sort;

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
 const correlation = useMemo( => {
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

 const pMin = pVals.length > 0 ? Math.min(.pVals) : 0;
 const pMax = pVals.length > 0 ? Math.max(.pVals) : 1;
 const pPad = (pMax - pMin) * 0.08 || 1;

 const sMin = sVals.length > 0 ? Math.min(.sVals) : 0;
 const sMax = sVals.length > 0 ? Math.max(.sVals) : 1;
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
 <button key={r} onClick={ => setRange(r)} style={{
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
 onMouseLeave={ => setHoverIdx(null)}
 onTouchMove={(e) => {
 const rect = e.currentTarget.getBoundingClientRect;
 const x = ((e.touches[0].clientX - rect.left) / rect.width) * W;
 const idx = Math.round(((x - PAD.left) / cW) * (n - 1));
 setHoverIdx(Math.max(0, Math.min(n - 1, idx)));
 }}
 onTouchEnd={ => setHoverIdx(null)}
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

// ============================================================
// WEEKLY CHECK-IN CARD
// ============================================================

function WeeklyCheckInCard({ nutritionConfig, onUpdateNutritionConfig, settings, allBodyLogs }) {
 const [dismissed, setDismissed] = useState(false);
 const cfg = nutritionConfig || DEFAULT_NUTRITION_CONFIG;

 const checkInData = useMemo( => {
 const lastCheckIn = cfg.lastCheckInDate;
 const allLogs = allBodyLogs || loadAllBodyLogs;
 const logsWithWeight = allLogs.filter(l => l.weight);
 const logsWithCals = allLogs.filter(l => l.calories);

 // Must have 7+ days of data
 if (logsWithWeight.length < 7 && logsWithCals.length < 7) return null;

 // Check if 7+ days since last check-in
 const todayStr = today;
 
 // Check snooze
 if (cfg.snoozeUntilDate && todayStr < cfg.snoozeUntilDate) return null;
 
 if (lastCheckIn) {
 const daysSince = Math.floor((new Date(todayStr + 'T12:00:00') - new Date(lastCheckIn + 'T12:00:00')) / 86400000);
 if (daysSince < 7) return null;
 } else {
 // No check-in ever — need 7+ days of data
 const firstDate = [.logsWithWeight,.logsWithCals].sort((a, b) => a.date.localeCompare(b.date))[0]?.date;
 if (!firstDate) return null;
 const daysSinceFirst = Math.floor((new Date(todayStr + 'T12:00:00') - new Date(firstDate + 'T12:00:00')) / 86400000);
 if (daysSinceFirst < 7) return null;
 }

 // Weight trend last 7 days (smoothed)
 const recentWeight = logsWithWeight.slice(-14);
 let weightTrend = null;
 if (recentWeight.length >= 3) {
 const smoothed = smoothEWMA(recentWeight);
 const last7 = smoothed.slice(-7);
 if (last7.length >= 2) {
 const startW = last7[0].trend;
 const endW = last7[last7.length - 1].trend;
 weightTrend = {
 start: startW,
 end: endW,
 delta: Math.round((endW - startW) * 100) / 100,
 direction: endW > startW ? 'up' : endW < startW ? 'down' : 'flat',
 };
 }
 }

 // Average intake last 7 days
 const cutoff7 = subtractDays(todayStr, 7);
 const recentCals = logsWithCals.filter(l => l.date >= cutoff7);
 const avgIntake = recentCals.length > 0
 ? Math.round(recentCals.reduce((a, l) => a + Number(l.calories), 0) / recentCals.length)
 : null;

 const calTarget = cfg.dailyCalorieTarget || 2200;
 const adherencePct = avgIntake ? Math.round((avgIntake / calTarget) * 100) : null;
 const onTarget = adherencePct && adherencePct >= 90 && adherencePct <= 110;
 const overTarget = adherencePct && adherencePct > 110;

 // TDEE
 const tdee = cfg.estimatedTDEE || 2500;
 const confidence = cfg.tdeeConfidence || 'low';

 // Compute proposed new target
 const goal = cfg.goal || 'maintain';
 const rate = cfg.weeklyRatePercent || 0.5;
 const latestWeight = logsWithWeight.length > 0 ? Number(logsWithWeight[logsWithWeight.length - 1].weight) : 185;
 const isKg = (cfg.weightUnit || 'lbs') === 'kg';
 const calPerUnit = isKg ? 7700 : 3500;
 const weeklyChange = (rate / 100) * latestWeight * calPerUnit;
 const dailyAdj = weeklyChange / 7;

 let newTarget;
 if (goal === 'lose') newTarget = Math.round(tdee - dailyAdj);
 else if (goal === 'gain') newTarget = Math.round(tdee + dailyAdj);
 else newTarget = Math.round(tdee);

 // Decision logic
 let recommendation = 'none'; // 'adjust' | 'adherence' | 'none'
 let message = '';

 if (overTarget) {
 recommendation = 'adherence';
 message = `Intake averaged ${adherencePct}% of target (above target). Current targets are kept — focus on hitting the daily target more consistently.`;
 } else if (onTarget && goal !== 'maintain') {
 // Check if weight is moving in the right direction
 const goalDir = goal === 'lose' ? 'down' : 'up';
 if (weightTrend && weightTrend.direction !== goalDir && weightTrend.direction !== 'flat') {
 recommendation = 'adjust';
 message = `Intake was on-target (${adherencePct}%), but weight moved ${weightTrend.direction} instead of ${goalDir}. TDEE estimate may need adjustment.`;
 } else if (weightTrend && weightTrend.direction === 'flat' && goal !== 'maintain') {
 recommendation = 'adjust';
 message = `Intake was on-target (${adherencePct}%), but weight hasn't changed. TDEE estimate may need adjustment.`;
 } else {
 recommendation = 'none';
 message = `On track! Intake at ${adherencePct}% of target and weight is trending ${weightTrend?.direction || 'as expected'}.`;
 }
 } else if (avgIntake && adherencePct < 90 && goal === 'gain') {
 recommendation = 'adherence';
 message = `Intake averaged ${adherencePct}% of target (below target). Try to hit the daily target more consistently for weight gain.`;
 } else {
 recommendation = 'none';
 message = avgIntake
 ? `Intake averaged ${adherencePct}% of target. Keep logging for more accurate recommendations.`
 : 'Not enough calorie data for a detailed recommendation yet.';
 }

 return {
 tdee, confidence, weightTrend, avgIntake, adherencePct, calTarget,
 newTarget, recommendation, message, onTarget,
 currentTarget: calTarget,
 latestWeight,
 };
 }, [cfg, allBodyLogs]);

 if (!checkInData || dismissed) return null;

 const { tdee, confidence, weightTrend, avgIntake, adherencePct, newTarget, recommendation, message, currentTarget } = checkInData;
 const showAdjust = recommendation === 'adjust' && newTarget !== currentTarget;
 const weightUnit = cfg.weightUnit || 'lbs';

 const handleAccept = => {
 onUpdateNutritionConfig({
.cfg,
 dailyCalorieTarget: newTarget,
 lastCheckInDate: today,
 });
 setDismissed(true);
 };

 const handleDismiss = => {
 onUpdateNutritionConfig({
.cfg,
 lastCheckInDate: today,
 });
 setDismissed(true);
 };

 const handleSnooze = => {
 const snoozeDate = new Date;
 snoozeDate.setDate(snoozeDate.getDate + 3);
 onUpdateNutritionConfig({
.cfg,
 snoozeUntilDate: snoozeDate.toISOString.split('T')[0],
 });
 setDismissed(true);
 };

 return (
 <GlassCard animate={false} style={{
 padding: '16px', marginBottom: '16px',
 border: `1px solid ${T.tealGlow}`,
 background: `linear-gradient(135deg, rgba(78,205,196,0.04), rgba(255,107,53,0.02))`,
 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
 <Target size={18} color={T.teal} />
 <span style={{ fontSize: '15px', fontWeight: 700, color: T.text }}>Weekly Check-In</span>
 </div>

 {/* Stats row */}
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
 {/* TDEE */}
 <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: T.radiusSm, padding: '8px', textAlign: 'center' }}>
 <div style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>TDEE</div>
 <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: T.mono, color: T.accent }}>{tdee.toLocaleString}</div>
 <div style={{
 fontSize: '9px', marginTop: '2px',
 color: confidence === 'high' ? T.teal : confidence === 'medium' ? T.warn : T.text3,
 }}>
 {confidence} confidence
 </div>
 </div>
 {/* Weight trend */}
 <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: T.radiusSm, padding: '8px', textAlign: 'center' }}>
 <div style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>7d Weight</div>
 {weightTrend ? (
 <>
 <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: T.mono,
 color: weightTrend.direction === 'down' ? T.teal : weightTrend.direction === 'up' ? T.warn : T.text2 }}>
 {weightTrend.delta > 0 ? '+' : ''}{weightTrend.delta} {weightUnit}
 </div>
 <div style={{ fontSize: '9px', color: T.text3, marginTop: '2px' }}>
 {weightTrend.direction === 'flat' ? '→ flat' : weightTrend.direction === 'down' ? '↓ decreasing' : '↑ increasing'}
 </div>
 </>
 ) : (
 <div style={{ fontSize: '12px', color: T.text3, marginTop: '4px' }}>—</div>
 )}
 </div>
 {/* Avg intake */}
 <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: T.radiusSm, padding: '8px', textAlign: 'center' }}>
 <div style={{ fontSize: '10px', color: T.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Avg Intake</div>
 {avgIntake ? (
 <>
 <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: T.mono, color: T.text }}>{avgIntake.toLocaleString}</div>
 <div style={{
 fontSize: '9px', marginTop: '2px',
 color: adherencePct >= 90 && adherencePct <= 110 ? T.teal : T.warn,
 }}>
 {adherencePct}% of target
 </div>
 </>
 ) : (
 <div style={{ fontSize: '12px', color: T.text3, marginTop: '4px' }}>—</div>
 )}
 </div>
 </div>

 {/* Message */}
 <div style={{ fontSize: '12px', color: T.text2, lineHeight: 1.5, marginBottom: '12px', padding: '0 2px' }}>
 {message}
 </div>

 {/* Adjustment proposal */}
 {showAdjust && (
 <div style={{
 background: 'rgba(255,255,255,0.04)', borderRadius: T.radiusSm, padding: '10px',
 marginBottom: '12px', border: `1px solid ${T.border}`,
 }}>
 <div style={{ fontSize: '11px', color: T.text3, marginBottom: '6px' }}>Suggested Target Adjustment</div>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
 <div style={{ textAlign: 'center' }}>
 <div style={{ fontSize: '10px', color: T.text3 }}>Current</div>
 <div style={{ fontSize: '16px', fontFamily: T.mono, color: T.text2, fontWeight: 600 }}>
 {currentTarget.toLocaleString}
 </div>
 </div>
 <ChevronRight size={16} color={T.teal} />
 <div style={{ textAlign: 'center' }}>
 <div style={{ fontSize: '10px', color: T.teal }}>Proposed</div>
 <div style={{ fontSize: '16px', fontFamily: T.mono, color: T.teal, fontWeight: 700 }}>
 {newTarget.toLocaleString}
 </div>
 </div>
 <span style={{ fontSize: '10px', color: T.text3 }}>kcal/day</span>
 </div>
 </div>
 )}

 {/* Action buttons */}
 <div style={{ display: 'flex', gap: '8px' }}>
 {showAdjust && (
 <button onClick={handleAccept} style={{
 flex: 1, padding: '10px', borderRadius: T.radiusSm, border: 'none', cursor: 'pointer',
 background: `linear-gradient(135deg, ${T.teal}, ${T.teal}cc)`, color: T.bg,
 fontSize: '13px', fontWeight: 700, transition: 'all 0.2s',
 }}>
 Accept New Target
 </button>
 )}
 <button onClick={handleSnooze} style={{
 flex: 0, padding: '10px', borderRadius: T.radiusSm, cursor: 'pointer',
 background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
 color: T.text3, fontSize: '11px', fontWeight: 500, transition: 'all 0.2s',
 minWidth: '70px', whiteSpace: 'nowrap',
 }}>
 In 3 days
 </button>
 <button onClick={handleDismiss} style={{
 flex: showAdjust ? 0 : 1, padding: '10px', borderRadius: T.radiusSm, cursor: 'pointer',
 background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
 color: T.text2, fontSize: '13px', fontWeight: 500, transition: 'all 0.2s',
 minWidth: showAdjust ? '80px' : undefined,
 }}>
 {showAdjust ? 'Dismiss' : 'Got it'}
 </button>
 </div>
 </GlassCard>
 );
}

// ============================================================
// JOURNAL CARD
// ============================================================

function JournalCard({ workout }) {
 const [isOpen, setIsOpen] = useState(false);
 const [newEntry, setNewEntry] = useState('');
 const [recentEntries, setRecentEntries] = useState([]);
 const [showAll, setShowAll] = useState(false);

 // Load recent entries on mount/open
 useEffect( => {
 if (!isOpen) return;
 const entries = [];
 const keys = LS.keys('journal:');
 const sortedKeys = keys.sort((a, b) => b.localeCompare(a)).slice(0, 14); // Last 2 weeks
 for (const key of sortedKeys) {
 const dayEntries = LS.get(key, []);
 if (Array.isArray(dayEntries)) {
 entries.push(.dayEntries.map(e => ({.e, _date: key.replace('journal:', '') })));
 }
 }
 entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
 setRecentEntries(entries);
 }, [isOpen, newEntry]); // re-load after adding

 const getCurrentContext = => {
 const ctx = { phase: null, splitDay: null, exerciseName: null, exerciseId: null };
 if (workout?.exercises) {
 ctx.splitDay = workout.splitDay?.replace(/_/g, ' ') || null;
 // Find the last exercise that has any completed sets (current exercise being worked on)
 const inProgress = workout.exercises.find(ex => {
 const done = ex.logSets?.filter(s => s.done).length || 0;
 const total = ex.logSets?.length || 0;
 return done > 0 && done < total;
 });
 const lastDone = [.(workout.exercises || [])].reverse.find(ex => 
 ex.logSets?.some(s => s.done)
 );
 const current = inProgress || lastDone;
 if (current) {
 ctx.exerciseName = current.name;
 ctx.exerciseId = current.id;
 }
 }
 return ctx;
 };

 const handleAdd = => {
 if (!newEntry.trim) return;
 const todayStr = today;
 const ctx = getCurrentContext;
 const entry = {
 id: `j_${Date.now}`,
 timestamp: Date.now,
 text: newEntry.trim,
 tags: {
 splitDay: ctx.splitDay || null,
 exerciseName: ctx.exerciseName || null,
 exerciseId: ctx.exerciseId || null,
 time: new Date.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' }),
 },
 };
 const existing = LS.get(`journal:${todayStr}`, []);
 const updated = Array.isArray(existing) ? [.existing, entry] : [entry];
 LS.set(`journal:${todayStr}`, updated);
 setNewEntry('');
 };

 const handleDelete = (entryId, dateStr) => {
 const dayEntries = LS.get(`journal:${dateStr}`, []);
 const filtered = dayEntries.filter(e => e.id !== entryId);
 if (filtered.length > 0) {
 LS.set(`journal:${dateStr}`, filtered);
 } else {
 localStorage.removeItem(`journal:${dateStr}`);
 }
 setRecentEntries(prev => prev.filter(e => e.id !== entryId));
 };

 const ctx = getCurrentContext;
 const displayEntries = showAll ? recentEntries : recentEntries.slice(0, 4);

 return (
 <GlassCard style={{ marginBottom:'16px', padding: isOpen ? '16px' : '0', overflow:'hidden' }}>
 <button onClick={ => setIsOpen(!isOpen)} style={{
 width:'100%', padding: isOpen ? '0 0 12px' : '14px 16px', background:'none', border:'none',
 display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', color:T.text,
 }}>
 <BookOpen size={18} color={T.teal} />
 <span style={{ fontSize:'15px', fontWeight:600, flex:1, textAlign:'left' }}>Journal</span>
 {recentEntries.length > 0 && isOpen && (
 <span style={{ fontSize:'11px', color:T.text3, fontFamily:T.mono }}>{recentEntries.length}</span>
 )}
 <ChevronDown size={16} color={T.text3} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition:'0.2s' }} />
 </button>

 {isOpen && (
 <div style={{ animation:'fadeUp 0.2s ease-out' }}>
 {/* Auto-tag context */}
 {ctx.exerciseName && (
 <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'8px' }}>
 {ctx.splitDay && (
 <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'6px', background:T.accentSoft, color:T.accent, fontWeight:600 }}>
 {ctx.splitDay}
 </span>
 )}
 <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'6px', background:T.tealGlow, color:T.teal, fontWeight:600 }}>
 {ctx.exerciseName}
 </span>
 </div>
 )}

 {/* New entry input */}
 <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
 <textarea
 placeholder="How's the session going? Note form cues, pain, energy."
 value={newEntry} onChange={e => setNewEntry(e.target.value)}
 onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault; handleAdd; } }}
 rows={2} aria-label="Workout journal entry"
 style={{
 flex:1, background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'10px', padding:'10px 12px', color:T.text, fontSize:'13px',
 fontFamily:T.font, outline:'none', resize:'none', lineHeight:1.4,
 }}
 />
 <button onClick={handleAdd} disabled={!newEntry.trim}
 style={{
 width:'40px', borderRadius:'10px', border:'none', cursor: newEntry.trim ? 'pointer' : 'default',
 background: newEntry.trim ? T.tealGlow : 'rgba(255,255,255,0.02)',
 color: newEntry.trim ? T.teal : T.text3,
 display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', flexShrink:0,
 }}>
 <Send size={16} />
 </button>
 </div>

 {/* Recent entries */}
 {displayEntries.length > 0 && (
 <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:'10px' }}>
 <div style={{ fontSize:'10px', fontWeight:600, color:T.text3, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>
 Recent Entries
 </div>
 {displayEntries.map((entry, i) => {
 const entryDate = new Date(entry.timestamp);
 const isEntryToday = entry._date === today;
 const dateLabel = isEntryToday ? 'Today' : 
 entry._date === subtractDays(today, 1) ? 'Yesterday' :
 entryDate.toLocaleDateString('en-US', { month:'short', day:'numeric' });

 return (
 <div key={entry.id || i} style={{ 
 padding:'8px 0', borderBottom: i < displayEntries.length - 1 ? `1px solid ${T.border}` : 'none',
 display:'flex', gap:'8px', alignItems:'flex-start',
 }}>
 <div style={{ flex:1 }}>
 <div style={{ fontSize:'13px', color:T.text, lineHeight:1.4, marginBottom:'4px' }}>
 {entry.text}
 </div>
 <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center' }}>
 <span style={{ fontSize:'10px', color:T.text3, fontFamily:T.mono }}>
 {dateLabel} {entry.tags?.time || ''}
 </span>
 {entry.tags?.splitDay && (
 <span style={{ fontSize:'10px', padding:'2px 6px', borderRadius:'4px', background:'rgba(255,107,53,0.08)', color:T.accent }}>
 {entry.tags.splitDay}
 </span>
 )}
 {entry.tags?.exerciseName && (
 <span style={{ fontSize:'10px', padding:'2px 6px', borderRadius:'4px', background:'rgba(78,205,196,0.08)', color:T.teal }}>
 {entry.tags.exerciseName}
 </span>
 )}
 </div>
 </div>
 <button onClick={ => handleDelete(entry.id, entry._date)} style={{
 background:'none', border:'none', cursor:'pointer', padding:'10px',
 color:T.text3, opacity:0.5, flexShrink:0, minWidth:'44px', minHeight:'44px',
 display:'flex', alignItems:'center', justifyContent:'center',
 }}>
 <X size={14} />
 </button>
 </div>
 );
 })}
 {recentEntries.length > 4 && (
 <button onClick={ => setShowAll(!showAll)} style={{
 background:'none', border:'none', color:T.teal, fontSize:'12px', cursor:'pointer',
 padding:'12px 0', width:'100%', textAlign:'center', minHeight:'44px',
 }}>
 {showAll ? 'Show less' : `Show all ${recentEntries.length} entries`}
 </button>
 )}
 </div>
 )}

 {displayEntries.length === 0 && (
 <div style={{ textAlign:'center', padding:'12px 0', color:T.text3, fontSize:'12px' }}>
 No entries yet. Journal during your workout — entries are auto-tagged with your current exercise.
 </div>
 )}
 </div>
 )}
 </GlassCard>
 );
}

// ============================================================
// TAB: TODAY
// ============================================================

function TodayTab({ profile, workout, onGenerateWorkout, onUpdateExercise, onSessionMeta, onAddXP, settings, goToSettings, nutritionConfig, calibration, onSaveBodyLog, onRemoveExercise, isGeneratingWorkout = false, restTimers = {}, onRestTimerChange }) {
 // Extract exercises from v2 format
 const exercises = workout?.exercises || (Array.isArray(workout) ? workout : null);
 const splitLabel = workout?.splitDay?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase) || 'Full Body';

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
.newExercise,
 slot: current.slot, mandatory: current.mandatory, rest: restTime, prescription: null,
 logSets: Array.from({ length: numSets }, => ({ weight: '', reps: '', rpe: '', done: false })),
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
 if (prs.length > 0 && onAddXP) onAddXP(XP_REWARDS.pr || 100, '🏆 PR! +' + (XP_REWARDS.pr || 100) + ' XP');
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
 <button key={key} onClick={ => { setSelectedSplit(key); setSelectedDayIdx(0); }}
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
 <button key={idx} onClick={ => setSelectedDayIdx(idx)}
 style={{
 padding:'10px 20px', borderRadius:'12px', border:`1px solid ${isActive ? T.teal : T.border}`,
 background: isActive ? T.tealGlow : T.bgCard, color: isActive ? T.teal : T.text2,
 fontSize:'13px', fontWeight: isActive ? 700 : 500, cursor:'pointer', transition:'all 0.2s',
 }}>
 {day.name}
 <div style={{ fontSize:'10px', color: isActive ? 'rgba(78,205,196,0.7)' : T.text3, marginTop:'2px' }}>
 {day.slots.slice(0, 4).map(s => s.charAt(0).toUpperCase + s.slice(1)).join(', ')}
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
 onClick={ => !isGeneratingWorkout && onGenerateWorkout({ forceSplit: activeSplit, forceDayIndex: selectedDayIdx })} style={{
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
 {isGeneratingWorkout ? 'Generating.' : `Generate ${activeTemplate?.days[selectedDayIdx]?.name || 'Full Body'} Workout`}
 </button>
 <p style={{ color:T.text3, fontSize:'12px', marginTop:'16px' }}>
 {activeTemplate?.name || 'Full Body'} · ~45 min · {EXERCISES.filter(e => e.phase?.[profile.phase]?.s !== 'avoid' && e.location?.[profile.location]).length} exercises available
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
 {splitLabel} · {exercises.length} exercises · {mandatory.length} mandatory
 </p>
 </div>
 <button disabled={isGeneratingWorkout} onClick={ => !isGeneratingWorkout && onGenerateWorkout} style={{
 background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:'10px',
 padding:'8px 12px', color:T.text2, fontSize:'12px', cursor: isGeneratingWorkout ? 'default' : 'pointer',
 display:'flex', alignItems:'center', gap:'4px',
 opacity: isGeneratingWorkout ? 0.5 : 1,
 }}>
 <RotateCcw size={14} /> {isGeneratingWorkout ? '.' : 'New'}
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
 <button onClick={ => setShowSummary(true)} style={{
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
 onClose={ => setShowSummary(false)}
 onSaveNotes={handleSaveSessionNotes}
 />
 )}
 </div>
 );
}

function SessionFeedbackCard({ allDone, exercises, workout, weightUnit = 'lbs', sessionRPE, durationMinutes, onSessionMeta, sessionPRCount = 0 }) {
 const [localRPE, setLocalRPE] = useState(sessionRPE || null);
 const [localDuration, setLocalDuration] = useState(durationMinutes || '');
 const [saved, setSaved] = useState(sessionRPE !== null);
 const rpeLabels = { 1:'Very Easy', 2:'Easy', 3:'Moderate', 4:'Somewhat Hard', 5:'Hard',
 6:'Harder', 7:'Very Hard', 8:'Extremely Hard', 9:'Near Max', 10:'Max Effort' };
 const rpeColor = (v) => v <= 3 ? T.success : v <= 6 ? T.teal : v <= 8 ? T.warn : T.danger;

 // ---- Compute session summary ----
 const summary = useMemo( => {
 if (!exercises) return null;
 let totalVolume = 0, setsCompleted = 0, totalSets = 0, exercisesCompleted = 0;
 const exerciseNames = [];
 const muscleGroups = new Set;
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
 const autoMinutes = workout?.startedAt ? Math.round((Date.now - workout.startedAt) / 60000) : null;
 return { totalVolume, setsCompleted, totalSets, exercisesCompleted, totalExercises: exercises.length, autoMinutes, exerciseNames, muscleGroups: [.muscleGroups] };
 }, [exercises, workout?.startedAt]);

 // ---- Compare to last session of same split ----
 const comparison = useMemo( => {
 if (!workout?.splitDay || !summary) return null;
 try {
 const todayStr = today;
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
 useEffect( => {
 if (summary?.autoMinutes && !localDuration && !durationMinutes) {
 setLocalDuration(String(summary.autoMinutes));
 }
 }, [summary?.autoMinutes]); // eslint-disable-line react-hooks/exhaustive-deps

 const handleSave = => {
 if (onSessionMeta) {
 onSessionMeta({ sessionRPE: localRPE, durationMinutes: localDuration ? Number(localDuration) : null });
 setSaved(true);
 }
 };

 const fmtVol = (v) => v >= 10000 ? `${(v/1000).toFixed(1)}k` : v.toLocaleString;

 return (
 <GlassCard style={{
 background: allDone ? 'rgba(0,230,118,0.08)' : 'rgba(255,107,53,0.08)',
 border: `1px solid ${allDone ? 'rgba(0,230,118,0.15)' : 'rgba(255,107,53,0.15)'}`,
 textAlign: 'center', marginTop: '16px',
 }}>
 <div style={{ fontSize:'24px', marginBottom:'8px' }}>{allDone ? '🎉' : '💪'}</div>
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
 { label: 'Duration', value: summary.autoMinutes ? `${summary.autoMinutes}` : '—', sub: summary.autoMinutes ? 'min' : '' },
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
 {comparison.volDelta >= 0 ? '↑' : '↓'} {Math.abs(comparison.volPct)}% volume
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
 <button key={v} onClick={ => setLocalRPE(v)} style={{
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
 Duration (minutes){summary?.autoMinutes ? ' · auto-tracked' : ''}
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

function WorkoutSummaryModal({ exercises, workout, weightUnit = 'lbs', sessionPRCount = 0, onClose, onSaveNotes }) {
 const dialogRef = useRef(null);
 const [sessionNotes, setSessionNotes] = useState(workout?.sessionNotes || '');

 useEffect( => {
 const el = dialogRef.current;
 if (!el) return;
 const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
 focusable[0]?.focus;
 }, []);

 const summary = useMemo( => {
 if (!exercises) return null;
 let totalVolume = 0, warmupVolume = 0, setsCompleted = 0, totalSets = 0, exercisesCompleted = 0;
 const muscleGroups = new Set;
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
 const autoMinutes = workout?.startedAt ? Math.round((Date.now - workout.startedAt) / 60000) : null;
 const durationMin = workout?.durationMinutes || autoMinutes;
 return { totalVolume, warmupVolume, setsCompleted, totalSets, exercisesCompleted, totalExercises: exercises.length, muscleGroups: [.muscleGroups], exerciseNames, durationMin };
 }, [exercises, workout]);

 if (!summary) return null;

 const fmtVol = (v) => v >= 10000 ? `${(v/1000).toFixed(1)}k` : v.toLocaleString;

 const muscleColors = {
 chest: T.accent, back: T.teal, shoulders: '#B39DDB', triceps: '#FF8A65',
 biceps: '#4FC3F7', legs: T.success, core: T.warn, glutes: '#F06292',
 forearms: '#A1887F', 'front_delts': '#B39DDB', 'rear_delts': '#B39DDB',
 };

 const handleClose = => {
 if (sessionNotes.trim && onSaveNotes) onSaveNotes(sessionNotes.trim);
 onClose;
 };

 return (
 <div onClick={handleClose} onKeyDown={(e) => { if (e.key === 'Escape') handleClose; }}
 style={{
 position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.7)',
 backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
 display:'flex', alignItems:'center', justifyContent:'center', padding:'20px',
 animation:'fadeIn 0.3s ease-out',
 }}>
 <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Workout Summary"
 onClick={e => e.stopPropagation} style={{
 width:'100%', maxWidth:'400px', maxHeight:'85vh', overflow:'auto',
 borderRadius:'24px', background:`linear-gradient(180deg, rgba(15,15,30,0.98), rgba(7,7,14,0.98))`,
 border:`1px solid ${T.border}`, boxShadow:'0 32px 64px rgba(0,0,0,0.6)',
 padding: '32px 24px',
 }}>

 {/* Header */}
 <div style={{ textAlign:'center', marginBottom:'24px' }}>
 <div style={{ fontSize:'48px', marginBottom:'8px', animation:'pulse 0.6s ease-out' }}>
 {sessionPRCount > 0 ? '🏆' : '🎉'}
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
 { label:'Duration', value: summary.durationMin ? `${summary.durationMin}` : '—', sub: summary.durationMin ? 'min' : '' },
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
 {stat.sub ? `${stat.sub} · ` : ''}{stat.label}
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

function WorkoutDetailModal({ date, onClose }) {
 const dialogRef = useRef(null);
 const workoutRaw = LS.get(`workout:${date}`, null);
 const workout = normalizeWorkout(workoutRaw);
 const rehabRaw = LS.get(`rehab:${date}`, null);
 const cardioRaw = LS.get(`cardio:${date}`, null);

 // Focus trap: keep focus inside modal
 useEffect( => {
 const el = dialogRef.current;
 if (!el) return;
 const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
 const first = focusable[0];
 const last = focusable[focusable.length - 1];
 first?.focus;
 const trap = (e) => {
 if (e.key !== 'Tab') return;
 if (e.shiftKey) {
 if (document.activeElement === first) { e.preventDefault; last?.focus; }
 } else {
 if (document.activeElement === last) { e.preventDefault; first?.focus; }
 }
 };
 el.addEventListener('keydown', trap);
 return => el.removeEventListener('keydown', trap);
 }, []);

 const formatted = ( => {
 try {
 const d = new Date(date + 'T12:00:00');
 return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
 } catch { return date; }
 });

 const exercises = workout?.exercises || [];
 const totalVolume = exercises.reduce((sum, ex) => {
 return sum + (ex.logSets || []).filter(s => s.done && isWorkingVolume(s)).reduce((sv, s) => sv + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0);
 }, 0);
 const totalSets = exercises.reduce((sum, ex) => sum + (ex.logSets || []).filter(s => s.done).length, 0);
 const totalSetsAll = exercises.reduce((sum, ex) => sum + (ex.logSets || []).length, 0);

 const hasAnyData = workout || rehabRaw || cardioRaw;

 return (
 <div onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose; }} style={{
 position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.6)',
 backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
 display:'flex', alignItems:'center', justifyContent:'center', padding:'20px',
 animation:'fadeIn 0.2s ease-out',
 }}>
 <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Workout details for ${formatted}`} onClick={e => e.stopPropagation} style={{
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
 {totalVolume.toLocaleString} vol
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
 {s.weight || '—'}
 </div>
 <div style={{ color: s.done ? T.text : T.text3, fontFamily:T.mono, opacity: s.done ? 1 : 0.4 }}>
 {s.reps || '—'}
 </div>
 <div style={{ color: s.done ? T.text : T.text3, fontFamily:T.mono, opacity: s.done ? 1 : 0.4 }}>
 {s.rpe || '—'}
 </div>
 </React.Fragment>
 ))}
 </div>
 {doneSets.length > 0 && (
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'6px', fontFamily:T.mono }}>
 Vol: {doneSets.filter(s => isWorkingVolume(s)).reduce((v,s) => v + (parseFloat(s.weight)||0)*(parseInt(s.reps)||0), 0).toLocaleString}
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
 {cardioRaw.duration && <span> — {cardioRaw.duration} min</span>}
 {cardioRaw.distance && <span> — {cardioRaw.distance} mi</span>}
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
// TAB: REHAB
// ============================================================

function RehabTab({ rehabStatus, onToggle }) {
 const completed = DAILY_REHAB.filter(r => rehabStatus[r.id]).length;
 const total = DAILY_REHAB.length;
 const allDone = completed === total;

 return (
 <div style={{ animation:'fadeIn 0.3s ease-out' }}>
 <div style={{ marginBottom:'20px' }}>
 <h2 style={{ fontSize:'20px', fontWeight:700, letterSpacing:'-0.02em' }}>Daily Rehab Protocol</h2>
 <p style={{ fontSize:'13px', color:T.text2, marginTop:'4px' }}>
 Do these every day. Consistency is the medicine.
 </p>
 <p style={{ fontSize:'11px', color:T.text3, marginTop:'4px', fontStyle:'italic' }}>
 These are separate from the rehab exercises in your workout. This checklist covers daily mobility and corrective work.
 </p>
 </div>

 {/* Progress ring */}
 <GlassCard animate={false} style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'16px' }}>
 <div style={{ position:'relative', width:52, height:52 }}>
 <CircularTimer duration={total} timeLeft={total-completed} size={52} strokeWidth={4} />
 <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
 fontSize:'14px', fontWeight:700, color: allDone ? T.success : T.text }}>
 {completed}/{total}
 </span>
 </div>
 <div>
 <div style={{ fontSize:'14px', fontWeight:600, color: allDone ? T.success : T.text }}>
 {allDone ? 'All done! ✓' : `${total - completed} remaining`}
 </div>
 <div style={{ fontSize:'12px', color:T.text3 }}>+{XP_REWARDS.rehab} XP when complete</div>
 </div>
 </GlassCard>

 {DAILY_REHAB.map((item, i) => {
 const done = rehabStatus[item.id];
 return (
 <div key={item.id} onClick={ => onToggle(item.id)}
 role="checkbox" aria-checked={done} tabIndex={0}
 aria-label={`${item.name}: ${done ? 'completed' : 'not completed'}`}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault; onToggle(item.id); } }}
 style={{
 background: done ? T.successSoft : T.bgCard, border: `1px solid ${done ? 'rgba(0,230,118,0.15)' : T.border}`,
 borderRadius: T.radius, padding:'16px', marginBottom:'10px', cursor:'pointer',
 display:'flex', alignItems:'center', gap:'14px', transition:'all 0.2s',
 animation: `fadeUp 0.3s ease-out ${i * 0.06}s both`,
 }}>
 <div style={{
 width:28, height:28, borderRadius:'50%',
 border:`2px solid ${done ? T.success : T.text3}`,
 background: done ? T.success : 'transparent',
 display:'flex', alignItems:'center', justifyContent:'center',
 transition:'all 0.2s', flexShrink:0,
 }}>
 {done && <Check size={14} color="#07070E" strokeWidth={3} />}
 </div>
 <div style={{ flex:1 }}>
 <div style={{ fontSize:'14px', fontWeight:600, color: done ? T.success : T.text }}>{item.name}</div>
 <div style={{ fontSize:'12px', color:T.text3, marginTop:'2px' }}>{item.detail}</div>
 </div>
 </div>
 );
 })}
 </div>
 );
}

// ============================================================
// TAB: CARDIO
// ============================================================

function CardioTab({ cardioLog, onLogCardio, settings, goToSettings }) {
 const [duration, setDuration] = useState(30);
 const [hr, setHr] = useState('');
 const hrMin = settings?.zone2HRMin || 120;
 const hrMax = settings?.zone2HRMax || 145;
 const weeklyTarget = settings?.cardioWeeklyTarget || 5;
 const weekLogs = cardioLog.filter(l => {
 const d = new Date(l.date);
 const now = new Date;
 const diff = (now - d) / (1000*60*60*24);
 return diff < 7;
 });

 return (
 <div style={{ animation:'fadeIn 0.3s ease-out' }}>
 <div style={{ marginBottom:'20px' }}>
 <h2 style={{ fontSize:'20px', fontWeight:700 }}>Cardio</h2>
 <p style={{ fontSize:'13px', color:T.text2, marginTop:'4px' }}>
 Zone 2 · <button onClick={ => goToSettings?.('recovery')} style={{ background:'none', border:'none',
 color:T.text2, cursor:'pointer', fontSize:'13px', padding:0, textDecoration:'underline',
 textDecorationStyle:'dotted', textUnderlineOffset:'3px' }}>{hrMin}-{hrMax} bpm</button> · <button
 onClick={ => goToSettings?.('recovery')} style={{ background:'none', border:'none', color:T.text2,
 cursor:'pointer', fontSize:'13px', padding:0, textDecoration:'underline', textDecorationStyle:'dotted',
 textUnderlineOffset:'3px' }}>{weeklyTarget}×/week</button> 
 </p>
 </div>

 {/* Weekly progress */}
 <GlassCard animate={false} style={{ marginBottom:'16px', textAlign:'center' }}>
 <div style={{ fontSize:'12px', color:T.text3, marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
 This Week
 </div>
 <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginBottom:'8px' }}>
 {Array.from({length: weeklyTarget}, (_, i) => (
 <div key={i} style={{
 width:32, height:32, borderRadius:'50%',
 background: i < weekLogs.length ? T.teal : 'rgba(255,255,255,0.04)',
 border: `2px solid ${i < weekLogs.length ? T.teal : T.border}`,
 display:'flex', alignItems:'center', justifyContent:'center',
 fontSize:'12px', fontWeight:600, color: i < weekLogs.length ? '#07070E' : T.text3,
 transition:'all 0.3s',
 }}>
 {i < weekLogs.length ? '✓' : i+1}
 </div>
 ))}
 </div>
 <div style={{ fontSize:'13px', color: weekLogs.length >= weeklyTarget ? T.success : T.text2 }}>
 {weekLogs.length}/{weeklyTarget} sessions
 </div>
 </GlassCard>

 {/* Duration / HR inputs */}
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
 <GlassCard animate={false} style={{ padding:'12px' }}>
 <div style={{ fontSize:'10px', color:T.text3, textTransform:'uppercase', marginBottom:'6px' }}>Duration</div>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <button onClick={ => setDuration(d => Math.max(10, d-5))} aria-label="Decrease duration by 5 minutes" style={{ background:'none', border:'none', color:T.text2, cursor:'pointer', padding:'10px', minWidth:'44px', minHeight:'44px', display:'flex', alignItems:'center', justifyContent:'center' }}><Minus size={18} /></button>
 <span style={{ fontSize:'20px', fontWeight:700, fontFamily:T.mono, flex:1, textAlign:'center' }} aria-live="polite">{duration}</span>
 <button onClick={ => setDuration(d => Math.min(90, d+5))} aria-label="Increase duration by 5 minutes" style={{ background:'none', border:'none', color:T.text2, cursor:'pointer', padding:'10px', minWidth:'44px', minHeight:'44px', display:'flex', alignItems:'center', justifyContent:'center' }}><Plus size={18} /></button>
 </div>
 <div style={{ fontSize:'10px', color:T.text3, textAlign:'center' }}>minutes</div>
 </GlassCard>
 <GlassCard animate={false} style={{ padding:'12px' }}>
 <div style={{ fontSize:'10px', color:T.text3, textTransform:'uppercase', marginBottom:'6px' }}>Avg HR</div>
 <input type="number" inputMode="numeric" placeholder="bpm" value={hr}
 onChange={e => setHr(e.target.value)} aria-label="Average heart rate (BPM)"
 style={{ width:'100%', background:'transparent', border:'none', textAlign:'center',
 fontSize:'20px', fontWeight:700, fontFamily:T.mono, color:T.text, outline:'none' }} />
 <div style={{ fontSize:'10px', color:T.text3, textAlign:'center' }}>
 {hr && hr >= hrMin && hr <= hrMax ? '✓ Zone 2' : hr ? '⚠ Check zone' : 'bpm'}
 </div>
 </GlassCard>
 </div>

 {/* Cardio options */}
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
 {CARDIO_OPTIONS.map((c, i) => (
 <button key={c.id} onClick={ => onLogCardio(c, duration, hr)}
 style={{
 background: T.bgCard, border:`1px solid ${T.border}`, borderRadius:T.radius,
 padding:'16px 12px', textAlign:'left', cursor:'pointer', transition:'all 0.2s',
 animation: `fadeUp 0.3s ease-out ${i * 0.06}s both`,
 }}
 onMouseDown={e => e.currentTarget.style.transform='scale(0.97)'}
 onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
 onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
 >
 <div style={{ fontSize:'20px', marginBottom:'6px' }}>{c.icon}</div>
 <div style={{ fontSize:'13px', fontWeight:600, color:T.text, marginBottom:'2px' }}>{c.name}</div>
 <div style={{ fontSize:'11px', color:T.text3 }}>{c.settings}</div>
 </button>
 ))}
 </div>
 </div>
 );
}

// ============================================================
// TAB: PROGRESS
// ============================================================

// ============================================================
// VOLUME TRACKER COMPONENT
// ============================================================

function VolumeTracker({ history, settings }) {
 const [expandedMuscle, setExpandedMuscle] = useState(null);

 // Compute weekly completed sets per primaryMuscleGroup
 const weeklyVolume = useMemo( => {
 const volume = {};
 const now = new Date;
 const firstDay = settings?.firstDayOfWeek ?? 0;
 const weekStart = new Date(now);
 const currentDay = weekStart.getDay;
 const daysBack = (currentDay - firstDay + 7) % 7;
 weekStart.setDate(weekStart.getDate - daysBack);
 weekStart.setHours(0, 0, 0, 0);

 const keys = LS.keys('workout:');
 for (const key of keys) {
 const dateStr = key.replace('workout:', '');
 const date = new Date(dateStr);
 if (date < weekStart) continue;

 const raw = LS.get(key, null);
 const exercises = getWorkoutExercises(raw);
 for (const ex of exercises) {
 const doneSets = (ex.logSets || []).filter(s => s.done && isWorkingVolume(s));
 if (doneSets.length === 0) continue;

 const muscle = ex.primaryMuscleGroup || ex.category;
 if (!volume[muscle]) volume[muscle] = { total: 0, byPattern: {} };
 volume[muscle].total += doneSets.length;

 if (ex.movementPattern) {
 if (!volume[muscle].byPattern[ex.movementPattern]) volume[muscle].byPattern[ex.movementPattern] = 0;
 volume[muscle].byPattern[ex.movementPattern] += doneSets.length;
 }
 }
 }
 return volume;
 }, [history, settings]);

 const muscleGroups = Object.keys(VOLUME_LANDMARKS).filter(m => m !== 'shoulders'); // front delts usually covered by pressing

 const getZoneColor = (sets, landmark) => {
 if (sets <= 0) return T.text3;
 if (sets < landmark.mv) return T.text3; // Below MV
 if (sets < landmark.mev) return T.warn; // MV-MEV (maintaining)
 if (sets <= landmark.mavHigh) return T.success; // MEV-MAV (optimal)
 if (sets <= landmark.mrv) return T.accent; // MAV-MRV (high volume)
 return T.danger; // Above MRV
 };

 const getZoneLabel = (sets, landmark) => {
 if (sets <= 0) return 'None';
 if (sets < landmark.mv) return 'Below MV';
 if (sets < landmark.mev) return 'Maintaining';
 if (sets <= landmark.mavHigh) return 'Optimal';
 if (sets <= landmark.mrv) return 'High';
 return 'Over MRV';
 };

 return (
 <div style={{ marginBottom: '20px' }}>
 <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
 <Target size={16} color={T.teal} /> Weekly Volume
 </h3>
 <GlassCard animate={false} style={{ padding: '12px' }}>
 {/* Legend */}
 <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '12px', fontSize: '9px', color: T.text3 }}>
 <span>● Below MV</span>
 <span style={{ color: T.warn }}>● Maintaining</span>
 <span style={{ color: T.success }}>● Optimal</span>
 <span style={{ color: T.accent }}>● High</span>
 <span style={{ color: T.danger }}>● Over MRV</span>
 </div>

 {muscleGroups.map(muscle => {
 const landmark = getAdjustedLandmarks(muscle, settings?.experienceLevel || 'intermediate');
 if (!landmark) return null;
 const vol = weeklyVolume[muscle] || { total: 0, byPattern: {} };
 const sets = vol.total;
 const maxBar = landmark.mrv + 4;
 const barPct = Math.min((sets / maxBar) * 100, 100);
 const mevPct = (landmark.mev / maxBar) * 100;
 const mavHighPct = (landmark.mavHigh / maxBar) * 100;
 const mrvPct = (landmark.mrv / maxBar) * 100;
 const color = getZoneColor(sets, landmark);
 const hasSubgroups = landmark.subgroups && Object.keys(vol.byPattern).length > 0;
 const isExpanded = expandedMuscle === muscle;

 return (
 <div key={muscle} style={{ marginBottom: '6px' }}>
 <div
 onClick={ => hasSubgroups && setExpandedMuscle(isExpanded ? null : muscle)}
 style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: hasSubgroups ? 'pointer' : 'default', padding: '4px 0' }}
 >
 <div style={{ width: '72px', fontSize: '11px', fontWeight: 600, color: T.text2, textTransform: 'capitalize', flexShrink: 0 }}>
 {muscle.replace(/_/g, ' ')}
 {hasSubgroups && <ChevronRight size={10} style={{ marginLeft: 2, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />}
 </div>
 <div style={{ flex: 1, height: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '7px', overflow: 'hidden', position: 'relative' }}>
 {/* Zone markers */}
 <div style={{ position: 'absolute', left: `${mevPct}%`, top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.1)' }} />
 <div style={{ position: 'absolute', left: `${mavHighPct}%`, top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.1)' }} />
 <div style={{ position: 'absolute', left: `${mrvPct}%`, top: 0, bottom: 0, width: '1px', background: 'rgba(255,82,82,0.2)' }} />
 {/* Filled bar */}
 <div style={{
 height: '100%', width: `${barPct}%`, borderRadius: '7px',
 background: color, opacity: 0.7, transition: 'width 0.4s ease-out',
 }} />
 </div>
 <div style={{ width: '40px', fontSize: '11px', fontFamily: T.mono, color, textAlign: 'right', fontWeight: 600 }}>
 {sets}
 </div>
 </div>
 {/* Subgroup breakdown */}
 {isExpanded && landmark.subgroups && (
 <div style={{ paddingLeft: '80px', animation: 'fadeUp 0.2s ease-out' }}>
 {Object.entries(landmark.subgroups).map(([pattern, info]) => {
 const subSets = vol.byPattern[pattern] || 0;
 const targetSets = info.targetPct ? Math.round(sets * info.targetPct) : (info.fixed || 0);
 return (
 <div key={pattern} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 0' }}>
 <span style={{ width: '90px', fontSize: '10px', color: T.text3, textTransform: 'capitalize' }}>
 {pattern.replace(/_/g, ' ')}
 </span>
 <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
 <div style={{ height: '100%', width: `${targetSets > 0 ? Math.min((subSets / targetSets) * 100, 150) : 0}%`,
 background: T.teal, opacity: 0.6, borderRadius: '3px' }} />
 </div>
 <span style={{ fontSize: '10px', fontFamily: T.mono, color: T.text3, width: '24px', textAlign: 'right' }}>{subSets}</span>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
 })}
 </GlassCard>
 </div>
 );
}

// ============================================================
// PER-EXERCISE STRENGTH PROGRESS CHART
// ============================================================

function ExerciseProgressChart({ settings }) {
 const [selectedExId, setSelectedExId] = useState(null);
 const [hoverIdx, setHoverIdx] = useState(null);
 const wUnit = settings?.weightUnit || 'lbs';

 // Build a list of exercises the user has history for, sorted by most recently trained
 const exerciseList = useMemo( => {
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
 const chartData = useMemo( => {
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
 }).reverse; // Chronological order
 }, [selectedExId]);

 // All-time stats
 const stats = useMemo( => {
 if (chartData.length === 0) return null;
 return {
 bestWeight: Math.max(.chartData.map(d => d.maxWeight)),
 bestE1RM: Math.max(.chartData.map(d => d.bestE1RM)),
 bestVolume: Math.max(.chartData.map(d => d.totalVolume)),
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
 const allYVals = [.weights,.e1rms].filter(v => v > 0);
 const minY = allYVals.length > 0 ? Math.floor(Math.min(.allYVals) * 0.9) : 0;
 const maxY = allYVals.length > 0 ? Math.ceil(Math.max(.allYVals) * 1.05) : 100;
 const yRange = maxY - minY || 1;
 const maxVol = Math.max(.volumes, 1);

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
 Max: {data[0].maxWeight} {wUnit} · e1RM: {data[0].bestE1RM} {wUnit} · Vol: {data[0].totalVolume.toLocaleString}
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
 onMouseLeave={ => setHoverIdx(null)} onTouchEnd={ => setHoverIdx(null)}>

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
 onMouseEnter={ => setHoverIdx(i)}
 onTouchStart={ => setHoverIdx(i)}
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
 onMouseEnter={ => setHoverIdx(i)}
 onTouchStart={ => setHoverIdx(i)}
 style={{ cursor:'pointer' }} />
 {d.bestE1RM > 0 && (
 <circle cx={xPos(i)} cy={yPos(d.bestE1RM)} r="3"
 fill={T.teal} stroke={T.bg} strokeWidth="1"
 onMouseEnter={ => setHoverIdx(i)}
 onTouchStart={ => setHoverIdx(i)}
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
 {hoverIdx !== null && data[hoverIdx] && ( => {
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
 Vol: {d.totalVolume.toLocaleString} · {d.sets} sets
 </text>
 <text x={tx} y={PAD.top + 32} fill={T.text3} fontSize="8" fontFamily={T.mono} textAnchor="middle">
 {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'2-digit' })}
 </text>
 </g>
 );
 })}
 </svg>
 </>
 )}

 {/* Stats summary */}
 {stats && data.length >= 2 && (
 <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginTop:'12px' }}>
 {[
 { label:'Best Weight', value:`${stats.bestWeight}`, sub:wUnit, color:T.accent },
 { label:'Best e1RM', value:`${stats.bestE1RM}`, sub:wUnit, color:T.teal },
 { label:'Best Volume', value: stats.bestVolume >= 10000 ? `${(stats.bestVolume/1000).toFixed(1)}k` : stats.bestVolume.toLocaleString, sub:wUnit, color:T.text2 },
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

// ============================================================
// MUSCLE BALANCE CARD
// ============================================================

function MuscleBalanceCard({ settings }) {
 const [expanded, setExpanded] = useState(false);

 const analysis = useMemo( => {
 const vol = computeWeightedMuscleVolume(settings);
 return { weighted: vol,.analyzeMuscleBalance(vol) };
 }, [settings]);

 const imbalanceCount = analysis.pairs.filter(p => !p.balanced).length + analysis.undertrained.length;
 const hasData = analysis.pairs.some(p => p.valA > 0 || p.valB > 0);

 if (!hasData) return null;

 return (
 <div style={{ marginBottom: '20px' }}>
 <div
 onClick={ => setExpanded(!expanded)}
 style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '10px' }}
 >
 <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
 🎯 Muscle Balance
 {imbalanceCount > 0 && (
 <span style={{
 fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
 background: T.warnSoft, color: T.warn,
 }}>
 {imbalanceCount} imbalance{imbalanceCount > 1 ? 's' : ''}
 </span>
 )}
 {imbalanceCount === 0 && (
 <span style={{
 fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
 background: T.successSoft, color: T.success,
 }}>
 Balanced
 </span>
 )}
 </h3>
 <ChevronDown size={16} color={T.text3} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
 </div>

 {expanded && (
 <GlassCard animate={false} style={{ padding: '12px' }}>
 {analysis.pairs.map(pair => {
 const total = pair.valA + pair.valB;
 if (total === 0) return null;
 const pctA = total > 0 ? (pair.valA / total) * 100 : 50;
 const barColor = pair.balanced ? T.success : T.warn;

 return (
 <div key={pair.name} style={{ marginBottom: '10px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
 <span style={{ fontSize: '11px', fontWeight: 600, color: T.text2 }}>{pair.labelA}</span>
 <span style={{ fontSize: '9px', color: pair.balanced ? T.text3 : T.warn, fontFamily: T.mono }}>
 {pair.valA} : {pair.valB}{!pair.balanced && pair.ratio !== Infinity ? ` (${pair.ratio}:1)` : !pair.balanced ? ' (∞)' : ''}
 </span>
 <span style={{ fontSize: '11px', fontWeight: 600, color: T.text2 }}>{pair.labelB}</span>
 </div>
 {/* Balance bar */}
 <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden' }}>
 {/* Left side (A) */}
 <div style={{
 position: 'absolute', left: 0, top: 0, bottom: 0,
 width: `${pctA}%`, borderRadius: '4px 0 0 4px',
 background: pair.dominant === 'A' && !pair.balanced
 ? `linear-gradient(90deg, ${barColor}, ${barColor}88)` : `linear-gradient(90deg, ${T.teal}88, ${T.teal}44)`,
 transition: 'width 0.4s ease-out',
 }} />
 {/* Right side (B) */}
 <div style={{
 position: 'absolute', right: 0, top: 0, bottom: 0,
 width: `${100 - pctA}%`, borderRadius: '0 4px 4px 0',
 background: pair.dominant === 'B' && !pair.balanced
 ? `linear-gradient(270deg, ${barColor}, ${barColor}88)` : `linear-gradient(270deg, ${T.teal}88, ${T.teal}44)`,
 transition: 'width 0.4s ease-out',
 }} />
 {/* Center marker */}
 <div style={{ position: 'absolute', left: '50%', top: '-1px', bottom: '-1px', width: '2px', background: 'rgba(255,255,255,0.15)', transform: 'translateX(-1px)' }} />
 </div>
 {/* Recommendation */}
 {!pair.balanced && pair.recommendation && (
 <div style={{ fontSize: '10px', color: T.warn, marginTop: '4px', lineHeight: 1.4, paddingLeft: '4px' }}>
 ⚠ {pair.recommendation}
 </div>
 )}
 </div>
 );
 })}

 {/* Undertrained standalone muscles */}
 {analysis.undertrained.map(u => (
 <div key={u.muscle} style={{ marginBottom: '6px', padding: '6px 8px', background: T.warnSoft, borderRadius: T.radiusSm }}>
 <div style={{ fontSize: '11px', fontWeight: 600, color: T.warn }}>{u.muscle}: {u.weightedSets} weighted sets</div>
 <div style={{ fontSize: '10px', color: T.text2, marginTop: '2px' }}>⚠ {u.recommendation}</div>
 </div>
 ))}
 </GlassCard>
 )}
 </div>
 );
}

function ProgressTab({ profile, history, goToSettings, coachEnabled, settings, coachCfg, nutritionConfig, onUpdateNutritionConfig, goToToday }) {
 const [historyDetailDate, setHistoryDetailDate] = useState(null);
 const level = LEVELS.find((l, i) => (LEVELS[i+1]?.xp || Infinity) > profile.xp) || LEVELS[0];
 const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];
 const xpInLevel = profile.xp - level.xp;
 const xpForNext = nextLevel ? nextLevel.xp - level.xp : 1;
 const progressPct = nextLevel ? Math.min((xpInLevel / xpForNext) * 100, 100) : 100;

 const recentMuscles = useMemo( => {
 const muscleHours = {};
 const now = Date.now;
 const keys = LS.keys('workout:');
 const sortedKeys = keys.sort((a, b) => b.localeCompare(a));
 for (const key of sortedKeys) {
 const dateStr = key.replace('workout:', '');
 const date = new Date(dateStr + 'T12:00:00');
 const hoursSince = (now - date.getTime) / (1000 * 60 * 60);
 if (hoursSince > 168) break;
 const raw = LS.get(key, null);
 const exercises = getWorkoutExercises(raw);
 for (const ex of exercises) {
 const doneSets = (ex.logSets || []).filter(s => s.done);
 if (doneSets.length === 0) continue;
 const muscle = ex.primaryMuscleGroup || ex.category;
 if (muscle && !(muscle in muscleHours)) muscleHours[muscle] = hoursSince;
 for (const sec of (ex.secondaryMuscleGroups || [])) {
 if (sec && !(sec in muscleHours)) muscleHours[sec] = hoursSince;
 }
 }
 }
 return muscleHours;
 }, [history]);

 // Lift body log loading to avoid redundant localStorage reads in every chart component
 const bodyLogs = useMemo( => loadBodyLogs, []);
 const allBodyLogs = useMemo( => loadAllBodyLogs, []);

 return (
 <div style={{ animation:'fadeIn 0.3s ease-out' }}>
 {/* Level card */}
 <GlassCard style={{
 background: `linear-gradient(135deg, rgba(255,107,53,0.08), rgba(78,205,196,0.05))`,
 textAlign:'center', marginBottom:'16px', padding:'24px 16px',
 }}>
 <div style={{ fontSize:'48px', fontWeight:800, background:`linear-gradient(135deg, ${T.accent}, ${T.teal})`,
 WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', lineHeight:1 }}>
 {level.level}
 </div>
 <div style={{ fontSize:'16px', fontWeight:600, marginTop:'4px' }}>{level.name}</div>
 <div style={{ fontSize:'13px', color:T.text2, marginTop:'2px' }}>{profile.xp.toLocaleString} XP</div>
 
 {/* XP bar */}
 <div style={{ marginTop:'16px', background:'rgba(255,255,255,0.06)', height:'6px',
 borderRadius:'3px', overflow:'hidden' }}>
 <div style={{ width:`${progressPct}%`, height:'100%',
 background:`linear-gradient(90deg, ${T.accent}, ${T.teal})`,
 transition:'width 0.5s ease-out', borderRadius:'3px' }} />
 </div>
 {nextLevel && (
 <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px', fontSize:'11px', color:T.text3 }}>
 <span>Lvl {level.level}</span>
 <span>{nextLevel.xp - profile.xp} XP to Lvl {nextLevel.level}</span>
 </div>
 )}
 </GlassCard>

 {/* Stats row */}
 <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'16px' }}>
 {[
 { label:'Streak', value: profile.streak, icon:<Flame size={18} color={profile.streak > 0 ? T.accent : T.text3} />, color: profile.streak > 0 ? T.accent : T.text3 },
 { label:'Workouts', value: Object.values(history).filter(a => a.includes('workout')).length, icon:<Dumbbell size={18} color={T.teal} />, color:T.teal },
 { label:'Active Days', value: Object.keys(history).length, icon:<Activity size={18} color={T.success} />, color:T.success },
 ].map((s,i) => (
 <GlassCard key={i} animate={false} style={{ textAlign:'center', padding:'14px 8px' }}>
 <div style={{ marginBottom:'6px' }}>{s.icon}</div>
 <div style={{ fontSize:'20px', fontWeight:700, color:s.color, fontFamily:T.mono }}>{s.value}</div>
 <div style={{ fontSize:'10px', color:T.text3, textTransform:'uppercase', letterSpacing:'0.5px' }}>{s.label}</div>
 </GlassCard>
 ))}
 </div>

 {/* Calendar */}
 <h3 style={{ fontSize:'15px', fontWeight:600, marginBottom:'12px' }}>Consistency</h3>
 <CalendarHeatmap history={history} onDayClick={setHistoryDetailDate} />
 {historyDetailDate && <WorkoutDetailModal date={historyDetailDate} onClose={ => setHistoryDetailDate(null)} />}

 {/* Weekly Check-In */}
 {onUpdateNutritionConfig && (
 <WeeklyCheckInCard nutritionConfig={nutritionConfig} onUpdateNutritionConfig={onUpdateNutritionConfig} settings={settings} allBodyLogs={allBodyLogs} />
 )}

 {/* Weight Trend Chart */}
 <WeightTrendChart settings={settings} nutritionConfig={nutritionConfig} goToToday={goToToday} bodyLogs={bodyLogs} />

 {/* Body Fat Chart */}
 <BodyFatChart settings={settings} nutritionConfig={nutritionConfig} goToToday={goToToday} allBodyLogs={allBodyLogs} />

 {/* Nutrition Chart */}
 <NutritionChart nutritionConfig={nutritionConfig} goToToday={goToToday} allBodyLogs={allBodyLogs} />

 {/* TDEE Trend Chart */}
 <TDEETrendChart nutritionConfig={nutritionConfig} />

 {/* Waist Chart */}
 <WaistChart settings={settings} nutritionConfig={nutritionConfig} allBodyLogs={allBodyLogs} />

 {/* Multi-Metric Overlay */}
 <MultiMetricOverlay settings={settings} nutritionConfig={nutritionConfig} allBodyLogs={allBodyLogs} bodyLogs={bodyLogs} />

 {/* Volume Tracker */}
 <VolumeTracker history={history} settings={settings} />

 {/* Exercise Strength Progress */}
 <ExerciseProgressChart settings={settings} />

 {/* Muscle Balance */}
 <MuscleBalanceCard settings={settings} />

 {/* Muscle Map */}
 <h3 style={{ fontSize:'15px', fontWeight:600, margin:'20px 0 12px' }}>Muscle Coverage</h3>
 <GlassCard animate={false}>
 <MuscleMap recentMuscles={recentMuscles} />
 <div style={{ display:'flex', gap:'12px', justifyContent:'center', marginTop:'12px', fontSize:'10px' }}>
 <span style={{ color:T.success }}>● &lt;48hr</span>
 <span style={{ color:T.warn }}>● 48-96hr</span>
 <span style={{ color:T.danger }}>● &gt;96hr</span>
 <span style={{ color:T.text3 }}>● Never</span>
 </div>
 </GlassCard>

 {/* AI Reports */}
 {settings?.reportsEnabled && (
 <ProgressReports profile={profile} history={history} settings={settings || {}}
 coachCfg={coachCfg || {}} goToSettings={goToSettings} />
 )}

 {/* Quick Settings Link */}
 <button onClick={ => goToSettings?.('training')} style={{
 width:'100%', padding:'14px 16px', background:T.bgCard, border:`1px solid ${T.border}`,
 borderRadius:T.radius, cursor:'pointer', display:'flex', alignItems:'center', gap:'12px',
 marginTop:'16px', transition:'all 0.2s',
 }}>
 <Settings size={18} color={T.text3} />
 <div style={{ flex:1, textAlign:'left' }}>
 <div style={{ fontSize:'14px', fontWeight:600, color:T.text }}>Settings</div>
 <div style={{ fontSize:'11px', color:T.text3, marginTop:'1px' }}>
 {profile.phase} · {profile.location} · units, timers, recovery{coachEnabled ? ', AI coach' : ''}{settings?.reportsEnabled ? ', reports' : ''}
 </div>
 </div>
 <ChevronRight size={16} color={T.text3} />
 </button>
 </div>
 );
}

// ============================================================
// TAB: COACH — Multi-Provider LLM with Full Settings
// ============================================================

const DEFAULT_SYSTEM_PROMPT = `You are a fitness and mobility coach. Be concise (<120 words unless asked for detail). Reference clinical context when relevant. Never recommend exercises that conflict with any listed precautions.`;

const DEFAULT_PATIENT_PROFILE = `PATIENT: [Configure in settings]
DX: [Add diagnoses in settings]
GENETICS: [Add genetic markers in settings]
PRECAUTIONS: [Configure based on your conditions]
SUBS: [Configure based on your precautions]`;

// --- Provider / Model Registry ---

const PROVIDERS = {
 anthropic: {
 name: 'Anthropic',
 models: [
 { id:'claude-haiku-4-5-20251001', label:'Haiku 4.5', cost:{in:0.80,out:4.00,cached:0.08} },
 { id:'claude-sonnet-4-5-20250929', label:'Sonnet 4.5', cost:{in:3.00,out:15.00,cached:0.30} },
 { id:'claude-opus-4-6', label:'Opus 4.6', cost:{in:15.00,out:75.00,cached:1.50} },
 ],
 keyPlaceholder: 'sk-ant-.',
 },
 openrouter: {
 name: 'OpenRouter',
 models: [
 { id:'anthropic/claude-haiku-4-5-20251001', label:'Haiku 4.5', cost:{in:0.80,out:4.00,cached:0.08} },
 { id:'anthropic/claude-sonnet-4-5-20250929', label:'Sonnet 4.5', cost:{in:3.00,out:15.00,cached:0.30} },
 { id:'anthropic/claude-opus-4-6', label:'Opus 4.6', cost:{in:15.00,out:75.00,cached:1.50} },
 { id:'google/gemini-2.5-flash-preview', label:'Gemini 2.5 Flash', cost:{in:0.15,out:0.60,cached:0.04} },
 { id:'google/gemini-2.5-pro-preview', label:'Gemini 2.5 Pro', cost:{in:1.25,out:10.00,cached:0.31} },
 { id:'deepseek/deepseek-chat-v3-0324', label:'DeepSeek V3', cost:{in:0.27,out:1.10,cached:0.07} },
 { id:'meta-llama/llama-4-maverick', label:'Llama 4 Maverick', cost:{in:0.20,out:0.60,cached:0.05} },
 { id:'__custom__', label:'Other', cost:{in:0,out:0,cached:0} },
 ],
 keyPlaceholder: 'sk-or-.',
 },
 gemini: {
 name: 'Google Gemini',
 models: [
 { id:'gemini-2.5-flash-preview-05-20', label:'Gemini 2.5 Flash', cost:{in:0.15,out:0.60,cached:0.04} },
 { id:'gemini-2.5-pro-preview-05-06', label:'Gemini 2.5 Pro', cost:{in:1.25,out:10.00,cached:0.31} },
 ],
 keyPlaceholder: 'AIza.',
 },
};

const DEFAULT_COACH_CONFIG = {
 provider: 'anthropic',
 model: 'claude-haiku-4-5-20251001',
 customModel: '', // for OpenRouter "Other" option
 keys: { anthropic:'', openrouter:'', gemini:'' },
 maxHistory: 4,
 maxTokens: 250,
 temperature: 0.7,
 systemPrompt: DEFAULT_SYSTEM_PROMPT,
 patientProfile: DEFAULT_PATIENT_PROFILE,
 includePatientProfile: true,
 includeSessionContext: true,
 includeCurrentWorkout: true,
 includeRecentActivity: true,
 includeBodyMetrics: true,
};

// --- Token helpers ---

const estimateTokens = (text) => Math.ceil((text || '').length / 4);

function estimateCost(usage, modelInfo) {
 if (!usage || !modelInfo?.cost) return null;
 const r = modelInfo.cost; // rates per 1M tokens
 const cached = usage.cached || 0;
 const uncached = (usage.input || 0) - cached;
 const cost = (uncached * r.in / 1e6) + (cached * r.cached / 1e6) + ((usage.output || 0) * r.out / 1e6);
 return { cost: cost < 0.0001 ? '<$0.0001' : `$${cost.toFixed(4)}`,.usage,
 pctCached: usage.input > 0 ? Math.round((cached / usage.input) * 100) : 0 };
}

// --- Context builders ---

function buildSessionContext(profile, workout, rehabStatus, cardioLog, history, cfg) {
 const parts = [];

 if (cfg.includeSessionContext) {
 parts.push(`Phase:${profile.phase} Loc:${profile.location} XP:${profile.xp} Streak:${profile.streak}d`);
 }

 if (cfg.includeCurrentWorkout) {
 const wExercises = workout?.exercises || (Array.isArray(workout) ? workout : []);
 if (wExercises.length > 0) {
 const splitDay = workout?.splitDay || 'full_body';
 const summary = wExercises.map(e => {
 const sets = e.logSets || [];
 const done = sets.filter(s => s.done);
 if (done.length === 0) return e.name;
 const logged = done.map(s => `${s.weight||'?'}×${s.reps||'?'}`).join(',');
 return `${e.name}(${logged})`;
 });
 const doneCount = wExercises.filter(e => e.logSets?.every(s => s.done)).length;
 parts.push(`Today[${splitDay}][${doneCount}/${wExercises.length}]: ${summary.join('; ')}`);
 const prescriptions = wExercises.filter(e => e.prescription?.action).map(e => `${e.name.split(' ')[0]}:${e.prescription.action}`).slice(0, 5);
 if (prescriptions.length > 0) parts.push(`Rx: ${prescriptions.join(',')}`);
 const stallWarnings = wExercises.map(e => { const s = detectStall(e.id); if (s.stalled) return `${e.name.split(' ')[0]}:stalled`; if (s.fatigued) return `${e.name.split(' ')[0]}:fatigued`; return null; }).filter(Boolean);
 if (stallWarnings.length > 0) parts.push(`Alerts: ${stallWarnings.join(',')}`);
 if (workout.sessionRPE) parts.push(`SessionRPE:${workout.sessionRPE}`);
 }
 }

 if (cfg.includeSessionContext && rehabStatus && Object.keys(rehabStatus).length > 0) {
 const done = DAILY_REHAB.filter(r => rehabStatus[r.id]).map(r => r.name.split(' ')[0]);
 if (done.length > 0) parts.push(`Rehab: ${done.join(',')}`);
 }

 if (cfg.includeSessionContext && cardioLog?.length > 0) {
 const l = cardioLog[cardioLog.length - 1];
 parts.push(`Cardio: ${l.name} ${l.duration}m${l.hr ? ' HR'+l.hr : ''}`);
 }

 if (cfg.includeRecentActivity) {
 const last7 = Object.entries(history || {}).filter(([d]) =>
 (Date.now - new Date(d).getTime) / 864e5 < 7
 );
 if (last7.length > 0) {
 const wk = last7.filter(([,a]) => a.includes('workout')).length;
 const rh = last7.filter(([,a]) => a.includes('rehab')).length;
 const cd = last7.filter(([,a]) => a.includes('cardio')).length;
 parts.push(`7d: ${wk}W ${rh}R ${cd}C`);
 }
 }

 // Muscle balance summary (compact)
 try {
 const wv = computeWeightedMuscleVolume(null);
 const bal = analyzeMuscleBalance(wv);
 const balParts = bal.pairs.filter(p => p.valA > 0 || p.valB > 0)
.map(p => `${p.labelA}:${p.valA}/${p.labelB}:${p.valB}(${p.balanced ? 'OK' : 'IMBAL'})`);
 if (balParts.length > 0) parts.push(`MuscBal: ${balParts.join(', ')}`);
 } catch(e) { /* skip on error */ }

 return parts.length > 0 ? parts.join(' | ') : '';
}

function buildFullSystemPrompt(cfg) {
 let sys = cfg.systemPrompt || '';
 if (cfg.includePatientProfile && cfg.patientProfile) {
 sys += '\n\n' + cfg.patientProfile;
 }
 if (cfg.includeBodyMetrics) {
 try {
 const parts = [];
 const logs = loadBodyLogs;
 const allLogs = loadAllBodyLogs;
 const nCfg = LS.get('nutritionConfig', DEFAULT_NUTRITION_CONFIG);
 const cal = LS.get('bfCalibration', DEFAULT_CALIBRATION);
 const profile = LS.get('profile', {});
 // Weight trend (7d)
 if (logs.length >= 2) {
 const smoothed = getSmoothedWeights(logs, nCfg);
 const latest = smoothed[smoothed.length - 1];
 const cutoff7 = subtractDays(today, 7);
 const past7 = smoothed.find(s => s.date >= cutoff7);
 const wUnit = nCfg.weightUnit || 'lbs';
 if (latest && past7) {
 const delta = Math.round((latest.trend - past7.trend) * 10) / 10;
 parts.push(`Weight trend: ${past7.trend}→${latest.trend} (7d, ${delta > 0 ? '+' : ''}${delta} ${wUnit})`);
 } else if (latest) {
 parts.push(`Weight: ${latest.trend} ${wUnit}`);
 }
 }
 // TDEE
 if (nCfg.estimatedTDEE) {
 parts.push(`TDEE est: ${nCfg.estimatedTDEE} kcal (${nCfg.tdeeConfidence || 'low'} conf)`);
 }
 // Avg intake 7d
 const recentNutrition = allLogs.filter(l => l.calories && l.date >= subtractDays(today, 7));
 if (recentNutrition.length > 0) {
 const avgCal = Math.round(recentNutrition.reduce((s, l) => s + Number(l.calories), 0) / recentNutrition.length);
 const protLogs = recentNutrition.filter(l => l.protein);
 const avgProt = protLogs.length > 0 ? Math.round(protLogs.reduce((s, l) => s + Number(l.protein), 0) / protLogs.length) : null;
 parts.push(`Avg intake 7d: ${avgCal} kcal${avgProt ? ', ' + avgProt + 'g protein' : ''}`);
 }
 // Body fat
 const bfLogs = allLogs.filter(l => l.bodyFat?.value);
 if (bfLogs.length > 0) {
 const latest = bfLogs[bfLogs.length - 1];
 const rawBF = Number(latest.bodyFat.value);
 const calibrated = getCalibratedBodyFat(rawBF, cal);
 const methodLabel = cal.method === 'simple_offset' ? `simple offset +${cal.offset}%` : cal.method?.replace(/_/g, ' ');
 parts.push(`BF: ${calibrated.value}% ${calibrated.calibrated ? 'calibrated (' + methodLabel + ')' : 'uncalibrated'}`);
 }
 // Streak
 const streaks = profile.streaks || DEFAULT_STREAKS;
 if (streaks.combined?.current > 0) {
 parts.push(`Logging streak: ${streaks.combined.current}d`);
 }
 if (parts.length > 0) {
 sys += '\n\nBODY: ' + parts.join(' | ');
 }
 } catch (e) { /* skip body metrics on error */ }
 }
 return sys;
}

function trimHistory(messages, maxExchanges) {
 const api = messages.filter(m => !m.local);
 if (api.length <= maxExchanges * 2) return api;
 const keep = api.slice(-(maxExchanges * 2));
 const dropped = api.slice(0, -(maxExchanges * 2));
 const topics = dropped.filter(m => m.role === 'user').map(m => m.content.slice(0, 40)).join('; ');
 return [
 { role:'user', content:`[Prior topics: ${topics}]` },
 { role:'assistant', content:'Understood, continuing from here.' },
.keep,
 ];
}

// --- Provider API dispatchers ---

// Helper: resolve actual model ID (handles __custom__)
const resolveModel = (cfg) => cfg.model === '__custom__' ? (cfg.customModel || cfg.model) : cfg.model;

async function callAnthropic(cfg, systemPrompt, apiMessages) {
 const key = cfg.keys.anthropic;
 if (!key) throw new Error('No Anthropic API key set');
 const res = await fetch('https://api.anthropic.com/v1/messages', {
 method:'POST',
 headers:{ 'Content-Type':'application/json', 'x-api-key':key, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
 body:JSON.stringify({ model:resolveModel(cfg), max_tokens:cfg.maxTokens, temperature:cfg.temperature, system:systemPrompt, messages:apiMessages }),
 });
 const data = await res.json;
 if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
 return {
 text: data.content?.[0]?.text || '',
 usage: { input:data.usage?.input_tokens||0, output:data.usage?.output_tokens||0, cached:data.usage?.cache_read_input_tokens||0 },
 };
}

async function callOpenRouter(cfg, systemPrompt, apiMessages) {
 const key = cfg.keys.openrouter;
 if (!key) throw new Error('No OpenRouter API key set');
 const msgs = [{ role:'system', content:systemPrompt },.apiMessages];
 const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
 method:'POST',
 headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${key}`, 'HTTP-Referer':'https://neurorehab.app', 'X-Title':'NeuroRehab Coach' },
 body:JSON.stringify({ model:resolveModel(cfg), max_tokens:cfg.maxTokens, temperature:cfg.temperature, messages:msgs }),
 });
 const data = await res.json;
 if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
 return {
 text: data.choices?.[0]?.message?.content || '',
 usage: { input:data.usage?.prompt_tokens||0, output:data.usage?.completion_tokens||0, cached:0 },
 };
}

async function callGemini(cfg, systemPrompt, apiMessages) {
 const key = cfg.keys.gemini;
 if (!key) throw new Error('No Gemini API key set');
 const contents = apiMessages.map(m => ({
 role: m.role === 'assistant' ? 'model' : 'user',
 parts:[{ text:m.content }],
 }));
 const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${resolveModel(cfg)}:generateContent?key=${key}`, {
 method:'POST',
 headers:{ 'Content-Type':'application/json' },
 body:JSON.stringify({
 system_instruction:{ parts:[{ text:systemPrompt }] },
 contents,
 generationConfig:{ maxOutputTokens:cfg.maxTokens, temperature:cfg.temperature },
 }),
 });
 const data = await res.json;
 if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
 const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
 const u = data.usageMetadata || {};
 return {
 text,
 usage: { input:u.promptTokenCount||0, output:u.candidatesTokenCount||0, cached:u.cachedContentTokenCount||0 },
 };
}

const DISPATCH = { anthropic:callAnthropic, openrouter:callOpenRouter, gemini:callGemini };

// ============================================================
// PROGRESS REPORTS — LLM-generated weekly/monthly summaries
// ============================================================

const REPORT_SYSTEM_PROMPT = `You are an insightful fitness and rehab coach who writes progress reports. Your job is to analyze workout history data and produce encouraging, personalized reports.

Guidelines:
- Be warm, specific, and encouraging — reference actual exercises and numbers from the data
- Spot subtle patterns the user may have missed (volume trends, consistency patterns, exercise preferences, recovery adherence, strength progressions or plateaus)
- Make 2-3 concrete, actionable recommendations based on the data
- Note what's going well and what could improve — keep criticism constructive and gentle
- End with genuine encouragement tied to something specific you noticed
- Reference the user profile if provided for personalized insights
- Use the selected weight unit consistently`;

function getWeekId(date = new Date) {
 const d = new Date(date);
 d.setHours(0,0,0,0);
 d.setDate(d.getDate + 3 - (d.getDay + 6) % 7);
 const week1 = new Date(d.getFullYear, 0, 4);
 const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay + 6) % 7) / 7);
 return `${d.getFullYear}-W${String(weekNum).padStart(2, '0')}`;
}

function getMonthId(date = new Date) {
 return `${date.getFullYear}-${String(date.getMonth + 1).padStart(2, '0')}`;
}

function buildReportData(history, daysBack, weightUnit = 'lbs') {
 const now = new Date;
 const cutoff = new Date(now.getTime - daysBack * 86400000);
 const cutoffStr = cutoff.toISOString.split('T')[0];

 // Gather all dates in range
 const datesInRange = Object.entries(history || {})
.filter(([d]) => d >= cutoffStr)
.sort((a, b) => a[0].localeCompare(b[0]));

 const workoutDates = datesInRange.filter(([, acts]) => acts.includes('workout'));
 const rehabDates = datesInRange.filter(([, acts]) => acts.includes('rehab'));
 const cardioDates = datesInRange.filter(([, acts]) => acts.includes('cardio'));

 // Load actual workout data
 const workoutDetails = [];
 const exerciseStats = {}; // { exerciseId: { name, category, sessions: [{ date, sets: [{w,r,rpe}] }] } }

 for (const [date] of workoutDates) {
 const raw = LS.get(`workout:${date}`, null);
 const w = getWorkoutExercises(raw);
 if (w.length === 0) continue;

 const dayExercises = [];
 for (const ex of w) {
 const doneSets = (ex.logSets || []).filter(s => s.done);
 if (doneSets.length === 0) continue;

 const sets = doneSets.map(s => ({
 weight: parseFloat(s.weight) || 0,
 reps: parseInt(s.reps) || 0,
 rpe: parseFloat(s.rpe) || 0,
 }));

 const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
 const maxWeight = Math.max(.sets.map(s => s.weight));
 const avgRPE = sets.filter(s => s.rpe > 0).length > 0
 ? (sets.filter(s => s.rpe > 0).reduce((s, x) => s + x.rpe, 0) / sets.filter(s => s.rpe > 0).length).toFixed(1)
 : null;

 dayExercises.push({
 name: ex.name, category: ex.category, setsCompleted: doneSets.length,
 totalSets: (ex.logSets || []).length, maxWeight, totalVolume, avgRPE,
 });

 if (!exerciseStats[ex.id]) {
 exerciseStats[ex.id] = { name: ex.name, category: ex.category, sessions: [] };
 }
 exerciseStats[ex.id].sessions.push({ date, sets, totalVolume, maxWeight });
 }

 if (dayExercises.length > 0) {
 workoutDetails.push({ date, exercises: dayExercises });
 }
 }

 // Load cardio details
 const cardioDetails = [];
 for (const [date] of cardioDates) {
 const logs = LS.get(`cardio:${date}`, []);
 if (Array.isArray(logs)) {
 for (const l of logs) {
 cardioDetails.push({ date: l.date || date, name: l.name, duration: l.duration, hr: l.hr });
 }
 }
 }

 // Build progression summaries for exercises done 2+ times
 const progressions = [];
 for (const [, stat] of Object.entries(exerciseStats)) {
 if (stat.sessions.length >= 2) {
 const first = stat.sessions[0];
 const last = stat.sessions[stat.sessions.length - 1];
 const weightDelta = last.maxWeight - first.maxWeight;
 const volDelta = last.totalVolume - first.totalVolume;
 progressions.push({
 name: stat.name, category: stat.category,
 sessions: stat.sessions.length,
 firstMax: first.maxWeight, lastMax: last.maxWeight, weightDelta,
 firstVol: first.totalVolume, lastVol: last.totalVolume, volDelta,
 });
 }
 }

 // Body tracking summary
 const bodyLogs = loadBodyLogs.filter(l => l.date >= cutoffStr);
 const allBodyLogs = loadAllBodyLogs.filter(l => l.date >= cutoffStr);
 const nCfg = LS.get('nutritionConfig', DEFAULT_NUTRITION_CONFIG);
 const bfCal = LS.get('bfCalibration', DEFAULT_CALIBRATION);
 const bodyTracking = {};

 if (bodyLogs.length >= 2) {
 const smoothed = getSmoothedWeights(bodyLogs, nCfg);
 const first = smoothed[0], last = smoothed[smoothed.length - 1];
 bodyTracking.weightTrend = { start: first.trend, end: last.trend, delta: Math.round((last.trend - first.trend) * 10) / 10, unit: weightUnit };
 bodyTracking.avgWeight = Math.round(smoothed.reduce((s, d) => s + d.trend, 0) / smoothed.length * 10) / 10;
 }

 const calLogs = allBodyLogs.filter(l => l.calories);
 if (calLogs.length > 0) {
 const avgCal = Math.round(calLogs.reduce((s, l) => s + Number(l.calories), 0) / calLogs.length);
 const target = nCfg.dailyCalorieTarget || 2200;
 bodyTracking.avgCalories = avgCal;
 bodyTracking.calorieTarget = target;
 bodyTracking.adherencePct = Math.round((avgCal / target) * 100);
 }

 if (nCfg.estimatedTDEE) {
 bodyTracking.tdee = nCfg.estimatedTDEE;
 bodyTracking.tdeeConfidence = nCfg.tdeeConfidence || 'low';
 const hist = nCfg.tdeeHistory || [];
 const recentHist = hist.filter(h => h.date >= cutoffStr);
 if (recentHist.length >= 2) {
 bodyTracking.tdeeTrend = recentHist[recentHist.length - 1].tdee - recentHist[0].tdee;
 }
 }

 const bfLogs = allBodyLogs.filter(l => l.bodyFat?.value);
 if (bfLogs.length >= 2) {
 const first = getCalibratedBodyFat(Number(bfLogs[0].bodyFat.value), bfCal);
 const last = getCalibratedBodyFat(Number(bfLogs[bfLogs.length - 1].bodyFat.value), bfCal);
 bodyTracking.bodyFatTrend = { start: first.value, end: last.value, delta: Math.round((last.value - first.value) * 10) / 10 };
 }

 return {
 period: `${cutoffStr} to ${now.toISOString.split('T')[0]}`,
 totalActiveDays: datesInRange.length,
 workoutCount: workoutDates.length,
 rehabCount: rehabDates.length,
 cardioCount: cardioDates.length,
 workoutDetails,
 cardioDetails,
 progressions,
 weightUnit,
 bodyTracking,
 };
}

function buildReportPrompt(type, data, profile, settings) {
 const isWeekly = type === 'weekly';
 const wordTarget = isWeekly ? '150-250 words' : '400-600 words';
 const period = isWeekly ? 'past 7 days' : 'past 30 days';

 let prompt = `Generate a ${isWeekly ? 'short weekly' : 'detailed monthly'} progress report (${wordTarget}) for the ${period}.\n\n`;
 prompt += `USER CONTEXT: Phase: ${profile.phase}, Location: ${profile.location}, XP: ${profile.xp}, Streak: ${profile.streak}d, Weight unit: ${data.weightUnit}\n\n`;
 prompt += `ACTIVITY SUMMARY:\n`;
 prompt += `- Active days: ${data.totalActiveDays}\n`;
 prompt += `- Workouts completed: ${data.workoutCount}\n`;
 prompt += `- Rehab sessions: ${data.rehabCount}\n`;
 prompt += `- Cardio sessions: ${data.cardioCount}\n\n`;

 // Body tracking section
 if (data.bodyTracking && Object.keys(data.bodyTracking).length > 0) {
 const bt = data.bodyTracking;
 prompt += `BODY TRACKING:\n`;
 if (bt.weightTrend) {
 prompt += `- Weight: ${bt.weightTrend.start}→${bt.weightTrend.end} ${bt.weightTrend.unit} (${bt.weightTrend.delta > 0 ? '+' : ''}${bt.weightTrend.delta}), avg ${bt.avgWeight}\n`;
 }
 if (bt.avgCalories) {
 prompt += `- Avg daily calories: ${bt.avgCalories} kcal (target: ${bt.calorieTarget}, adherence: ${bt.adherencePct}%)\n`;
 }
 if (bt.tdee) {
 prompt += `- TDEE estimate: ${bt.tdee} kcal (${bt.tdeeConfidence} confidence)${bt.tdeeTrend ? ', trend: ' + (bt.tdeeTrend > 0 ? '+' : '') + Math.round(bt.tdeeTrend) + ' kcal' : ''}\n`;
 }
 if (bt.bodyFatTrend) {
 prompt += `- Body fat: ${bt.bodyFatTrend.start}%→${bt.bodyFatTrend.end}% (${bt.bodyFatTrend.delta > 0 ? '+' : ''}${bt.bodyFatTrend.delta}%)\n`;
 }
 prompt += '\n';
 }

 if (data.workoutDetails.length > 0) {
 prompt += `WORKOUT LOG:\n`;
 for (const day of data.workoutDetails) {
 prompt += `${day.date}: `;
 prompt += day.exercises.map(e =>
 `${e.name} (${e.setsCompleted}/${e.totalSets} sets, max ${e.maxWeight}${data.weightUnit}, vol ${e.totalVolume}${data.weightUnit}${e.avgRPE ? ', RPE ' + e.avgRPE : ''})`
 ).join('; ');
 prompt += '\n';
 }
 prompt += '\n';
 }

 if (data.progressions.length > 0) {
 prompt += `EXERCISE PROGRESSIONS (exercises done 2+ times):\n`;
 for (const p of data.progressions) {
 const arrow = p.weightDelta > 0 ? '↑' : p.weightDelta < 0 ? '↓' : '→';
 prompt += `- ${p.name}: ${p.firstMax}→${p.lastMax}${data.weightUnit} (${arrow}${Math.abs(p.weightDelta)}), volume ${p.firstVol}→${p.lastVol} over ${p.sessions} sessions\n`;
 }
 prompt += '\n';
 }

 if (data.cardioDetails.length > 0) {
 prompt += `CARDIO LOG:\n`;
 for (const c of data.cardioDetails) {
 prompt += `- ${c.name}: ${c.duration}min${c.hr ? ', HR ' + c.hr + 'bpm' : ''}\n`;
 }
 prompt += '\n';
 }

 if (!isWeekly) {
 prompt += `For the monthly report, please also include:\n`;
 prompt += `- Overall training consistency analysis\n`;
 prompt += `- Muscle group balance observations\n`;
 prompt += `- Recovery and rehab compliance trends\n`;
 prompt += `- Specific strength progression highlights\n`;
 prompt += `- 3 prioritized recommendations for next month\n`;
 }

 return prompt;
}

function ProgressReports({ profile, history, settings, coachCfg, goToSettings }) {
 const [weeklyReport, setWeeklyReport] = useState( => LS.get(`report:weekly:${getWeekId}`, null));
 const [monthlyReport, setMonthlyReport] = useState( => LS.get(`report:monthly:${getMonthId}`, null));
 const [generating, setGenerating] = useState(null); // 'weekly' | 'monthly' | null
 const [error, setError] = useState(null);
 const [expandedReport, setExpandedReport] = useState(null); // 'weekly' | 'monthly' | null

 const cfg = coachCfg;
 const hasKey = !!(cfg.keys?.[cfg.provider]);

 const generateReport = async (type) => {
 if (!hasKey || generating) return;
 setGenerating(type);
 setError(null);

 try {
 const daysBack = type === 'weekly' ? 7 : 30;
 const data = buildReportData(history, daysBack, settings.weightUnit);

 if (data.workoutCount === 0 && data.rehabCount === 0 && data.cardioCount === 0) {
 setError(`No activity data found for the past ${daysBack} days.`);
 setGenerating(null);
 return;
 }

 const systemPrompt = buildFullSystemPrompt({
.cfg,
 systemPrompt: REPORT_SYSTEM_PROMPT,
 });
 const userPrompt = buildReportPrompt(type, data, profile, settings);

 const dispatcher = DISPATCH[cfg.provider];
 if (!dispatcher) throw new Error(`Unknown provider: ${cfg.provider}`);

 const overrideCfg = {.cfg, maxTokens: type === 'weekly' ? 400 : 800 };
 const result = await dispatcher(overrideCfg, systemPrompt, [{ role: 'user', content: userPrompt }]);

 const report = {
 text: result.text,
 generatedAt: new Date.toISOString,
 type,
 period: type === 'weekly' ? getWeekId : getMonthId,
 stats: { workouts: data.workoutCount, rehab: data.rehabCount, cardio: data.cardioCount, activeDays: data.totalActiveDays },
 };

 const key = type === 'weekly' ? `report:weekly:${getWeekId}` : `report:monthly:${getMonthId}`;
 LS.set(key, report);

 if (type === 'weekly') setWeeklyReport(report);
 else setMonthlyReport(report);

 setExpandedReport(type);
 } catch (e) {
 setError(e.message);
 }
 setGenerating(null);
 };

 const formatDate = (iso) => {
 if (!iso) return '';
 const d = new Date(iso);
 return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
 };

 const ReportCard = ({ report, type, label, icon }) => {
 const isExpanded = expandedReport === type;
 const hasReport = !!report;
 const isGenerating = generating === type;

 return (
 <div style={{
 background: T.bgCard, border: `1px solid ${hasReport ? 'rgba(78,205,196,0.15)' : T.border}`,
 borderRadius: T.radius, overflow: 'hidden', marginBottom: '10px', transition: 'all 0.3s',
 }}>
 {/* Header */}
 <div style={{
 display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer',
 }} onClick={ => hasReport && setExpandedReport(isExpanded ? null : type)}
 role={hasReport ? 'button' : undefined} tabIndex={hasReport ? 0 : undefined}
 aria-expanded={hasReport ? isExpanded : undefined}
 onKeyDown={(e) => { if (hasReport && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault; setExpandedReport(isExpanded ? null : type); } }}
 >
 <div style={{
 width: 36, height: 36, borderRadius: '10px',
 background: hasReport ? T.tealGlow : 'rgba(255,255,255,0.03)',
 display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
 }}>
 {icon}
 </div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ fontSize: '14px', fontWeight: 600, color: T.text }}>{label}</div>
 <div style={{ fontSize: '11px', color: T.text3, marginTop: '1px' }}>
 {hasReport
 ? `Generated ${formatDate(report.generatedAt)} · ${report.stats.workouts}W ${report.stats.rehab}R ${report.stats.cardio}C`
 : 'No report yet'
 }
 </div>
 </div>
 {hasReport ? (
 <ChevronDown size={16} color={T.text3} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
 ) : (
 <button
 onClick={(e) => { e.stopPropagation; generateReport(type); }}
 disabled={!hasKey || isGenerating}
 style={{
 padding: '8px 14px', borderRadius: '10px', border: 'none', fontSize: '12px', fontWeight: 600,
 cursor: hasKey && !isGenerating ? 'pointer' : 'default',
 background: hasKey ? `linear-gradient(135deg, ${T.accent}, #FF8C42)` : 'rgba(255,255,255,0.04)',
 color: hasKey ? '#fff' : T.text3,
 display: 'flex', alignItems: 'center', gap: '6px',
 opacity: isGenerating ? 0.7 : 1, transition: 'all 0.2s',
 }}
 >
 {isGenerating ? <><Loader size={12} style={{ animation: 'pulse 1s infinite' }} /> Generating.</> : 'Generate'}
 </button>
 )}
 </div>

 {/* Expanded report content */}
 {isExpanded && report && (
 <div style={{ padding: '0 16px 16px', animation: 'fadeUp 0.2s ease-out' }}>
 <div style={{
 padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px',
 border: `1px solid ${T.border}`, fontSize: '13px', color: T.text2,
 lineHeight: 1.7, whiteSpace: 'pre-wrap',
 }}>
 {report.text}
 </div>
 <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
 <button
 onClick={ => generateReport(type)}
 disabled={!hasKey || isGenerating}
 style={{
 padding: '8px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
 border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.03)',
 color: T.text2, cursor: hasKey ? 'pointer' : 'default',
 display: 'flex', alignItems: 'center', gap: '5px',
 }}
 >
 <RotateCcw size={12} /> {isGenerating ? 'Generating.' : 'Regenerate'}
 </button>
 </div>
 </div>
 )}
 </div>
 );
 };

 if (!settings.reportsEnabled) return null;

 return (
 <div style={{ marginTop: '20px' }}>
 <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
 <FileText size={16} color={T.teal} /> AI Progress Reports
 </h3>

 {!hasKey && (
 <GlassCard animate={false} style={{ padding: '14px', marginBottom: '12px', textAlign: 'center' }}>
 <div style={{ fontSize: '13px', color: T.text2, marginBottom: '8px' }}>
 Configure an AI provider to generate reports
 </div>
 <button onClick={ => goToSettings?.('coach')} style={{
 padding: '8px 16px', borderRadius: '10px', border: 'none',
 background: T.teal, color: '#07070E', fontWeight: 600, fontSize: '12px', cursor: 'pointer',
 }}>
 Set Up AI Provider
 </button>
 </GlassCard>
 )}

 <ReportCard
 report={weeklyReport} type="weekly" label="Weekly Report"
 icon={<Calendar size={18} color={weeklyReport ? T.teal : T.text3} />}
 />
 <ReportCard
 report={monthlyReport} type="monthly" label="Monthly Report"
 icon={<FileText size={18} color={monthlyReport ? T.teal : T.text3} />}
 />

 {error && (
 <div style={{
 padding: '10px 14px', borderRadius: '10px', fontSize: '12px',
 background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.15)',
 color: T.danger, marginTop: '8px',
 }}>
 {error}
 </div>
 )}

 <button onClick={ => goToSettings?.('coach')} style={{
 width: '100%', padding: '8px', background: 'none', border: 'none',
 color: T.text3, fontSize: '11px', cursor: 'pointer', marginTop: '4px',
 }}>
 Reports use your AI Coach provider · Tap to configure
 </button>
 </div>
 );
}

// --- Collapsible Section ---

function CalibrationPointForm({ onAdd }) {
 const [show, setShow] = useState(false);
 const [date, setDate] = useState(today);
 const [bia, setBia] = useState('');
 const [dexa, setDexa] = useState('');
 
 if (!show) {
 return (
 <button onClick={ => setShow(true)} style={{
 display:'flex', alignItems:'center', gap:'6px', padding:'8px 12px',
 background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:'8px',
 color:T.text2, fontSize:'12px', cursor:'pointer', width:'100%',
 }}>
 <Plus size={14} /> Add calibration point
 </button>
 );
 }

 return (
 <div style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:'8px',
 border:`1px solid ${T.border}`, animation:'fadeIn 0.2s ease-out' }}>
 <div style={{ display:'flex', gap:'8px', marginBottom:'8px' }}>
 <div style={{ flex:1 }}>
 <span style={{ fontSize:'10px', color:T.text3, display:'block', marginBottom:'2px' }}>Date</span>
 <input type="date" value={date} onChange={e => setDate(e.target.value)}
 aria-label="Calibration date"
 style={{ width:'100%', padding:'6px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'6px', color:T.text, fontSize:'12px', outline:'none' }} />
 </div>
 <div style={{ flex:1 }}>
 <span style={{ fontSize:'10px', color:T.text3, display:'block', marginBottom:'2px' }}>BIA %</span>
 <input type="text" inputMode="decimal" value={bia} onChange={e => setBia(e.target.value)}
 placeholder="18.5" aria-label="BIA body fat percentage" style={{ width:'100%', padding:'6px', background:'rgba(255,255,255,0.04)',
 border:`1px solid ${T.border}`, borderRadius:'6px', color:T.text, fontSize:'12px',
 fontFamily:T.mono, outline:'none', boxSizing:'border-box' }} />
 </div>
 <div style={{ flex:1 }}>
 <span style={{ fontSize:'10px', color:T.text3, display:'block', marginBottom:'2px' }}>DEXA %</span>
 <input type="text" inputMode="decimal" value={dexa} onChange={e => setDexa(e.target.value)}
 placeholder="22.8" aria-label="DEXA body fat percentage" style={{ width:'100%', padding:'6px', background:'rgba(255,255,255,0.04)',
 border:`1px solid ${T.border}`, borderRadius:'6px', color:T.text, fontSize:'12px',
 fontFamily:T.mono, outline:'none', boxSizing:'border-box' }} />
 </div>
 </div>
 <div style={{ display:'flex', gap:'6px' }}>
 <button onClick={ => {
 if (bia && dexa) {
 onAdd({ date, biaValue: Number(bia), dexaValue: Number(dexa), weight: null });
 setBia(''); setDexa(''); setShow(false);
 }
 }} style={{
 flex:1, padding:'8px', background:T.accentSoft, border:'none', borderRadius:'6px',
 color:T.accent, fontWeight:600, fontSize:'12px', cursor:'pointer',
 }}>Add</button>
 <button onClick={ => setShow(false)} style={{
 padding:'8px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'6px', color:T.text3, fontSize:'12px', cursor:'pointer',
 }}>Cancel</button>
 </div>
 </div>
 );
}

function SettingsSection({ id, title, icon: Icon, children, sectionRef, defaultOpen = false, autoOpen = false }) {
 const [open, setOpen] = useState(defaultOpen || autoOpen);

 // Force open when deep-linked
 useEffect( => {
 if (autoOpen) setOpen(true);
 }, [autoOpen]);
 return (
 <div ref={sectionRef} style={{ marginBottom:'4px' }}>
 <button onClick={ => setOpen(!open)} aria-expanded={open} aria-controls={`settings-section-${id}`} style={{
 width:'100%', display:'flex', alignItems:'center', gap:'12px', padding:'14px 16px',
 background:T.bgCard, border:`1px solid ${T.border}`, borderRadius: open ? '14px 14px 0 0' : '14px',
 cursor:'pointer', transition:'all 0.2s',
 }}>
 <Icon size={18} color={T.teal} aria-hidden="true" />
 <span style={{ flex:1, textAlign:'left', fontSize:'14px', fontWeight:600, color:T.text }}>{title}</span>
 <ChevronDown size={16} color={T.text3} style={{ transform: open ? 'rotate(180deg)' : 'none', transition:'0.2s' }} aria-hidden="true" />
 </button>
 {open && (
 <div id={`settings-section-${id}`} role="region" aria-label={title} style={{ padding:'16px', background:T.bgCard, border:`1px solid ${T.border}`, borderTop:'none',
 borderRadius:'0 0 14px 14px', animation:'fadeIn 0.15s ease-out' }}>
 {children}
 </div>
 )}
 </div>
 );
}

// ============================================================
// PROGRAM OVERVIEW CARD
// ============================================================

function ProgramOverviewCard({ settings, profile }) {
 const daysPerWeek = settings.daysPerWeek || 3;
 const experienceLevel = settings.experienceLevel || 'beginner';
 const splitKey = selectSplit(daysPerWeek, experienceLevel);
 const template = SPLIT_TEMPLATES[splitKey];
 const [expandedDay, setExpandedDay] = useState(null);

 if (!template) return null;

 // Figure out which day was last trained to highlight the "next" day
 const recentKeys = LS.keys('workout:').sort((a, b) => b.localeCompare(a));
 let lastSplitDay = null;
 for (const key of recentKeys) {
 const raw = LS.get(key, null);
 const w = normalizeWorkout(raw);
 if (w?.splitDay) { lastSplitDay = w.splitDay; break; }
 }
 const lastIdx = lastSplitDay ? template.days.findIndex(d => d.name.toLowerCase.replace(/\s+/g, '_') === lastSplitDay) : -1;
 const nextIdx = lastIdx >= 0 ? (lastIdx + 1) % template.days.length : 0;

 // Slot display name mapping
 const slotLabels = {
 chest: 'Chest', back: 'Back', shoulders: 'Shoulders', quads: 'Quads',
 hamstrings: 'Hamstrings', glutes: 'Glutes', core: 'Core', calves: 'Calves',
 triceps: 'Triceps', biceps: 'Biceps', neck: 'Neck', rear_delts: 'Rear Delts',
 };

 // Get available exercises per slot (filtered by phase/location)
 const getExercisesForSlot = (slotName) => {
 return EXERCISES.filter(e => {
 if (e.category !== (slotName === 'rear_delts' ? 'shoulders' : slotName)) return false;
 const phaseData = e.phase?.[profile.phase];
 if (!phaseData || phaseData.s === 'avoid') return false;
 if (!e.location?.[profile.location]) return false;
 return true;
 });
 };

 return (
 <div style={{ marginTop:'12px' }}>
 <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
 <div style={{ fontSize:'13px', fontWeight:700, color:T.text }}>{template.name}</div>
 <div style={{ fontSize:'11px', color:T.text3 }}>•</div>
 <div style={{ fontSize:'11px', color:T.text3 }}>{daysPerWeek} days/week</div>
 </div>
 {template.days.map((day, dayIdx) => {
 const isNext = dayIdx === nextIdx;
 const isExpanded = expandedDay === dayIdx;
 return (
 <div key={dayIdx} style={{
 marginBottom:'8px', borderRadius:'12px', overflow:'hidden',
 border: isNext ? `1px solid rgba(255,107,53,0.3)` : `1px solid ${T.border}`,
 background: isNext ? 'rgba(255,107,53,0.04)' : 'rgba(255,255,255,0.02)',
 }}>
 <button onClick={ => setExpandedDay(isExpanded ? null : dayIdx)} style={{
 width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px',
 background:'none', border:'none', cursor:'pointer', textAlign:'left',
 }}>
 <div style={{
 width:28, height:28, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center',
 fontSize:'12px', fontWeight:700, fontFamily:T.mono,
 background: isNext ? T.accent : 'rgba(255,255,255,0.06)',
 color: isNext ? '#fff' : T.text3,
 }}>
 {dayIdx + 1}
 </div>
 <div style={{ flex:1 }}>
 <div style={{ fontSize:'13px', fontWeight:600, color:T.text }}>{day.name}</div>
 <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginTop:'4px' }}>
 {day.slots.map(slot => (
 <span key={slot} style={{
 padding:'2px 7px', borderRadius:'5px', fontSize:'10px', fontWeight:500,
 background:'rgba(78,205,196,0.08)', color:T.teal,
 }}>
 {slotLabels[slot] || slot}
 </span>
 ))}
 </div>
 </div>
 {isNext && (
 <span style={{ fontSize:'10px', fontWeight:600, color:T.accent, textTransform:'uppercase', letterSpacing:'0.5px' }}>
 Next
 </span>
 )}
 <ChevronDown size={14} color={T.text3} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition:'0.2s' }} />
 </button>
 {isExpanded && (
 <div style={{ padding:'0 14px 14px', borderTop:`1px solid ${T.border}`, animation:'fadeIn 0.15s ease-out' }}>
 {day.slots.map(slot => {
 const exs = getExercisesForSlot(slot);
 return (
 <div key={slot} style={{ marginTop:'10px' }}>
 <div style={{ fontSize:'11px', fontWeight:600, color:T.text3, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>
 {slotLabels[slot] || slot} ({exs.length})
 </div>
 <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
 {exs.slice(0, 8).map(ex => (
 <span key={ex.id} style={{
 padding:'3px 8px', borderRadius:'6px', fontSize:'11px',
 background:'rgba(255,255,255,0.04)', color:T.text2,
 border:`1px solid ${T.border}`,
 }}>
 {ex.name}
 </span>
 ))}
 {exs.length > 8 && (
 <span style={{ padding:'3px 8px', fontSize:'11px', color:T.text3 }}>
 +{exs.length - 8} more
 </span>
 )}
 {exs.length === 0 && (
 <span style={{ fontSize:'11px', color:T.text3, fontStyle:'italic' }}>No exercises available</span>
 )}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
 })}
 </div>
 );
}

// --- Full Settings Tab ---

function SettingsTab({ settings, onUpdateSettings, profile, updateProfile, coachCfg, onUpdateCoachCfg, history, scrollToSection, nutritionConfig, onUpdateNutritionConfig, calibration, onUpdateCalibration }) {
 const trainingRef = useRef(null);
 const programmingRef = useRef(null);
 const unitsRef = useRef(null);
 const workoutRef = useRef(null);
 const recoveryRef = useRef(null);
 const bodyTrackingRef = useRef(null);
 const calibrationRef = useRef(null);
 const coachRef = useRef(null);
 const dataRef = useRef(null);

 const refs = { training: trainingRef, programming: programmingRef, units: unitsRef, workout: workoutRef, recovery: recoveryRef, bodyTracking: bodyTrackingRef, calibration: calibrationRef, coach: coachRef, data: dataRef };

 useEffect( => {
 if (scrollToSection && refs[scrollToSection]?.current) {
 setTimeout( => {
 refs[scrollToSection].current.scrollIntoView({ behavior:'smooth', block:'start' });
 }, 150);
 }
 }, [scrollToSection]);

 const upd = (key, val) => onUpdateSettings({.settings, [key]: val });
 const updCoach = (key, val) => onUpdateCoachCfg({.coachCfg, [key]: val });
 const setCoachKey = (prov, val) => onUpdateCoachCfg({.coachCfg, keys:{.coachCfg.keys, [prov]: val } });

 const coachProvider = PROVIDERS[coachCfg.provider] || PROVIDERS.anthropic;
 const currentModel = coachCfg.model === '__custom__'
 ? { id:'__custom__', label:'Other', cost:{in:0,out:0,cached:0} }
 : (coachProvider.models.find(m => m.id === coachCfg.model) || coachProvider.models[0]);

 const S = {
 label: { fontSize:'11px', fontWeight:600, color:T.text3, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px', display:'block' },
 input: { width:'100%', padding:'10px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:'10px', color:T.text, fontSize:'13px', outline:'none', fontFamily:T.font },
 textarea: { width:'100%', padding:'10px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:'10px', color:T.text, fontSize:'12px', outline:'none', fontFamily:T.mono, lineHeight:1.5, resize:'vertical', minHeight:'80px', boxSizing:'border-box' },
 pill: (active) => ({ padding:'10px 14px', borderRadius:'8px', border:'none', fontSize:'12px', fontWeight:600, cursor:'pointer', transition:'all 0.2s', background:active ? T.accent : 'rgba(255,255,255,0.04)', color:active ? '#fff' : T.text3, minHeight:'40px', display:'inline-flex', alignItems:'center' }),
 pillTeal: (active) => ({ padding:'10px 14px', borderRadius:'8px', border:'none', fontSize:'12px', fontWeight:600, cursor:'pointer', transition:'all 0.2s', background:active ? T.teal : 'rgba(255,255,255,0.04)', color:active ? '#07070E' : T.text3, minHeight:'40px', display:'inline-flex', alignItems:'center' }),
 toggle: (on) => ({ width:44, height:26, borderRadius:13, border:'none', cursor:'pointer', position:'relative', transition:'all 0.2s', background:on ? T.teal : 'rgba(255,255,255,0.1)', padding:'2px 0' }),
 toggleDot: (on) => ({ position:'absolute', top:3, left:on?24:3, width:20, height:20, borderRadius:10, background:'#fff', transition:'left 0.2s' }),
 row: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0' },
 rowBorder: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${T.border}` },
 slider: { flex:1, marginLeft:'12px', accentColor:T.accent },
 val: { fontSize:'13px', fontFamily:T.mono, color:T.text, minWidth:'36px', textAlign:'right' },
 sub: { marginBottom:'16px' },
 };

 const [confirmReset, setConfirmReset] = useState(false);

 // Data management helpers
 const exportData = => {
 const data = {};
 const allKeys = LS.keys('');
 for (const k of allKeys) { data[k] = LS.get(k, null); }
 const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a'); a.href = url; a.download = `neurorehab-backup-${today}.json`;
 a.click; URL.revokeObjectURL(url);
 };

 const importData = => {
 const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
 input.onchange = async (e) => {
 const file = e.target.files[0]; if (!file) return;
 if (file.size > 10 * 1024 * 1024) { alert('File too large. Maximum import size is 10MB.'); return; }
 try {
 const text = await file.text;
 const data = JSON.parse(text);

 // Schema validation: must be a plain object with string keys
 if (!data || typeof data !== 'object' || Array.isArray(data)) {
 throw new Error('Invalid format: expected a JSON object.');
 }

 // Validate critical keys if present
 if ('profile' in data && (data.profile === null || typeof data.profile !== 'object')) {
 throw new Error('Invalid profile data: expected a non-null object.');
 }
 if ('profile' in data) {
 const p = data.profile;
 // Ensure essential profile fields exist and are valid to prevent render crashes
 if (typeof p.xp !== 'number' || !isFinite(p.xp) || p.xp < 0) p.xp = 0;
 const validPhases = ['acute', 'subacute', 'maintenance'];
 if (!validPhases.includes(p.phase)) p.phase = 'acute';
 const validLocations = ['gym', 'home', 'work'];
 if (!validLocations.includes(p.location)) p.location = 'gym';
 if (typeof p.streak !== 'number' || !isFinite(p.streak) || p.streak < 0) p.streak = 0;
 if (!p.streaks || typeof p.streaks !== 'object') p.streaks = {};
 data.profile = p;
 }

 // Validate appSettings enum fields if present
 if ('appSettings' in data && data.appSettings && typeof data.appSettings === 'object') {
 const s = data.appSettings;
 const validUnits = ['lbs', 'kg'];
 if (!validUnits.includes(s.weightUnit)) s.weightUnit = 'lbs';
 const validGoals = ['strength', 'hypertrophy', 'endurance'];
 if (!validGoals.includes(s.trainingGoal)) s.trainingGoal = 'hypertrophy';
 const validLevels = ['beginner', 'intermediate', 'advanced'];
 if (!validLevels.includes(s.experienceLevel)) s.experienceLevel = 'beginner';
 if (typeof s.daysPerWeek !== 'number' || s.daysPerWeek < 2 || s.daysPerWeek > 6) s.daysPerWeek = 3;
 data.appSettings = s;
 }

 // Validate that history entries are arrays (not random strings)
 if ('history' in data && typeof data.history !== 'object') {
 throw new Error('Invalid history data: expected an object.');
 }

 // Validate workout entries are objects
 const workoutKeys = Object.keys(data).filter(k => k.startsWith('workout:'));
 for (const wk of workoutKeys) {
 if (data[wk] !== null && typeof data[wk] !== 'object') {
 throw new Error(`Invalid workout data for key "${wk}".`);
 }
 }

 // Validate bodyLog entries are objects
 const bodyLogKeys = Object.keys(data).filter(k => k.startsWith('bodyLog:'));
 for (const bk of bodyLogKeys) {
 if (data[bk] !== null && typeof data[bk] !== 'object') {
 throw new Error(`Invalid body log data for key "${bk}".`);
 }
 }

 // Confirm before overwriting
 const keyCount = Object.keys(data).length;
 if (!window.confirm(`Import ${keyCount} data entries? This will overwrite existing data.`)) return;

 Object.entries(data).forEach(([k, v]) => LS.set(k, v));
 window.location.reload;
 } catch(err) { alert('Failed to import: ' + err.message); }
 };
 input.click;
 };

 const clearAllData = => {
 try { if (_lsAvailable) localStorage.clear; } catch { /* ignore */ }
 Object.keys(_memoryStore).forEach(k => delete _memoryStore[k]);
 window.location.reload;
 };

 const storageUsed = ( => {
 try {
 if (_lsAvailable) { let t=0; for(let i=0;i<localStorage.length;i++){t+=(localStorage.getItem(localStorage.key(i))||'').length;} return (t/1024).toFixed(1); }
 let t=0; for(const v of Object.values(_memoryStore)) t+=(v||'').length; return (t/1024).toFixed(1);
 } catch { return '0.0'; }
 });

 return (
 <div style={{ animation:'fadeIn 0.3s ease-out', paddingBottom:'40px' }}>
 <h2 style={{ fontSize:'22px', fontWeight:700, marginBottom:'16px', letterSpacing:'-0.02em' }}>Settings</h2>

 {/* =============== TRAINING =============== */}
 <SettingsSection id="training" title="Training Profile" icon={Dumbbell} sectionRef={trainingRef}
 autoOpen={scrollToSection === 'training'}>
 <div style={S.sub}>
 <span style={S.label}>Rehab Phase</span>
 <div style={{ display:'flex', gap:'8px' }}>
 {['acute','subacute','maintenance'].map(p => (
 <button key={p} onClick={ => updateProfile({ phase: p })} style={S.pill(profile.phase === p)}>
 {p.charAt(0).toUpperCase + p.slice(1)}
 </button>
 ))}
 </div>
 </div>
 <div style={S.sub}>
 <span style={S.label}>Equipment / Location</span>
 <div style={{ display:'flex', gap:'8px' }}>
 {['gym','home','work'].map(l => (
 <button key={l} onClick={ => updateProfile({ location: l })} style={S.pillTeal(profile.location === l)}>
 {l.charAt(0).toUpperCase + l.slice(1)}
 </button>
 ))}
 </div>
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'6px' }}>
 Changing phase or location regenerates your next workout.
 </div>
 </div>
 <div style={S.sub}>
 <span style={S.label}>Preferred Training Time</span>
 <div style={{ display:'flex', gap:'8px' }}>
 {['morning','afternoon','evening'].map(t => (
 <button key={t} onClick={ => upd('trainingTime', t)} style={S.pillTeal(settings.trainingTime === t)}>
 {t.charAt(0).toUpperCase + t.slice(1)}
 </button>
 ))}
 </div>
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'6px' }}>
 AM exercise may be beneficial optimization.
 </div>
 </div>
 </SettingsSection>

 {/* =============== PROGRAMMING =============== */}
 <SettingsSection id="programming" title="Programming" icon={Target} sectionRef={programmingRef}
 autoOpen={scrollToSection === 'programming'}>
 <div style={S.sub}>
 <span style={S.label}>Days Per Week</span>
 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
 <input type="range" min={2} max={6} value={settings.daysPerWeek || 3}
 onChange={e => upd('daysPerWeek', parseInt(e.target.value))}
 aria-label="Days per week" aria-valuetext={`${settings.daysPerWeek || 3} days`}
 style={S.slider} />
 <span style={S.val}>{settings.daysPerWeek || 3}</span>
 </div>
 <div style={{ fontSize: '10px', color: T.text3, marginTop: '4px' }}>
 Split: {SPLIT_TEMPLATES[selectSplit(settings.daysPerWeek || 3, settings.experienceLevel || 'beginner')]?.name || 'Full Body'}
 </div>
 </div>
 <div style={S.sub}>
 <span style={S.label}>Experience Level</span>
 <div style={{ display: 'flex', gap: '8px' }}>
 {['beginner', 'intermediate', 'advanced'].map(lvl => (
 <button key={lvl} onClick={ => upd('experienceLevel', lvl)}
 aria-pressed={(settings.experienceLevel || 'beginner') === lvl}
 style={S.pill((settings.experienceLevel || 'beginner') === lvl)}>
 {lvl.charAt(0).toUpperCase + lvl.slice(1)}
 </button>
 ))}
 </div>
 </div>
 <div style={S.sub}>
 <span style={S.label}>Training Goal</span>
 <div style={{ display: 'flex', gap: '8px' }}>
 {['strength', 'hypertrophy', 'endurance'].map(goal => (
 <button key={goal} onClick={ => upd('trainingGoal', goal)}
 aria-pressed={(settings.trainingGoal || 'hypertrophy') === goal}
 style={S.pillTeal((settings.trainingGoal || 'hypertrophy') === goal)}>
 {goal.charAt(0).toUpperCase + goal.slice(1)}
 </button>
 ))}
 </div>
 <div style={{ fontSize: '10px', color: T.text3, marginTop: '6px' }}>
 Affects prescribed rep ranges and rest periods.
 </div>
 </div>
 <div style={S.row}>
 <span style={{ fontSize: '13px', color: T.text2 }}>Progressive overload</span>
 <button onClick={ => upd('enableProgressiveOverload', !settings.enableProgressiveOverload)}
 role="switch" aria-checked={settings.enableProgressiveOverload !== false}
 style={S.toggle(settings.enableProgressiveOverload !== false)}>
 <div style={S.toggleDot(settings.enableProgressiveOverload !== false)} />
 </button>
 </div>
 <div style={{ fontSize: '10px', color: T.text3, marginTop: '-4px' }}>
 Auto-prescribe weight and reps based on your recent performance.
 </div>
 <ProgramOverviewCard settings={settings} profile={profile} />
 </SettingsSection>

 {/* =============== UNITS =============== */}
 <SettingsSection id="units" title="Units & Display" icon={Target} sectionRef={unitsRef}
 autoOpen={scrollToSection === 'units'}>
 <div style={S.sub}>
 <span style={S.label}>Weight Unit</span>
 <div style={{ display:'flex', gap:'8px' }}>
 {[{id:'lbs',label:'Pounds (lbs)'},{id:'kg',label:'Kilograms (kg)'}].map(u => (
 <button key={u.id} onClick={ => upd('weightUnit', u.id)} style={S.pill(settings.weightUnit === u.id)}>
 {u.label}
 </button>
 ))}
 </div>
 </div>
 <div>
 <span style={S.label}>First Day of Week</span>
 <div style={{ display:'flex', gap:'8px' }}>
 {[{id:0,label:'Sun'},{id:1,label:'Mon'},{id:6,label:'Sat'}].map(d => (
 <button key={d.id} onClick={ => upd('firstDayOfWeek', d.id)}
 style={S.pillTeal(settings.firstDayOfWeek === d.id)}>
 {d.label}
 </button>
 ))}
 </div>
 </div>
 </SettingsSection>

 {/* =============== WORKOUT =============== */}
 <SettingsSection id="workout" title="Workout Behavior" icon={Clock} sectionRef={workoutRef}
 autoOpen={scrollToSection === 'workout'}>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Default rest timer</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="15" max="300" step="15" value={settings.defaultRestTimer}
 onChange={e => upd('defaultRestTimer', parseInt(e.target.value))} aria-label="Default rest timer" aria-valuetext={`${settings.defaultRestTimer} seconds`} style={S.slider} />
 <span style={S.val}>{settings.defaultRestTimer}s</span>
 </div>
 </div>
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Auto-start timer on set complete</span>
 <button onClick={ => upd('autoStartTimer', !settings.autoStartTimer)} role="switch" aria-checked={settings.autoStartTimer} style={S.toggle(settings.autoStartTimer)}>
 <div style={S.toggleDot(settings.autoStartTimer)} />
 </button>
 </div>
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Vibrate when rest timer ends</span>
 <button onClick={ => upd('timerVibrate', !settings.timerVibrate)} role="switch" aria-checked={settings.timerVibrate !== false} style={S.toggle(settings.timerVibrate !== false)}>
 <div style={S.toggleDot(settings.timerVibrate !== false)} />
 </button>
 </div>
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Keep screen awake during workout</span>
 <button onClick={ => upd('keepAwake', !settings.keepAwake)} role="switch" aria-checked={settings.keepAwake} style={S.toggle(settings.keepAwake)}>
 <div style={S.toggleDot(settings.keepAwake)} />
 </button>
 </div>
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Show RPE column</span>
 <button onClick={ => upd('showRPE', !settings.showRPE)} role="switch" aria-checked={settings.showRPE} style={S.toggle(settings.showRPE)}>
 <div style={S.toggleDot(settings.showRPE)} />
 </button>
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Weight increment (upper)</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="1" max="20" step="0.5" value={settings.weightIncrementUpper}
 onChange={e => upd('weightIncrementUpper', parseFloat(e.target.value))} aria-label="Weight increment for upper body" aria-valuetext={`${settings.weightIncrementUpper} ${settings.weightUnit}`} style={S.slider} />
 <span style={S.val}>{settings.weightIncrementUpper}{settings.weightUnit}</span>
 </div>
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Weight increment (lower)</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="1" max="20" step="0.5" value={settings.weightIncrementLower}
 onChange={e => upd('weightIncrementLower', parseFloat(e.target.value))} aria-label="Weight increment for lower body" aria-valuetext={`${settings.weightIncrementLower} ${settings.weightUnit}`} style={S.slider} />
 <span style={S.val}>{settings.weightIncrementLower}{settings.weightUnit}</span>
 </div>
 </div>
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Count warmup sets in stats</span>
 <button onClick={ => upd('countWarmupInStats', !settings.countWarmupInStats)} role="switch" aria-checked={settings.countWarmupInStats} style={S.toggle(settings.countWarmupInStats)}>
 <div style={S.toggleDot(settings.countWarmupInStats)} />
 </button>
 </div>
 </SettingsSection>

 {/* =============== RECOVERY =============== */}
 <SettingsSection id="recovery" title="Recovery & Programming" icon={Heart} sectionRef={recoveryRef}
 autoOpen={scrollToSection === 'recovery'}>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Muscle recovery window</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="24" max="96" step="12" value={settings.recoveryWindow}
 onChange={e => upd('recoveryWindow', parseInt(e.target.value))} aria-label="Muscle recovery window" aria-valuetext={`${settings.recoveryWindow} hours`} style={S.slider} />
 <span style={S.val}>{settings.recoveryWindow}hr</span>
 </div>
 </div>
 <div style={{ fontSize:'10px', color:T.text3, marginBottom:'8px', marginTop:'-4px' }}>
 48hr minimum recommended (adjust based on recovery needs). Controls muscle map color thresholds.
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Cardio sessions/week target</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="1" max="7" step="1" value={settings.cardioWeeklyTarget}
 onChange={e => upd('cardioWeeklyTarget', parseInt(e.target.value))} aria-label="Cardio sessions per week target" aria-valuetext={`${settings.cardioWeeklyTarget} sessions`} style={S.slider} />
 <span style={S.val}>{settings.cardioWeeklyTarget}</span>
 </div>
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Max RPE cap</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="7" max="10" step="0.5" value={settings.maxRPE}
 onChange={e => upd('maxRPE', parseFloat(e.target.value))} aria-label="Maximum RPE cap" aria-valuetext={`RPE ${settings.maxRPE}`} style={S.slider} />
 <span style={S.val}>{settings.maxRPE}</span>
 </div>
 </div>
 <div style={{ fontSize:'10px', color:T.text3, marginBottom:'8px', marginTop:'-4px' }}>
 Consider avoiding RPE 10 / training to failure. Default cap: 9.
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Zone 2 HR range (min)</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="90" max="160" step="5" value={settings.zone2HRMin}
 onChange={e => upd('zone2HRMin', parseInt(e.target.value))} aria-label="Zone 2 heart rate minimum" aria-valuetext={`${settings.zone2HRMin} BPM`} style={S.slider} />
 <span style={S.val}>{settings.zone2HRMin}</span>
 </div>
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Zone 2 HR range (max)</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="100" max="180" step="5" value={settings.zone2HRMax}
 onChange={e => upd('zone2HRMax', parseInt(e.target.value))} aria-label="Zone 2 heart rate maximum" aria-valuetext={`${settings.zone2HRMax} BPM`} style={S.slider} />
 <span style={S.val}>{settings.zone2HRMax}</span>
 </div>
 </div>
 {/* Body measurements */}
 <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:'12px', marginTop:'8px' }}>
 <span style={S.label}>Body Measurements</span>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
 <div>
 <div style={{ fontSize:'10px', color:T.text3, marginBottom:'4px' }}>Body Weight</div>
 <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <input type="number" inputMode="decimal" value={settings.bodyWeight} placeholder="—"
 onChange={e => upd('bodyWeight', e.target.value)}
 aria-label={`Body weight (${settings.weightUnit})`}
 style={{.S.input, textAlign:'center', padding:'8px' }} />
 <span style={{ fontSize:'11px', color:T.text3 }}>{settings.weightUnit}</span>
 </div>
 </div>
 <div>
 <div style={{ fontSize:'10px', color:T.text3, marginBottom:'4px' }}>Body Fat</div>
 <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <input type="number" inputMode="decimal" value={settings.bodyFatPct} placeholder="—"
 onChange={e => upd('bodyFatPct', e.target.value)}
 aria-label="Body fat percentage"
 style={{.S.input, textAlign:'center', padding:'8px' }} />
 <span style={{ fontSize:'11px', color:T.text3 }}>%</span>
 </div>
 </div>
 </div>
 </div>
 </SettingsSection>

 {/* =============== AI COACH =============== */}
 <SettingsSection id="coach" title="AI Coach" icon={MessageCircle} sectionRef={coachRef}
 autoOpen={scrollToSection === 'coach'}>
 {/* Enable/disable toggle */}
 <div style={{.S.rowBorder, paddingTop:0 }}>
 <div>
 <span style={{ fontSize:'14px', fontWeight:600, color:T.text }}>Enable AI Coach</span>
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'2px' }}>
 {settings.coachEnabled ? 'Coach tab visible in bottom nav' : 'Coach tab hidden — enable to use'}
 </div>
 </div>
 <button onClick={ => upd('coachEnabled', !settings.coachEnabled)} role="switch" aria-checked={settings.coachEnabled} style={S.toggle(settings.coachEnabled)}>
 <div style={S.toggleDot(settings.coachEnabled)} />
 </button>
 </div>

 {/* Progress Reports toggle */}
 <div style={{.S.rowBorder }}>
 <div>
 <span style={{ fontSize:'14px', fontWeight:600, color:T.text }}>Progress Reports</span>
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'2px' }}>
 {settings.reportsEnabled
 ? 'Weekly & monthly AI reports in Progress tab'
 : 'Reports hidden — enable to generate'}
 </div>
 </div>
 <button onClick={ => upd('reportsEnabled', !settings.reportsEnabled)} role="switch" aria-checked={settings.reportsEnabled} style={S.toggle(settings.reportsEnabled)}>
 <div style={S.toggleDot(settings.reportsEnabled)} />
 </button>
 </div>

 {settings.coachEnabled && (<>
 {/* Provider */}
 <div style={{.S.sub, marginTop:'12px' }}>
 <span style={S.label}>Provider</span>
 <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
 {Object.entries(PROVIDERS).map(([key, prov]) => (
 <button key={key} onClick={ => {
 const firstModel = PROVIDERS[key].models[0].id;
 onUpdateCoachCfg({.coachCfg, provider:key, model:firstModel });
 }} style={S.pill(coachCfg.provider === key)}>
 {prov.name}
 </button>
 ))}
 </div>
 </div>
 {/* API Key */}
 <div style={S.sub}>
 <span style={S.label}>{coachProvider.name} API Key</span>
 <input type="password" value={coachCfg.keys[coachCfg.provider] || ''} placeholder={coachProvider.keyPlaceholder}
 onChange={e => setCoachKey(coachCfg.provider, e.target.value)} aria-label={`${coachProvider.name} API key`} style={S.input} />
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'4px' }}>
 Stored locally. Sent only to {coachProvider.name}.
 </div>
 {/* Other keys indicator */}
 {Object.entries(PROVIDERS).filter(([k]) => k !== coachCfg.provider && coachCfg.keys[k]).map(([key, prov]) => (
 <div key={key} style={{ fontSize:'10px', color:T.success, marginTop:'4px' }}>✓ {prov.name} key saved</div>
 ))}
 </div>
 {/* Model */}
 <div style={S.sub}>
 <span style={S.label}>Model</span>
 <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
 {coachProvider.models.map(m => (
 <button key={m.id} onClick={ => updCoach('model', m.id)}
 style={{.S.pill(coachCfg.model === m.id), fontSize:'11px', padding:'5px 10px' }}>
 {m.label}
 {m.id !== '__custom__' && (
 <span style={{ fontSize:'9px', opacity:0.6, marginLeft:'4px' }}>
 ${m.cost.in}/{m.cost.out}
 </span>
 )}
 </button>
 ))}
 </div>
 {/* Custom model input for OpenRouter "Other" */}
 {coachCfg.model === '__custom__' && (
 <div style={{ marginTop:'8px' }}>
 <input type="text" value={coachCfg.customModel || ''} placeholder="org/model-name (e.g. mistralai/mistral-large)"
 onChange={e => updCoach('customModel', e.target.value)}
 aria-label="Custom model ID"
 style={{.S.input, fontFamily:T.mono, fontSize:'12px' }} />
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'4px' }}>
 Enter any model ID from <span style={{ color:T.teal }}>openrouter.ai/models</span>
 </div>
 </div>
 )}
 {coachCfg.model !== '__custom__' && (
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'4px' }}>$/Mtok input/output</div>
 )}
 </div>
 {/* Generation */}
 <div style={S.sub}>
 <span style={S.label}>Generation</span>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Max tokens</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="50" max="16000" step="50"
 value={Math.min(coachCfg.maxTokens, 16000)}
 onChange={e => updCoach('maxTokens', parseInt(e.target.value))} aria-label="Max tokens" aria-valuetext={`${coachCfg.maxTokens} tokens`} style={S.slider} />
 <input type="number" inputMode="numeric" value={coachCfg.maxTokens}
 onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v > 0) updCoach('maxTokens', v); }}
 aria-label="Max tokens value"
 style={{ width:'64px', padding:'4px 6px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'6px', color:T.text, fontSize:'12px', fontFamily:T.mono, textAlign:'center', outline:'none' }} />
 </div>
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Temperature</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="0" max="1" step="0.05" value={coachCfg.temperature}
 onChange={e => updCoach('temperature', parseFloat(e.target.value))} style={S.slider} />
 <span style={S.val}>{coachCfg.temperature}</span>
 </div>
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>History exchanges</span>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <input type="range" min="1" max="50" step="1"
 value={Math.min(coachCfg.maxHistory, 50)}
 onChange={e => updCoach('maxHistory', parseInt(e.target.value))} style={S.slider} />
 <input type="number" inputMode="numeric" value={coachCfg.maxHistory}
 onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v > 0) updCoach('maxHistory', v); }}
 style={{ width:'52px', padding:'4px 6px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'6px', color:T.text, fontSize:'12px', fontFamily:T.mono, textAlign:'center', outline:'none' }} />
 </div>
 </div>
 </div>
 {/* Context toggles */}
 <div style={S.sub}>
 <span style={S.label}>Context Sent Each Message</span>
 {[
 ['includePatientProfile', 'Patient profile (diagnoses, genetics)'],
 ['includeSessionContext', 'Session state (phase, XP, streak)'],
 ['includeCurrentWorkout', 'Current workout (logged sets)'],
 ['includeRecentActivity', 'Recent activity (7-day summary)'],
 ['includeBodyMetrics', 'Body metrics (weight, TDEE, intake, BF%)'],
 ].map(([key, label]) => (
 <div key={key} style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2, flex:1 }}>{label}</span>
 <button onClick={ => updCoach(key, !coachCfg[key])} role="switch" aria-checked={coachCfg[key]} style={S.toggle(coachCfg[key])}>
 <div style={S.toggleDot(coachCfg[key])} />
 </button>
 </div>
 ))}
 </div>
 {/* System prompt */}
 <div style={S.sub}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
 <span style={{.S.label, marginBottom:0 }}>System Prompt</span>
 <span style={{ fontSize:'10px', color:T.text3, fontFamily:T.mono }}>~{estimateTokens(coachCfg.systemPrompt)} tok</span>
 </div>
 <textarea value={coachCfg.systemPrompt} onChange={e => updCoach('systemPrompt', e.target.value)}
 rows={4} style={S.textarea} />
 <button onClick={ => updCoach('systemPrompt', DEFAULT_SYSTEM_PROMPT)}
 style={{ fontSize:'11px', color:T.teal, background:'none', border:'none', cursor:'pointer', marginTop:'4px', padding:0 }}>
 Reset to default
 </button>
 </div>
 {/* Patient profile */}
 <div style={S.sub}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
 <span style={{.S.label, marginBottom:0 }}>Patient Profile</span>
 <span style={{ fontSize:'10px', color:T.text3, fontFamily:T.mono }}>~{estimateTokens(coachCfg.patientProfile)} tok</span>
 </div>
 <textarea value={coachCfg.patientProfile} onChange={e => updCoach('patientProfile', e.target.value)}
 rows={6} style={{.S.textarea, minHeight:'120px' }} />
 <button onClick={ => updCoach('patientProfile', DEFAULT_PATIENT_PROFILE)}
 style={{ fontSize:'11px', color:T.teal, background:'none', border:'none', cursor:'pointer', marginTop:'4px', padding:0 }}>
 Reset to default
 </button>
 </div>
 {/* Cost estimate */}
 <div style={{ padding:'10px 12px', background:'rgba(255,255,255,0.02)', borderRadius:'10px' }}>
 <div style={{ fontSize:'10px', color:T.text3, marginBottom:'4px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>
 Estimated Per-Message Cost
 </div>
 <div style={{ fontSize:'12px', color:T.text2, lineHeight:1.6 }}>
 System+profile: ~{estimateTokens(buildFullSystemPrompt(coachCfg))} tok ·
 Model: {currentModel.label}{currentModel.id !== '__custom__' ? ` ($${currentModel.cost.in}/${currentModel.cost.out}/Mtok)` : ` (${coachCfg.customModel || 'not set'})`}
 </div>
 </div>
 </>)}
 </SettingsSection>

 {/* =============== BODY TRACKING =============== */}
 <SettingsSection id="bodyTracking" title="Body Tracking" icon={Scale} sectionRef={bodyTrackingRef}
 autoOpen={scrollToSection === 'bodyTracking'}>
 
 {/* Units */}
 <div style={S.sub}>
 <span style={S.label}>Units</span>
 <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
 <div style={{ flex:1, minWidth:'100px' }}>
 <span style={{ fontSize:'11px', color:T.text3, display:'block', marginBottom:'4px' }}>Weight</span>
 <div style={{ display:'flex', gap:'4px' }}>
 {['lbs','kg'].map(u => (
 <button key={u} onClick={ => upd('weightUnit', u)} style={S.pill(settings.weightUnit === u)}>{u}</button>
 ))}
 </div>
 </div>
 <div style={{ flex:1, minWidth:'100px' }}>
 <span style={{ fontSize:'11px', color:T.text3, display:'block', marginBottom:'4px' }}>Waist</span>
 <div style={{ display:'flex', gap:'4px' }}>
 {['in','cm'].map(u => (
 <button key={u} onClick={ => onUpdateNutritionConfig({.nutritionConfig, waistUnit: u })}
 style={S.pill(nutritionConfig.waistUnit === u)}>{u}</button>
 ))}
 </div>
 </div>
 </div>
 {/* Height (for waist-to-height ratio) */}
 <div style={{ marginTop: '10px' }}>
 <span style={{ fontSize:'11px', color:T.text3, display:'block', marginBottom:'4px' }}>
 Height {settings.weightUnit === 'kg' ? '(cm)' : '(inches)'} — used for waist-to-height ratio
 </span>
 <input type="text" inputMode="numeric" value={settings.heightInches || ''}
 onChange={e => upd('heightInches', e.target.value ? Number(e.target.value) : '')}
 placeholder={settings.weightUnit === 'kg' ? 'e.g. 178' : 'e.g. 70'}
 style={{
 width: '100px', padding: '6px 10px', background: 'rgba(255,255,255,0.04)',
 border: `1px solid ${T.border}`, borderRadius: '8px', color: T.text,
 fontSize: '13px', fontFamily: T.mono, outline: 'none',
 }} />
 </div>
 </div>

 {/* Weight Smoothing */}
 <div style={S.sub}>
 <span style={S.label}>Weight Smoothing Algorithm</span>
 {[
 { key:'ewma', label:'Exponential (20-day EWMA)', desc:'Best for TDEE calculation' },
 { key:'bidirectional', label:'Bidirectional smoothing', desc:'Psychologically motivating' },
 { key:'timeadaptive', label:'Time-adaptive EMA', desc:'Great for irregular weigh-ins' },
 ].map(m => (
 <div key={m.key} style={{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'6px 0',
 cursor:'pointer' }} onClick={ => onUpdateNutritionConfig({.nutritionConfig, smoothingMethod: m.key })}>
 <div style={{
 width:18, height:18, borderRadius:'50%', border:`2px solid ${nutritionConfig.smoothingMethod === m.key ? T.accent : T.text3}`,
 display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'1px',
 }}>
 {nutritionConfig.smoothingMethod === m.key && (
 <div style={{ width:10, height:10, borderRadius:'50%', background:T.accent }} />
 )}
 </div>
 <div>
 <div style={{ fontSize:'13px', fontWeight:nutritionConfig.smoothingMethod === m.key ? 600 : 400,
 color: nutritionConfig.smoothingMethod === m.key ? T.text : T.text2 }}>{m.label}</div>
 <div style={{ fontSize:'11px', color:T.text3 }}>{m.desc}</div>
 </div>
 </div>
 ))}
 {nutritionConfig.smoothingMethod === 'timeadaptive' && (
 <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0 0 28px' }}>
 <span style={{ fontSize:'12px', color:T.text2 }}>Smoothing days:</span>
 <input type="range" min={2} max={90} value={nutritionConfig.adaptiveSmoothingDays || 7}
 onChange={e => onUpdateNutritionConfig({.nutritionConfig, adaptiveSmoothingDays: Number(e.target.value) })}
 style={{ flex:1, accentColor:T.accent }} />
 <span style={S.val}>{nutritionConfig.adaptiveSmoothingDays || 7}</span>
 </div>
 )}
 </div>

 {/* Nutrition Goal */}
 <div style={S.sub}>
 <span style={S.label}>Nutrition Goal</span>
 <div style={{ display:'flex', gap:'6px', marginBottom:'10px' }}>
 {[{ key:'lose', label:'Lose' },{ key:'maintain', label:'Maintain' },{ key:'gain', label:'Gain' }].map(g => (
 <button key={g.key} onClick={ => onUpdateNutritionConfig({.nutritionConfig, goal: g.key })}
 style={S.pill(nutritionConfig.goal === g.key)}>{g.label}</button>
 ))}
 </div>
 {nutritionConfig.goal !== 'maintain' && (
 <div style={{ marginBottom:'10px' }}>
 <span style={{ fontSize:'11px', color:T.text3, display:'block', marginBottom:'4px' }}>
 Rate: {nutritionConfig.weeklyRatePercent || 0.5}% / week
 </span>
 <div style={{ display:'flex', gap:'4px' }}>
 {[0.25, 0.5, 0.75, 1.0].map(r => (
 <button key={r} onClick={ => onUpdateNutritionConfig({.nutritionConfig, weeklyRatePercent: r })}
 style={S.pill(nutritionConfig.weeklyRatePercent === r)}>{r}%</button>
 ))}
 </div>
 </div>
 )}
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Daily calorie target</span>
 <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
 <input type="text" inputMode="numeric" value={nutritionConfig.dailyCalorieTarget || ''}
 onChange={e => onUpdateNutritionConfig({.nutritionConfig, dailyCalorieTarget: Number(e.target.value) || 0 })}
 style={{.S.input, width:'80px', textAlign:'right', fontFamily:T.mono }} />
 <span style={{ fontSize:'12px', color:T.text3 }}>kcal</span>
 </div>
 </div>
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Daily protein target</span>
 <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
 <input type="text" inputMode="numeric" value={nutritionConfig.dailyProteinTarget || ''}
 onChange={e => onUpdateNutritionConfig({.nutritionConfig, dailyProteinTarget: Number(e.target.value) || 0 })}
 style={{.S.input, width:'60px', textAlign:'right', fontFamily:T.mono }} />
 <span style={{ fontSize:'12px', color:T.text3 }}>g</span>
 </div>
 </div>
 </div>

 {/* Weekly Calorie Budget — Day Multipliers */}
 <div style={S.sub}>
 <span style={S.label}>Weekly Calorie Budget</span>
 <div style={{ fontSize:'11px', color:T.text3, marginBottom:'8px' }}>
 Adjust per-day calories. Higher on training/weekend days. Weekly total stays constant.
 </div>
 {['mon','tue','wed','thu','fri','sat','sun'].map(day => {
 const mult = nutritionConfig.dayMultipliers?.[day] ?? 1.0;
 const dayCals = Math.round((nutritionConfig.dailyCalorieTarget || 2200) * mult);
 return (
 <div key={day} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 0' }}>
 <span style={{ fontSize:'12px', color:T.text2, width:'30px', textTransform:'capitalize' }}>{day}</span>
 <input type="range" min={0.7} max={1.4} step={0.05} value={mult}
 onChange={e => {
 const newMult = Number(e.target.value);
 const mults = {.(nutritionConfig.dayMultipliers || {mon:1,tue:1,wed:1,thu:1,fri:1,sat:1,sun:1}) };
 const oldMult = mults[day];
 mults[day] = newMult;
 // Rebalance other days to keep sum = 7
 const otherDays = Object.keys(mults).filter(d => d !== day);
 const otherSum = otherDays.reduce((a, d) => a + mults[d], 0);
 const targetOtherSum = 7 - newMult;
 if (otherSum > 0 && targetOtherSum > 0) {
 const scale = targetOtherSum / otherSum;
 otherDays.forEach(d => {
 mults[d] = Math.max(0.5, Math.round(mults[d] * scale * 100) / 100);
 });
 // Correct rounding drift: adjust largest multiplier day
 const currentSum = Object.values(mults).reduce((a, v) => a + v, 0);
 const drift = 7 - currentSum;
 if (Math.abs(drift) > 0.01) {
 const largestOther = otherDays.reduce((best, d) => mults[d] > mults[best] ? d : best, otherDays[0]);
 mults[largestOther] = Math.max(0.5, Math.round((mults[largestOther] + drift) * 100) / 100);
 }
 }
 onUpdateNutritionConfig({.nutritionConfig, dayMultipliers: mults });
 }}
 style={{ flex:1, accentColor:T.accent }} />
 <span style={{ fontSize:'12px', fontFamily:T.mono, color:T.text, width:'55px', textAlign:'right' }}>
 {dayCals.toLocaleString}
 </span>
 </div>
 );
 })}
 <div style={{ fontSize:'11px', color:T.text3, textAlign:'right', padding:'4px 0' }}>
 Weekly: {Math.round((nutritionConfig.dailyCalorieTarget || 2200) * 7).toLocaleString} kcal
 </div>
 </div>

 {/* Adaptive TDEE */}
 <div style={S.sub}>
 <span style={S.label}>Adaptive TDEE</span>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Current estimate</span>
 <span style={{ fontSize:'14px', fontFamily:T.mono, fontWeight:600, color:T.accent }}>
 {(nutritionConfig.estimatedTDEE || 2500).toLocaleString} kcal/day
 </span>
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Confidence</span>
 <span style={{ fontSize:'13px', color:
 nutritionConfig.tdeeConfidence === 'high' ? T.teal :
 nutritionConfig.tdeeConfidence === 'medium' ? T.warn : T.text3 }}>
 {(nutritionConfig.tdeeConfidence || 'low').charAt(0).toUpperCase + (nutritionConfig.tdeeConfidence || 'low').slice(1)}
 {' '}
 {nutritionConfig.tdeeConfidence === 'high' ? '●●●●●' :
 nutritionConfig.tdeeConfidence === 'medium' ? '●●●○○' : '●○○○○'}
 </span>
 </div>
 <button onClick={ => {
 onUpdateNutritionConfig({.nutritionConfig, estimatedTDEE: nutritionConfig.initialTDEE || 2500, tdeeConfidence: 'low', tdeeHistory: [] });
 }} style={{
 marginTop:'8px', padding:'8px 14px', background:'rgba(255,255,255,0.04)',
 border:`1px solid ${T.border}`, borderRadius:'8px', color:T.text2, fontSize:'12px', cursor:'pointer',
 }}>
 Reset TDEE estimate
 </button>
 </div>
 </SettingsSection>

 {/* =============== CALIBRATION =============== */}
 <SettingsSection id="calibration" title="Body Composition Calibration" icon={Target} sectionRef={calibrationRef}
 autoOpen={scrollToSection === 'calibration'}>
 
 {/* Device */}
 <div style={S.sub}>
 <span style={S.label}>Scale Device</span>
 <input type="text" value={calibration.deviceId || ''} placeholder="e.g. "
 onChange={e => onUpdateCalibration({.calibration, deviceId: e.target.value })}
 style={S.input} />
 </div>

 {/* Calibration Method */}
 <div style={S.sub}>
 <span style={S.label}>Calibration Method</span>
 {[
 { key:'simple_offset', label:'Simple offset', req:1 },
 { key:'linear_regression', label:'Linear regression', req:2 },
 { key:'rolling_weighted', label:'Rolling weighted avg', req:2 },
 { key:'bayesian', label:'Bayesian', req:1 },
 ].map(m => {
 const locked = (calibration.points?.length || 0) < m.req;
 return (
 <div key={m.key} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'6px 0',
 cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.4 : 1,
 }} onClick={ => !locked && onUpdateCalibration(recalcCalibration({.calibration, method: m.key }))}>
 <div style={{
 width:18, height:18, borderRadius:'50%', border:`2px solid ${calibration.method === m.key && !locked ? T.accent : T.text3}`,
 display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
 }}>
 {calibration.method === m.key && !locked && (
 <div style={{ width:10, height:10, borderRadius:'50%', background:T.accent }} />
 )}
 </div>
 <span style={{ fontSize:'13px', color: locked ? T.text3 : T.text2 }}>{m.label}</span>
 {locked && <Lock size={12} color={T.text3} />}
 {locked && <span style={{ fontSize:'10px', color:T.text3 }}>({m.req}+ DEXA)</span>}
 </div>
 );
 })}
 </div>

 {/* Calibration Points */}
 <div style={S.sub}>
 <span style={S.label}>Calibration Points</span>
 {(calibration.points || []).map((pt, i) => (
 <div key={i} style={{
 padding:'8px 12px', background:'rgba(255,255,255,0.03)', borderRadius:'8px',
 border:`1px solid ${T.border}`, marginBottom:'6px', fontSize:'12px',
 }}>
 <div style={{ display:'flex', justifyContent:'space-between', color:T.text2 }}>
 <span>{pt.date}</span>
 <button onClick={ => {
 const pts = [.(calibration.points || [])];
 pts.splice(i, 1);
 onUpdateCalibration(recalcCalibration({.calibration, points: pts }));
 }} style={{ background:'none', border:'none', cursor:'pointer', padding:'10px',
 minWidth:'44px', minHeight:'44px', display:'flex', alignItems:'center', justifyContent:'center' }}>
 <X size={14} color={T.text3} />
 </button>
 </div>
 <div style={{ display:'flex', gap:'12px', marginTop:'4px', fontFamily:T.mono }}>
 <span>BIA: <span style={{ color:T.text }}>{pt.biaValue}%</span></span>
 <span>DEXA: <span style={{ color:T.teal }}>{pt.dexaValue}%</span></span>
 <span style={{ color:T.text3 }}>Offset: +{(pt.dexaValue - pt.biaValue).toFixed(1)}%</span>
 </div>
 </div>
 ))}

 {/* Add calibration point form */}
 <CalibrationPointForm onAdd={(pt) => {
 const pts = [.(calibration.points || []), pt];
 pts.sort((a, b) => a.date.localeCompare(b.date));
 onUpdateCalibration(recalcCalibration({.calibration, points: pts }));
 }} />
 </div>

 {/* Active Model Display */}
 {(calibration.points?.length || 0) > 0 && (
 <div style={S.sub}>
 <span style={S.label}>Active Model</span>
 <div style={{ padding:'10px 12px', background:'rgba(78,205,196,0.04)', borderRadius:'8px',
 border:`1px solid rgba(78,205,196,0.1)`, fontSize:'12px' }}>
 <div style={{ color:T.text2, marginBottom:'4px' }}>
 Method: <span style={{ color:T.text, fontWeight:600 }}>{calibration.method?.replace(/_/g, ' ')}</span>
 </div>
 <div style={{ color:T.text2, marginBottom:'4px', fontFamily:T.mono }}>
 {calibration.method === 'simple_offset' && `BF% = BIA + ${calibration.offset || 0}%`}
 {calibration.method === 'linear_regression' && calibration.slope != null && `BF% = ${calibration.intercept} + ${calibration.slope} × BIA (R²=${calibration.rSquared})`}
 {calibration.method === 'linear_regression' && calibration.slope == null && `BF% = BIA + ${calibration.offset || 0}% (fallback)`}
 {calibration.method === 'rolling_weighted' && `BF% = BIA + ${calibration.ewmaOffset || calibration.offset || 0}%`}
 {calibration.method === 'bayesian' && calibration.posterior?.mean != null && `BF% = BIA + ${calibration.posterior.mean}% (posterior)`}
 </div>
 <div style={{ color:T.text3 }}>
 Last calibrated: {calibration.lastCalibrationDate || 'never'}
 </div>
 </div>
 </div>
 )}

 {/* Staleness warning */}
 {calibration.lastCalibrationDate && ( => {
 const daysSince = Math.floor((Date.now - new Date(calibration.lastCalibrationDate + 'T12:00:00').getTime) / 86400000);
 return daysSince > (calibration.stalenessWarningDays || 180) ? (
 <div style={{ padding:'8px 12px', background:T.warnSoft, borderRadius:'8px',
 border:`1px solid rgba(255,183,77,0.2)`, fontSize:'12px', color:T.warn }}>
 <AlertTriangle size={14} style={{ verticalAlign:'middle', marginRight:'6px' }} />
 Last calibration was {daysSince} days ago. Consider getting a new DEXA scan.
 </div>
 ) : null;
 })}
 </SettingsSection>

 {/* =============== DATA =============== */}
 <SettingsSection id="data" title="Data Management" icon={Database} sectionRef={dataRef}
 autoOpen={scrollToSection === 'data'}>
 <div style={{ fontSize:'12px', color:T.text2, marginBottom:'12px' }}>
 Storage used: <span style={{ fontFamily:T.mono, color:T.text }}>{storageUsed} KB</span> · {LS.keys('').length} keys
 </div>
 <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
 <button onClick={exportData} style={{
 display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px',
 background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:'10px',
 cursor:'pointer', color:T.text, fontSize:'13px', fontWeight:500,
 }}>
 <Download size={16} color={T.teal} />
 Export all data (JSON)
 </button>
 <button onClick={importData} style={{
 display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px',
 background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:'10px',
 cursor:'pointer', color:T.text, fontSize:'13px', fontWeight:500,
 }}>
 <Upload size={16} color={T.teal} />
 Import data (JSON)
 </button>
 {!confirmReset ? (
 <button onClick={ => setConfirmReset(true)} style={{
 display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px',
 background:'rgba(255,82,82,0.06)', border:`1px solid rgba(255,82,82,0.15)`, borderRadius:'10px',
 cursor:'pointer', color:T.danger, fontSize:'13px', fontWeight:500,
 }}>
 <Trash2 size={16} />
 Clear all data
 </button>
 ) : (
 <div style={{ padding:'12px 16px', background:'rgba(255,82,82,0.08)', borderRadius:'10px',
 border:`1px solid rgba(255,82,82,0.2)` }}>
 <div style={{ fontSize:'13px', color:T.danger, fontWeight:600, marginBottom:'8px' }}>
 ⚠ This will permanently delete all data including workouts, settings, and API keys.
 </div>
 <div style={{ display:'flex', gap:'8px' }}>
 <button onClick={clearAllData} style={{
 flex:1, padding:'10px', background:T.danger, border:'none', borderRadius:'8px',
 color:'#fff', fontWeight:600, fontSize:'12px', cursor:'pointer',
 }}>Yes, delete everything</button>
 <button onClick={ => setConfirmReset(false)} style={{
 flex:1, padding:'10px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'8px', color:T.text2, fontWeight:600, fontSize:'12px', cursor:'pointer',
 }}>Cancel</button>
 </div>
 </div>
 )}
 </div>
 </SettingsSection>

 {/* Version */}
 <div style={{ textAlign:'center', marginTop:'20px', fontSize:'11px', color:T.text3 }}>
 NeuroFit v0.5 · Data stored locally
 <div style={{ marginTop:'8px', padding:'10px', background:'rgba(128,128,128,0.08)', borderRadius:'8px', fontSize:'10px', color:T.text3 }}>
 <strong>Disclaimer:</strong> This app is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Consult a physician and/or physical therapist before starting any exercise program. The creators assume no liability for injuries or damages resulting from use of this app.
 <br/><br/>
 <strong>Privacy:</strong> All data is stored locally on your device. If you use the AI Coach, your data is sent directly to your selected API provider and is subject to their privacy policy.
 </div>
 </div>
 </div>
 );
}

// --- Main Coach Component ---

function CoachTab({ profile, workout, rehabStatus, cardioLog, history, coachCfg, goToSettings }) {
 const [messages, setMessages] = useState([
 { role:'assistant', content:"Hey! I'm your AI coach. Ask me about exercises, form, programming, or recovery. Tap ⚙ to configure provider and model in Settings.", local:true }
 ]);
 const [input, setInput] = useState('');
 const [loading, setLoading] = useState(false);
 const [lastUsage, setLastUsage] = useState(null);
 const chatRef = useRef(null);

 const cfg = coachCfg;
 const provider = PROVIDERS[cfg.provider] || PROVIDERS.anthropic;
 const currentModel = cfg.model === '__custom__'
 ? { id:'__custom__', label: cfg.customModel || 'Custom', cost:{in:0,out:0,cached:0} }
 : (provider.models.find(m => m.id === cfg.model) || provider.models[0]);
 const hasKey = !!(cfg.keys[cfg.provider]);

 const scrollToBottom = => {
 setTimeout( => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior:'smooth' }), 100);
 };

 const sendMessage = async => {
 if (!input.trim || !hasKey || loading) return;
 const userMsg = { role:'user', content: input.trim };
 const newMsgs = [.messages, userMsg];
 setMessages(newMsgs);
 setInput('');
 setLoading(true);
 scrollToBottom;

 try {
 const systemPrompt = buildFullSystemPrompt(cfg);
 const ctx = buildSessionContext(profile, workout, rehabStatus, cardioLog, history, cfg);
 const trimmed = trimHistory(newMsgs, cfg.maxHistory);

 // Inject dynamic context into last user message
 const apiMessages = trimmed.map((m, i) => {
 if (i === trimmed.length - 1 && m.role === 'user') {
 const prefix = ctx ? `[CTX: ${ctx}]\n` : '';
 return { role:'user', content: prefix + m.content };
 }
 return { role:m.role, content:m.content };
 });

 const dispatcher = DISPATCH[cfg.provider];
 if (!dispatcher) throw new Error(`Unknown provider: ${cfg.provider}`);

 const result = await dispatcher(cfg, systemPrompt, apiMessages);
 setLastUsage(result.usage);
 setMessages(prev => [.prev, { role:'assistant', content: result.text || 'Empty response.' }]);
 } catch(e) {
 setMessages(prev => [.prev, { role:'assistant', content: `Error: ${e.message}`, local:true }]);
 }
 setLoading(false);
 scrollToBottom;
 };

 const costInfo = useMemo( => estimateCost(lastUsage, currentModel), [lastUsage, currentModel]);

 // --- No key: show setup prompt ---
 if (!hasKey) {
 return (
 <div style={{ animation:'fadeIn 0.3s ease-out', paddingTop:'40px', textAlign:'center' }}>
 <div style={{ width:64, height:64, borderRadius:'20px', background:T.tealGlow,
 display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
 <MessageCircle size={28} color={T.teal} />
 </div>
 <h2 style={{ fontSize:'20px', fontWeight:700, marginBottom:'8px' }}>AI Coach</h2>
 <p style={{ fontSize:'13px', color:T.text2, marginBottom:'24px', lineHeight:1.5 }}>
 Get personalized advice about exercises,<br/>form, recovery, and programming.
 </p>
 <button onClick={ => goToSettings?.('coach')}
 style={{ padding:'14px 32px', background:T.teal, border:'none', borderRadius:'12px',
 color:'#07070E', fontWeight:600, fontSize:'14px', cursor:'pointer' }}>
 Configure Provider & API Key
 </button>
 </div>
 );
 }

 // --- Chat view ---
 return (
 <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 140px)', animation:'fadeIn 0.3s ease-out' }}>
 {/* Header */}
 <div style={{ marginBottom:'8px' }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
 <h2 style={{ fontSize:'20px', fontWeight:700 }}>AI Coach</h2>
 <button onClick={ => goToSettings?.('coach')}
 style={{ background:'none', border:'none', color:T.text3, cursor:'pointer', padding:'8px', display:'flex', alignItems:'center', gap:'4px' }}>
 <Settings size={16} />
 </button>
 </div>

 {/* Model pill + cost */}
 <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
 <span style={{ fontSize:'11px', fontWeight:600, color:T.teal, background:T.tealGlow,
 padding:'3px 8px', borderRadius:'6px' }}>
 {provider.name} · {currentModel.label}
 </span>
 {costInfo && (
 <span style={{ fontSize:'10px', color:T.text3, fontFamily:T.mono }}>
 {costInfo.cost} · {costInfo.input}in/{costInfo.output}out
 {costInfo.pctCached > 0 && <span style={{ color:T.teal }}> · {costInfo.pctCached}%cached</span>}
 </span>
 )}
 </div>
 </div>

 {/* Messages */}
 <div ref={chatRef} role="log" aria-live="polite" aria-label="Chat messages" style={{ flex:1, overflowY:'auto', marginBottom:'12px', paddingRight:'4px' }}>
 {messages.map((msg, i) => (
 <div key={i} style={{
 display:'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
 marginBottom:'10px', animation:'fadeUp 0.2s ease-out',
 }}>
 <div style={{
 maxWidth:'85%', padding:'12px 16px', borderRadius:'16px',
 background: msg.role === 'user' ? T.accent : T.bgCard,
 border: msg.role === 'user' ? 'none' : `1px solid ${T.border}`,
 color: msg.role === 'user' ? '#fff' : T.text,
 fontSize:'14px', lineHeight:1.5, whiteSpace:'pre-wrap',
 }}>
 {msg.content}
 </div>
 </div>
 ))}
 {loading && (
 <div style={{ display:'flex', justifyContent:'flex-start', marginBottom:'10px' }}>
 <div style={{ padding:'12px 16px', borderRadius:'16px', background:T.bgCard,
 border:`1px solid ${T.border}`, fontSize:'14px', color:T.text3 }}>
 Thinking.
 </div>
 </div>
 )}
 </div>

 {/* Input */}
 <div style={{ display:'flex', gap:'8px' }}>
 <input value={input} onChange={e => setInput(e.target.value)}
 onKeyDown={e => e.key === 'Enter' && sendMessage}
 placeholder="Ask about exercises, form, recovery."
 aria-label="Message to AI coach"
 style={{ flex:1, padding:'14px 16px', background:T.bgCard, border:`1px solid ${T.border}`,
 borderRadius:'14px', color:T.text, fontSize:'14px', outline:'none' }} />
 <button onClick={sendMessage} disabled={loading || !input.trim} aria-label="Send message"
 style={{ width:48, height:48, borderRadius:'14px', border:'none',
 background: input.trim ? T.teal : 'rgba(255,255,255,0.04)',
 display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
 transition:'all 0.2s', opacity: input.trim ? 1 : 0.5 }}>
 <Send size={18} color={input.trim ? '#07070E' : T.text3} />
 </button>
 </div>
 </div>
 );
}

// ============================================================
// MAIN APP
// ============================================================

export default function App {
 const [tab, setTab] = useState('today');
 const [restTimers, setRestTimers] = useState({}); // { exerciseId: endTimeMs } — lives in App so it survives tab switches
 const [settingsSection, setSettingsSection] = useState(null);
 const [profile, setProfile] = useState( => LS.get('profile', { phase:'acute', location:'gym', xp:0, streak:0, lastActive:'' }));
 const [settings, setSettings] = useState( => LS.get('appSettings', DEFAULT_SETTINGS));
 const [workout, setWorkout] = useState( => {
 const raw = LS.get(dayKey('workout'), null);
 if (!raw) return null;
 return normalizeWorkout(raw);
 });
 const [rehabStatus, setRehabStatus] = useState( => LS.get(dayKey('rehab'), {}));
 const [cardioLog, setCardioLog] = useState( => LS.get(dayKey('cardio'), []));
 const [history, setHistory] = useState( => LS.get('history', {}));
 const [toast, setToast] = useState(null);
 const [coachCfg, setCoachCfg] = useState( => LS.get('coachCfg', DEFAULT_COACH_CONFIG));
 const [nutritionConfig, setNutritionConfig] = useState( => LS.get('nutritionConfig', DEFAULT_NUTRITION_CONFIG));
 const [calibration, setCalibration] = useState( => LS.get('bfCalibration', DEFAULT_CALIBRATION));
 const [disclaimerAccepted, setDisclaimerAccepted] = useState( => LS.get('disclaimerAccepted', false));

 // Persist
 useEffect( => { LS.set('profile', profile); }, [profile]);
 useEffect( => { LS.set('appSettings', settings); }, [settings]);
 useEffect( => { LS.set(dayKey('workout'), workout); }, [workout]);
 useEffect( => { LS.set(dayKey('rehab'), rehabStatus); }, [rehabStatus]);
 useEffect( => { LS.set(dayKey('cardio'), cardioLog); }, [cardioLog]);
 useEffect( => { LS.set('history', history); }, [history]);
 useEffect( => { LS.set('coachCfg', coachCfg); }, [coachCfg]);
 useEffect( => { LS.set('nutritionConfig', nutritionConfig); }, [nutritionConfig]);
 useEffect( => { LS.set('bfCalibration', calibration); }, [calibration]);
 useEffect( => { LS.set('disclaimerAccepted', disclaimerAccepted); }, [disclaimerAccepted]);

 // Cross-tab sync: detect when another tab modifies critical data
 useEffect( => {
 const handleStorageChange = (e) => {
 // Only react to workout or profile changes from other tabs
 const criticalKeys = [dayKey('workout'), 'profile', 'history'];
 if (e.key && criticalKeys.includes(e.key) && e.newValue !== e.oldValue) {
 // Check if current tab has unsaved work
 const hasWork = workout?.exercises?.some(ex => ex.logSets?.some(s => s.done));
 if (hasWork) {
 showToast('Another tab updated your data. Refresh to sync.', 0);
 } else {
 // No active work — safe to auto-reload state
 try {
 if (e.key === dayKey('workout')) {
 const raw = e.newValue ? JSON.parse(e.newValue) : null;
 setWorkout(raw ? normalizeWorkout(raw) : null);
 } else if (e.key === 'profile') {
 setProfile(e.newValue ? JSON.parse(e.newValue) : profile);
 }
 } catch { /* ignore parse errors */ }
 }
 }
 };
 window.addEventListener('storage', handleStorageChange);
 return => window.removeEventListener('storage', handleStorageChange);
 }, [workout]); // eslint-disable-line react-hooks/exhaustive-deps

 // Migration: ensure profile has streaks, populate nutritionConfig from existing settings
 useEffect( => {
 // Ensure streaks exist on profile
 if (!profile.streaks) {
 setProfile(p => ({.p, streaks: p.streaks || DEFAULT_STREAKS }));
 }
 // Migrate body weight / body fat from settings to nutritionConfig defaults
 if (settings.bodyWeight && nutritionConfig === DEFAULT_NUTRITION_CONFIG) {
 const bw = Number(settings.bodyWeight);
 if (bw > 0) {
 const isLbs = (settings.weightUnit || 'lbs') === 'lbs';
 const bwLbs = isLbs ? bw : bw * 2.205;
 // Estimate TDEE as bodyweight × 15 (rough maintenance multiplier)
 const estTDEE = Math.round(bwLbs * 15);
 setNutritionConfig(prev => ({
.prev,
 initialTDEE: prev.initialTDEE === 2500 ? estTDEE : prev.initialTDEE,
 estimatedTDEE: prev.estimatedTDEE === 2500 ? estTDEE : prev.estimatedTDEE,
 weightUnit: settings.weightUnit || prev.weightUnit,
 }));
 }
 }
 }, []); // eslint-disable-line react-hooks/exhaustive-deps

 // Deep-link to settings: sets both tab and section, clears section after scroll
 const goToSettings = useCallback((section) => {
 setSettingsSection(section || null);
 setTab('settings');
 }, []);

 // Clear section marker when leaving settings
 useEffect( => {
 if (tab !== 'settings') setSettingsSection(null);
 }, [tab]);

 // Redirect away from coach tab if coach gets disabled
 useEffect( => {
 if (tab === 'coach' && !settings.coachEnabled) setTab('today');
 }, [tab, settings.coachEnabled]);

 // Streak management
 useEffect( => {
 const t = today;
 if (profile.lastActive && profile.lastActive !== t) {
 const last = new Date(profile.lastActive);
 const now = new Date(t);
 const diff = Math.floor((now - last) / (1000*60*60*24));
 if (diff > 1) {
 setProfile(p => ({.p, streak: 0 }));
 }
 }
 }, []);

 const showToast = (message, xp) => {
 setToast({ message, xp });
 setTimeout( => setToast(null), 2500);
 };

 const addXP = (amount, message) => {
 setProfile(p => ({.p, xp: p.xp + amount, lastActive: today }));
 showToast(message, amount);
 };

 const markActive = (type) => {
 const t = today;
 setHistory(prev => {
 const acts = prev[t] || [];
 if (!acts.includes(type)) return {.prev, [t]: [.acts, type] };
 return prev;
 });
 // Update streak
 setProfile(p => {
 if (p.lastActive !== t) {
 const last = new Date(p.lastActive || t);
 const now = new Date(t);
 const diff = Math.floor((now - last) / (1000*60*60*24));
 const newStreak = diff <= 1 ? p.streak + 1 : 1;
 return {.p, streak: newStreak, lastActive: t };
 }
 return p;
 });
 };

 const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);

 const handleGenerateWorkout = (overrides = {}) => {
 if (isGeneratingWorkout) return; // Prevent double-click

 // Warn before overwriting a workout with logged data
 const currentExercises = workout?.exercises || [];
 const hasLoggedSets = currentExercises.some(e => e.logSets?.some(s => s.done));
 if (hasLoggedSets) {
 if (!window.confirm('You have logged sets in your current workout. Generating a new workout will discard this data. Continue?')) {
 return;
 }
 }

 setIsGeneratingWorkout(true);
 const recentWorkouts = Object.entries(history)
.filter(([date, acts]) => acts.includes('workout'))
.sort((a, b) => b[0].localeCompare(a[0]))
.slice(0, 3)
.map(([date]) => LS.get(`workout:${date}`, null))
.filter(Boolean);
 
 const w = generateWorkout(profile.phase, profile.location, recentWorkouts, settings, overrides);
 const splitDayName = w._splitDay || 'full_body';
 // Filter to just exercise objects (strip _splitDay meta property)
 const exercises = [.w].filter(ex => ex && ex.id);
 
 setWorkout({
 date: today,
 splitDay: splitDayName,
 weekId: getWeekId,
 exercises,
 sessionRPE: null,
 durationMinutes: null,
 version: 2,
 });
 // Re-enable after a short delay to prevent rapid re-clicks
 setTimeout( => setIsGeneratingWorkout(false), 500);
 };

 const handleUpdateExercise = (updatedEx, replaceId) => {
 if (!workout?.exercises) return;
 const matchId = replaceId || updatedEx.id;
 const newExercises = workout.exercises.map(ex => ex.id === matchId ? updatedEx : ex);
 // Auto-track workout start time on first set completion
 const hadAnyDone = workout.exercises.some(e => e.logSets?.some(s => s.done));
 const hasAnyDone = newExercises.some(e => e.logSets?.some(s => s.done));
 const startedAt = (!hadAnyDone && hasAnyDone && !workout.startedAt) ? Date.now : workout.startedAt;
 const newWorkout = {.workout, exercises: newExercises, startedAt };
 setWorkout(newWorkout);
 if (replaceId && replaceId !== updatedEx.id) return;
 const oldEx = workout.exercises.find(e => e.id === updatedEx.id);
 const oldDone = oldEx?.logSets?.filter(s => s.done).length || 0;
 const newDone = updatedEx.logSets?.filter(s => s.done).length || 0;
 if (newDone > oldDone) { addXP(XP_REWARDS.set, 'Set complete!'); }
 const wasComplete = oldEx?.logSets?.every(s => s.done);
 const isComplete = updatedEx.logSets?.every(s => s.done);
 if (!wasComplete && isComplete) {
 addXP(XP_REWARDS.exercise, `${updatedEx.name} done!`);
 markActive('workout');
 }
 };

 const handleSessionMeta = ({ sessionRPE, durationMinutes, sessionNotes }) => {
 if (!workout) return;
 const update = {.workout };
 if (sessionRPE !== undefined) update.sessionRPE = sessionRPE;
 if (durationMinutes !== undefined) update.durationMinutes = durationMinutes;
 if (sessionNotes !== undefined) update.sessionNotes = sessionNotes;
 setWorkout(update);
 };

 const handleRemoveExercise = (exerciseId) => {
 if (!workout?.exercises) return;
 const newExercises = workout.exercises.filter(ex => ex.id !== exerciseId);
 setWorkout({.workout, exercises: newExercises });
 };

 const handleToggleRehab = (id) => {
 const newStatus = {.rehabStatus, [id]: !rehabStatus[id] };
 setRehabStatus(newStatus);
 
 if (!rehabStatus[id]) {
 const allDone = DAILY_REHAB.every(r => r.id === id ? true : newStatus[r.id]);
 if (allDone) {
 addXP(XP_REWARDS.rehab, 'Rehab complete!');
 }
 markActive('rehab');
 }
 };

 const handleLogCardio = (cardio, duration, hr) => {
 const entry = { id: cardio.id, name: cardio.name, duration, hr, date: new Date.toISOString };
 setCardioLog(prev => [.prev, entry]);
 addXP(XP_REWARDS.cardio, `${cardio.name} logged!`);
 markActive('cardio');
 };

 const handleSaveBodyLog = (log, calPoint) => {
 // Save the body log
 LS.set(`bodyLog:${log.date}`, log);
 markActive('bodyLog');

 // Update streaks
 setProfile(p => {
 let streaks = {.(p.streaks || DEFAULT_STREAKS) };
 let xpToAdd = 0;
 
 if (log.weight) {
 streaks = updateStreaks(streaks, 'weightLog', log.date);
 xpToAdd += BODY_XP.weightLog;
 }
 if (log.calories && log.protein) {
 streaks = updateStreaks(streaks, 'nutritionLog', log.date);
 xpToAdd += BODY_XP.nutritionFull;
 }
 if (log.weight && log.calories) {
 streaks = checkCombinedStreak(streaks, log.date);
 }
 // Bonus XP for all fields
 if (log.weight && log.calories && log.protein && log.bodyFat) {
 xpToAdd += BODY_XP.allFields;
 }
 // Streak milestones
 const combined = streaks.combined?.current || 0;
 if (combined === 7) xpToAdd += BODY_XP.streak7;
 if (combined === 30) xpToAdd += BODY_XP.streak30;

 return {.p, streaks, xp: p.xp + xpToAdd, lastActive: today };
 });

 if (log.weight || (log.calories && log.protein)) {
 showToast('Body log saved!', BODY_XP.weightLog);
 }

 // Auto-add calibration point if DEXA
 if (calPoint) {
 setCalibration(prev => {
 const pts = [.(prev.points || []), calPoint];
 pts.sort((a, b) => a.date.localeCompare(b.date));
 return recalcCalibration({.prev, points: pts });
 });
 }

 // Update TDEE if we have enough data
 const allLogs = loadBodyLogs;
 const { tdee, confidence } = updateExpenditure(allLogs, nutritionConfig);
 if (tdee !== nutritionConfig.estimatedTDEE) {
 setNutritionConfig(prev => ({
.prev,
 estimatedTDEE: tdee,
 tdeeConfidence: confidence,
 tdeeHistory: [.(prev.tdeeHistory || []), { date: log.date, value: tdee }].slice(-365),
 }));
 }
 };

 const updateProfile = (updates) => {
 setProfile(p => ({.p,.updates }));
 if (updates.phase || updates.location) {
 setWorkout(null); // Reset workout when settings change
 }
 };

 const level = LEVELS.find((l, i) => (LEVELS[i+1]?.xp || Infinity) > profile.xp) || LEVELS[0];

 const tabs = [
 { id:'today', icon:Dumbbell, label:'Train' },
 { id:'rehab', icon:Heart, label:'Rehab' },
 { id:'cardio', icon:Activity, label:'Cardio' },
 { id:'progress', icon:TrendingUp, label:'Progress' },
.(settings.coachEnabled ? [{ id:'coach', icon:MessageCircle, label:'Coach' }] : []),
 ];

 return (
 <>
 <style>{css}</style>
 {!disclaimerAccepted && (
 <div style={{ position:'fixed', inset:0, zIndex:99999, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
 <div style={{ background:T.bg, borderRadius:'16px', padding:'24px', maxWidth:'400px', width:'100%', maxHeight:'80vh', overflow:'auto' }}>
 <div style={{ fontSize:'20px', fontWeight:700, marginBottom:'12px', textAlign:'center', color:T.text }}>Welcome to NeuroFit</div>
 <div style={{ fontSize:'13px', lineHeight:'1.6', color:T.text2, marginBottom:'16px' }}>
 <p style={{ marginBottom:'10px' }}><strong style={{ color:T.text }}>Medical Disclaimer:</strong> This app is for <strong>informational purposes only</strong> and does not constitute medical advice, diagnosis, or treatment.</p>
 <p style={{ marginBottom:'10px' }}>Please <strong>consult a physician and/or licensed physical therapist</strong> before beginning any exercise program, especially if you have pre-existing injuries or medical conditions.</p>
 <p style={{ marginBottom:'10px' }}>The creators of this app <strong>assume no liability</strong> for any injuries or damages resulting from its use.</p>
 <p style={{ marginBottom:'10px' }}><strong style={{ color:T.text }}>Privacy:</strong> All data is stored locally on your device. If you enable the AI Coach, your data is transmitted directly to your selected API provider and is subject to their privacy policy.</p>
 </div>
 <button onClick={() => setDisclaimerAccepted(true)} style={{ width:'100%', padding:'14px', background:T.accent, color:'#fff', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:600, cursor:'pointer' }}>
 I Understand \u2014 Continue
 </button>
 </div>
 </div>
 )}

 <div style={{
 maxWidth:'480px', margin:'0 auto', minHeight:'100vh', position:'relative',
 background:T.bg, paddingBottom:'80px', paddingTop:'env(safe-area-inset-top, 0px)',
 }}>
 {/* HEADER */}
 <div style={{
 position:'sticky', top:0, zIndex:50, padding:'16px 20px 12px',
 background:`linear-gradient(180deg, ${T.bg} 60%, transparent)`,
 backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
 }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <div>
 <h1 style={{ fontSize:'22px', fontWeight:800, letterSpacing:'-0.03em',
 background:`linear-gradient(135deg, ${T.text}, ${T.text2})`,
 WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
 NeuroRehab
 </h1>
 <button onClick={ => goToSettings('training')} style={{
 fontSize:'11px', color:T.text3, marginTop:'1px', textTransform:'uppercase', letterSpacing:'0.5px',
 background:'none', border:'none', cursor:'pointer', padding:0,
 }}>
 {profile.phase} · {profile.location}
 </button>
 </div>
 <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
 {profile.streak > 0 && (
 <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <Flame size={16} color={T.accent} style={{ animation: profile.streak > 7 ? 'pulse 2s infinite' : 'none' }} />
 <span style={{ fontSize:'13px', fontWeight:700, fontFamily:T.mono, color:T.accent }}>{profile.streak}</span>
 </div>
 )}
 <div style={{ display:'flex', alignItems:'center', gap:'6px', background:T.bgCard,
 padding:'4px 10px 4px 8px', borderRadius:'20px', border:`1px solid ${T.border}` }}>
 <Zap size={14} color={T.accent} />
 <span style={{ fontSize:'12px', fontWeight:600, fontFamily:T.mono }}>{profile.xp}</span>
 </div>
 <button onClick={ => goToSettings} style={{
 background:tab === 'settings' ? T.accentSoft : 'none', border:'none', cursor:'pointer',
 padding:'6px', borderRadius:'8px', display:'flex', alignItems:'center', transition:'all 0.2s',
 }}>
 <Settings size={18} color={tab === 'settings' ? T.accent : T.text3} />
 </button>
 </div>
 </div>
 </div>

 {/* STORAGE WARNING */}
 {(LS._quotaExceeded || LS.getUsageKB > 4000) && (
 <div style={{
 margin:'0 20px 8px', padding:'10px 14px', borderRadius:T.radiusSm,
 background:'rgba(255,82,82,0.08)', border:'1px solid rgba(255,82,82,0.2)',
 display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:T.danger,
 }}>
 <AlertTriangle size={16} />
 <div style={{ flex:1 }}>
 <strong>{LS._quotaExceeded ? 'Storage full!' : 'Storage nearly full'}</strong>
 {' — '}({LS.getUsageKB}KB used). Export your data in Settings to avoid data loss.
 </div>
 <button onClick={ => goToSettings('data')} style={{
 background:'none', border:`1px solid ${T.danger}`, borderRadius:'6px',
 padding:'4px 10px', color:T.danger, fontSize:'11px', fontWeight:600, cursor:'pointer',
 }}>Export</button>
 </div>
 )}

 {/* CONTENT */}
 <main role="main" style={{ padding:'0 20px 80px' }}>
 {tab === 'today' && (
 <TodayTab profile={profile} workout={workout} settings={settings}
 onGenerateWorkout={handleGenerateWorkout} onUpdateExercise={handleUpdateExercise}
 onRemoveExercise={handleRemoveExercise}
 onSessionMeta={handleSessionMeta} onAddXP={addXP} goToSettings={goToSettings}
 nutritionConfig={nutritionConfig} calibration={calibration} onSaveBodyLog={handleSaveBodyLog}
 isGeneratingWorkout={isGeneratingWorkout}
 restTimers={restTimers} onRestTimerChange={(exId, endTime) => setRestTimers(prev => endTime ? {.prev, [exId]: endTime } : ( => { const n = {.prev }; delete n[exId]; return n; }))} />
 )}
 {tab === 'rehab' && (
 <RehabTab rehabStatus={rehabStatus} onToggle={handleToggleRehab} />
 )}
 {tab === 'cardio' && (
 <CardioTab cardioLog={cardioLog} onLogCardio={handleLogCardio} settings={settings} goToSettings={goToSettings} />
 )}
 {tab === 'progress' && (
 <ProgressTab profile={profile} history={history} goToSettings={goToSettings}
 coachEnabled={settings.coachEnabled} settings={settings} coachCfg={coachCfg}
 nutritionConfig={nutritionConfig} onUpdateNutritionConfig={setNutritionConfig}
 goToToday={ => setTab('today')} />
 )}
 {tab === 'coach' && settings.coachEnabled && (
 <CoachTab profile={profile} workout={workout} rehabStatus={rehabStatus} cardioLog={cardioLog}
 history={history} coachCfg={coachCfg} goToSettings={goToSettings} />
 )}
 {tab === 'settings' && (
 <SettingsTab settings={settings} onUpdateSettings={setSettings} profile={profile}
 updateProfile={updateProfile} coachCfg={coachCfg} onUpdateCoachCfg={setCoachCfg}
 history={history} scrollToSection={settingsSection}
 nutritionConfig={nutritionConfig} onUpdateNutritionConfig={setNutritionConfig}
 calibration={calibration} onUpdateCalibration={setCalibration} />
 )}
 </main>

 {/* BOTTOM NAV */}
 <nav role="navigation" aria-label="Main navigation" style={{
 position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
 width:'100%', maxWidth:'480px',
 background:T.bgGlass, backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
 borderTop:`1px solid ${T.border}`,
 display:'flex', justifyContent:'space-around', padding:'8px 0 calc(12px + env(safe-area-inset-bottom, 0px))',
 zIndex:100,
 }}>
 {tabs.map(t_item => {
 const Icon = t_item.icon;
 const active = tab === t_item.id;
 return (
 <button key={t_item.id} onClick={ => setTab(t_item.id)}
 aria-label={`${t_item.label} tab`}
 aria-current={active ? 'page' : undefined}
 style={{
 background:'none', border:'none', display:'flex', flexDirection:'column',
 alignItems:'center', gap:'3px', cursor:'pointer', padding:'8px 14px',
 transition:'all 0.2s', position:'relative', minHeight:'48px',
 }}>
 {active && (
 <div style={{ position:'absolute', top:'-8px', width:'20px', height:'3px',
 borderRadius:'2px', background:T.accent, transition:'all 0.3s' }} />
 )}
 <Icon size={22} color={active ? T.accent : T.text3} strokeWidth={active ? 2.5 : 1.8} />
 <span style={{ fontSize:'10px', fontWeight: active ? 600 : 400,
 color: active ? T.accent : T.text3 }}>{t_item.label}</span>
 </button>
 );
 })}
 </nav>

 {/* TOAST */}
 {toast && <Toast message={toast.message} xp={toast.xp} />}
 </div>
 </>
 );
}

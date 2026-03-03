import React, { useState, useEffect, useRef } from 'react';
import {
 Dumbbell, Check, Play, RotateCcw, Shuffle, Star, Trophy,
 ChevronDown, Plus, Minus, Info, Settings, ArrowRight, XCircle
} from 'lucide-react';
import { T } from '@/design/tokens';
import { UPPER_CATEGORIES } from '@/data/volumeLandmarks';
import { EXERCISES } from '@/data/exercises';
import { getVideoUrl } from '@/data/videoUrls';
import { estimate1RM, detectStall } from '@/lib/progressiveOverload';
import { detectPRs } from '@/lib/prDetection';
import RestTimer from '@/components/RestTimerBar';

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

export { StepperField, SetRow };
export default ExerciseCard;

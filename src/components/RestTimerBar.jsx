import React, { useState, useEffect, useRef } from 'react';
import { T } from '@/design/tokens';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';

export function CircularTimer({ duration, timeLeft, size = 56, strokeWidth = 3 }) {
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

export function WorkoutTimerBar({ startedAt }) {
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

export default function RestTimer({ endTime, duration, onComplete, onPauseState, vibrate = true }) {
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

import React, { useState, useEffect, useCallback } from 'react';
import { Dumbbell, Heart, Activity, TrendingUp, MessageCircle, Flame, Zap, Settings, AlertTriangle } from 'lucide-react';
import { T, css } from '@/design/tokens';
import { LEVELS, XP_REWARDS, BODY_XP } from '@/data/levels';
import { DEFAULT_SETTINGS, DEFAULT_NUTRITION_CONFIG, DEFAULT_CALIBRATION, DEFAULT_STREAKS } from '@/data/defaults';
import { DAILY_REHAB } from '@/data/dailyRehab';
import { today, dayKey, getWeekId } from '@/lib/dateUtils';
import { LS } from '@/lib/storage';
import { loadBodyLogs } from '@/lib/weightSmoothing';
import { recalcCalibration } from '@/lib/bodyFatCalibration';
import { updateExpenditure } from '@/lib/tdee';
import { updateStreaks, checkCombinedStreak } from '@/lib/streaks';
import { normalizeWorkout } from '@/lib/workoutNormalize';
import { generateWorkout } from '@/lib/workoutGenerator';
import TodayTab from '@/tabs/TodayTab';
import RehabTab from '@/tabs/RehabTab';
import CardioTab from '@/tabs/CardioTab';
import ProgressTab from '@/tabs/ProgressTab';
import CoachTab, { DEFAULT_COACH_CONFIG } from '@/tabs/CoachTab';
import SettingsTab from '@/tabs/SettingsTab';
import Toast from '@/components/Toast';

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

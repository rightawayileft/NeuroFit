import React, { useState, useEffect, useRef } from 'react';
import {
  Dumbbell, Heart, ChevronDown, Clock, Plus, X,
  Settings, Target, Download, Upload, Trash2, Scale,
  Database, MessageCircle, AlertTriangle, Lock, Globe, RefreshCw
} from 'lucide-react';
import { T } from '@/design/tokens';
import { EXERCISES } from '@/data/exercises';
import { VIDEO_URLS } from '@/data/videoUrls';
import { SPLIT_TEMPLATES, selectSplit } from '@/data/splitTemplates';
import { today } from '@/lib/dateUtils';
import { LS } from '@/lib/storage';
import { normalizeWorkout } from '@/lib/workoutNormalize';
import { recalcCalibration } from '@/lib/bodyFatCalibration';
import { auditVideoLinks } from '@/api/youtube';
import { API_LIMITS, getApiKeySource, getApiUsageSnapshot } from '@/api/apiConfig';
import {
  PROVIDERS, DEFAULT_COACH_CONFIG,
  estimateTokens, buildFullSystemPrompt
} from '@/tabs/CoachTab';

// ============================================================
// CALIBRATION POINT FORM
// ============================================================

export function CalibrationPointForm({ onAdd }) {
 const [show, setShow] = useState(false);
 const [date, setDate] = useState(today());
 const [bia, setBia] = useState('');
 const [dexa, setDexa] = useState('');

 if (!show) {
 return (
 <button onClick={() => setShow(true)} style={{
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
 <button onClick={() => {
 if (bia && dexa) {
 onAdd({ date, biaValue: Number(bia), dexaValue: Number(dexa), weight: null });
 setBia(''); setDexa(''); setShow(false);
 }
 }} style={{
 flex:1, padding:'8px', background:T.accentSoft, border:'none', borderRadius:'6px',
 color:T.accent, fontWeight:600, fontSize:'12px', cursor:'pointer',
 }}>Add</button>
 <button onClick={() => setShow(false)} style={{
 padding:'8px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'6px', color:T.text3, fontSize:'12px', cursor:'pointer',
 }}>Cancel</button>
 </div>
 </div>
 );
}

// ============================================================
// SETTINGS SECTION (Collapsible)
// ============================================================

export function SettingsSection({ id, title, icon: Icon, children, sectionRef, defaultOpen = false, autoOpen = false }) {
 const [open, setOpen] = useState(defaultOpen || autoOpen);

 // Force open when deep-linked
 useEffect(() => {
 if (autoOpen) setOpen(true);
 }, [autoOpen]);
 return (
 <div ref={sectionRef} style={{ marginBottom:'4px' }}>
 <button onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={`settings-section-${id}`} style={{
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

export function ProgramOverviewCard({ settings, profile }) {
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
 const lastIdx = lastSplitDay ? template.days.findIndex(d => d.name.toLowerCase().replace(/\s+/g, '_') === lastSplitDay) : -1;
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
 <div style={{ fontSize:'11px', color:T.text3 }}>&bull;</div>
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
 <button onClick={() => setExpandedDay(isExpanded ? null : dayIdx)} style={{
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

// ============================================================
// SETTINGS TAB
// ============================================================

const DEFAULT_SYSTEM_PROMPT = `You are a fitness and mobility coach. Be concise (<120 words unless asked for detail). Reference clinical context when relevant. Never recommend exercises that conflict with any listed precautions.`;

const DEFAULT_PATIENT_PROFILE = `PATIENT: [Configure in settings]
DX: [Add diagnoses in settings]
GENETICS: [Add genetic markers in settings]
PRECAUTIONS: [Configure based on your conditions]
SUBS: [Configure based on your precautions]`;

function SettingsTab({ settings, onUpdateSettings, profile, updateProfile, coachCfg, onUpdateCoachCfg, history, scrollToSection, nutritionConfig, onUpdateNutritionConfig, calibration, onUpdateCalibration, apiCfg, onUpdateApiCfg }) {
 const trainingRef = useRef(null);
 const programmingRef = useRef(null);
 const unitsRef = useRef(null);
 const workoutRef = useRef(null);
 const recoveryRef = useRef(null);
 const bodyTrackingRef = useRef(null);
 const calibrationRef = useRef(null);
 const coachRef = useRef(null);
 const apiRef = useRef(null);
 const dataRef = useRef(null);

 const refs = { training: trainingRef, programming: programmingRef, units: unitsRef, workout: workoutRef, recovery: recoveryRef, bodyTracking: bodyTrackingRef, calibration: calibrationRef, coach: coachRef, api: apiRef, data: dataRef };

 useEffect(() => {
 if (scrollToSection && refs[scrollToSection]?.current) {
 setTimeout(() => {
 refs[scrollToSection].current.scrollIntoView({ behavior:'smooth', block:'start' });
 }, 150);
 }
 }, [scrollToSection]);

 const upd = (key, val) => onUpdateSettings({ ...settings, [key]: val });
 const updCoach = (key, val) => onUpdateCoachCfg({ ...coachCfg, [key]: val });
 const setCoachKey = (prov, val) => onUpdateCoachCfg({ ...coachCfg, keys:{ ...coachCfg.keys, [prov]: val } });
 const updApi = (key, val) => onUpdateApiCfg({ ...apiCfg, [key]: val });
 const setApiKey = (key, val) => onUpdateApiCfg({ ...apiCfg, keys:{ ...apiCfg.keys, [key]: val } });

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
 const [apiUsage, setApiUsage] = useState(() => getApiUsageSnapshot());
 const [auditState, setAuditState] = useState({ loading:false, error:'', result:null });

 useEffect(() => {
 const interval = setInterval(() => {
 setApiUsage(getApiUsageSnapshot());
 }, 1500);
 return () => clearInterval(interval);
 }, []);

 // Data management helpers
 const exportData = () => {
 const data = {};
 const allKeys = LS.keys('');
 for (const k of allKeys) { data[k] = LS.get(k, null); }
 const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a'); a.href = url; a.download = `neurorehab-backup-${today()}.json`;
 a.click(); URL.revokeObjectURL(url);
 };

 const importData = () => {
 const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
 input.onchange = async (e) => {
 const file = e.target.files[0]; if (!file) return;
 if (file.size > 10 * 1024 * 1024) { alert('File too large. Maximum import size is 10MB.'); return; }
 try {
 const text = await file.text();
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
 window.location.reload();
 } catch(err) { alert('Failed to import: ' + err.message); }
 };
 input.click();
 };

 const clearAllData = () => {
 try { localStorage.clear(); } catch { /* ignore */ }
 window.location.reload();
 };

 const runVideoAudit = async () => {
 setAuditState({ loading:true, error:'', result:null });
 try {
 const result = await auditVideoLinks(VIDEO_URLS);
 if (result.error) {
  setAuditState({ loading:false, error:result.error, result:null });
  return;
 }
 setAuditState({ loading:false, error:'', result });
 } catch (err) {
 setAuditState({ loading:false, error:err.message || 'Audit failed.', result:null });
 }
 };

 const storageUsed = (() => {
 try {
 let t = 0;
 for (let i = 0; i < localStorage.length; i++) {
 t += (localStorage.getItem(localStorage.key(i)) || '').length;
 }
 return (t / 1024).toFixed(1);
 } catch { return '0.0'; }
 })();

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
 <button key={p} onClick={() => updateProfile({ phase: p })} style={S.pill(profile.phase === p)}>
 {p.charAt(0).toUpperCase() + p.slice(1)}
 </button>
 ))}
 </div>
 </div>
 <div style={S.sub}>
 <span style={S.label}>Equipment / Location</span>
 <div style={{ display:'flex', gap:'8px' }}>
 {['gym','home','work'].map(l => (
 <button key={l} onClick={() => updateProfile({ location: l })} style={S.pillTeal(profile.location === l)}>
 {l.charAt(0).toUpperCase() + l.slice(1)}
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
 <button key={t} onClick={() => upd('trainingTime', t)} style={S.pillTeal(settings.trainingTime === t)}>
 {t.charAt(0).toUpperCase() + t.slice(1)}
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
 <button key={lvl} onClick={() => upd('experienceLevel', lvl)}
 aria-pressed={(settings.experienceLevel || 'beginner') === lvl}
 style={S.pill((settings.experienceLevel || 'beginner') === lvl)}>
 {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
 </button>
 ))}
 </div>
 </div>
 <div style={S.sub}>
 <span style={S.label}>Training Goal</span>
 <div style={{ display: 'flex', gap: '8px' }}>
 {['strength', 'hypertrophy', 'endurance'].map(goal => (
 <button key={goal} onClick={() => upd('trainingGoal', goal)}
 aria-pressed={(settings.trainingGoal || 'hypertrophy') === goal}
 style={S.pillTeal((settings.trainingGoal || 'hypertrophy') === goal)}>
 {goal.charAt(0).toUpperCase() + goal.slice(1)}
 </button>
 ))}
 </div>
 <div style={{ fontSize: '10px', color: T.text3, marginTop: '6px' }}>
 Affects prescribed rep ranges and rest periods.
 </div>
 </div>
 <div style={S.row}>
 <span style={{ fontSize: '13px', color: T.text2 }}>Progressive overload</span>
 <button onClick={() => upd('enableProgressiveOverload', !settings.enableProgressiveOverload)}
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
 <button key={u.id} onClick={() => upd('weightUnit', u.id)} style={S.pill(settings.weightUnit === u.id)}>
 {u.label}
 </button>
 ))}
 </div>
 </div>
 <div>
 <span style={S.label}>First Day of Week</span>
 <div style={{ display:'flex', gap:'8px' }}>
 {[{id:0,label:'Sun'},{id:1,label:'Mon'},{id:6,label:'Sat'}].map(d => (
 <button key={d.id} onClick={() => upd('firstDayOfWeek', d.id)}
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
 <button onClick={() => upd('autoStartTimer', !settings.autoStartTimer)} role="switch" aria-checked={settings.autoStartTimer} style={S.toggle(settings.autoStartTimer)}>
 <div style={S.toggleDot(settings.autoStartTimer)} />
 </button>
 </div>
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Vibrate when rest timer ends</span>
 <button onClick={() => upd('timerVibrate', !settings.timerVibrate)} role="switch" aria-checked={settings.timerVibrate !== false} style={S.toggle(settings.timerVibrate !== false)}>
 <div style={S.toggleDot(settings.timerVibrate !== false)} />
 </button>
 </div>
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Keep screen awake during workout</span>
 <button onClick={() => upd('keepAwake', !settings.keepAwake)} role="switch" aria-checked={settings.keepAwake} style={S.toggle(settings.keepAwake)}>
 <div style={S.toggleDot(settings.keepAwake)} />
 </button>
 </div>
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Show RPE column</span>
 <button onClick={() => upd('showRPE', !settings.showRPE)} role="switch" aria-checked={settings.showRPE} style={S.toggle(settings.showRPE)}>
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
 <button onClick={() => upd('countWarmupInStats', !settings.countWarmupInStats)} role="switch" aria-checked={settings.countWarmupInStats} style={S.toggle(settings.countWarmupInStats)}>
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
 <input type="number" inputMode="decimal" value={settings.bodyWeight} placeholder="\u2014"
 onChange={e => upd('bodyWeight', e.target.value)}
 aria-label={`Body weight (${settings.weightUnit})`}
 style={{ ...S.input, textAlign:'center', padding:'8px' }} />
 <span style={{ fontSize:'11px', color:T.text3 }}>{settings.weightUnit}</span>
 </div>
 </div>
 <div>
 <div style={{ fontSize:'10px', color:T.text3, marginBottom:'4px' }}>Body Fat</div>
 <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <input type="number" inputMode="decimal" value={settings.bodyFatPct} placeholder="\u2014"
 onChange={e => upd('bodyFatPct', e.target.value)}
 aria-label="Body fat percentage"
 style={{ ...S.input, textAlign:'center', padding:'8px' }} />
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
 <div style={{ ...S.rowBorder, paddingTop:0 }}>
 <div>
 <span style={{ fontSize:'14px', fontWeight:600, color:T.text }}>Enable AI Coach</span>
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'2px' }}>
 {settings.coachEnabled ? 'Coach tab visible in bottom nav' : 'Coach tab hidden \u2014 enable to use'}
 </div>
 </div>
 <button onClick={() => upd('coachEnabled', !settings.coachEnabled)} role="switch" aria-checked={settings.coachEnabled} style={S.toggle(settings.coachEnabled)}>
 <div style={S.toggleDot(settings.coachEnabled)} />
 </button>
 </div>

 {/* Progress Reports toggle */}
 <div style={{ ...S.rowBorder }}>
 <div>
 <span style={{ fontSize:'14px', fontWeight:600, color:T.text }}>Progress Reports</span>
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'2px' }}>
 {settings.reportsEnabled
 ? 'Weekly & monthly AI reports in Progress tab'
 : 'Reports hidden \u2014 enable to generate'}
 </div>
 </div>
 <button onClick={() => upd('reportsEnabled', !settings.reportsEnabled)} role="switch" aria-checked={settings.reportsEnabled} style={S.toggle(settings.reportsEnabled)}>
 <div style={S.toggleDot(settings.reportsEnabled)} />
 </button>
 </div>

 {settings.coachEnabled && (<>
 {/* Provider */}
 <div style={{ ...S.sub, marginTop:'12px' }}>
 <span style={S.label}>Provider</span>
 <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
 {Object.entries(PROVIDERS).map(([key, prov]) => (
 <button key={key} onClick={() => {
 const firstModel = PROVIDERS[key].models[0].id;
 onUpdateCoachCfg({ ...coachCfg, provider:key, model:firstModel });
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
 <div key={key} style={{ fontSize:'10px', color:T.success, marginTop:'4px' }}>\u2713 {prov.name} key saved</div>
 ))}
 </div>
 {/* Model */}
 <div style={S.sub}>
 <span style={S.label}>Model</span>
 <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
 {coachProvider.models.map(m => (
 <button key={m.id} onClick={() => updCoach('model', m.id)}
 style={{ ...S.pill(coachCfg.model === m.id), fontSize:'11px', padding:'5px 10px' }}>
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
 style={{ ...S.input, fontFamily:T.mono, fontSize:'12px' }} />
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
 <button onClick={() => updCoach(key, !coachCfg[key])} role="switch" aria-checked={coachCfg[key]} style={S.toggle(coachCfg[key])}>
 <div style={S.toggleDot(coachCfg[key])} />
 </button>
 </div>
 ))}
 </div>
 {/* System prompt */}
 <div style={S.sub}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
 <span style={{ ...S.label, marginBottom:0 }}>System Prompt</span>
 <span style={{ fontSize:'10px', color:T.text3, fontFamily:T.mono }}>~{estimateTokens(coachCfg.systemPrompt)} tok</span>
 </div>
 <textarea value={coachCfg.systemPrompt} onChange={e => updCoach('systemPrompt', e.target.value)}
 rows={4} style={S.textarea} />
 <button onClick={() => updCoach('systemPrompt', DEFAULT_SYSTEM_PROMPT)}
 style={{ fontSize:'11px', color:T.teal, background:'none', border:'none', cursor:'pointer', marginTop:'4px', padding:0 }}>
 Reset to default
 </button>
 </div>
 {/* Patient profile */}
 <div style={S.sub}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
 <span style={{ ...S.label, marginBottom:0 }}>Patient Profile</span>
 <span style={{ fontSize:'10px', color:T.text3, fontFamily:T.mono }}>~{estimateTokens(coachCfg.patientProfile)} tok</span>
 </div>
 <textarea value={coachCfg.patientProfile} onChange={e => updCoach('patientProfile', e.target.value)}
 rows={6} style={{ ...S.textarea, minHeight:'120px' }} />
 <button onClick={() => updCoach('patientProfile', DEFAULT_PATIENT_PROFILE)}
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
 System+profile: ~{estimateTokens(buildFullSystemPrompt(coachCfg))} tok &middot;
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
 <button key={u} onClick={() => upd('weightUnit', u)} style={S.pill(settings.weightUnit === u)}>{u}</button>
 ))}
 </div>
 </div>
 <div style={{ flex:1, minWidth:'100px' }}>
 <span style={{ fontSize:'11px', color:T.text3, display:'block', marginBottom:'4px' }}>Waist</span>
 <div style={{ display:'flex', gap:'4px' }}>
 {['in','cm'].map(u => (
 <button key={u} onClick={() => onUpdateNutritionConfig({ ...nutritionConfig, waistUnit: u })}
 style={S.pill(nutritionConfig.waistUnit === u)}>{u}</button>
 ))}
 </div>
 </div>
 </div>
 {/* Height (for waist-to-height ratio) */}
 <div style={{ marginTop: '10px' }}>
 <span style={{ fontSize:'11px', color:T.text3, display:'block', marginBottom:'4px' }}>
 Height {settings.weightUnit === 'kg' ? '(cm)' : '(inches)'} &mdash; used for waist-to-height ratio
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
 cursor:'pointer' }} onClick={() => onUpdateNutritionConfig({ ...nutritionConfig, smoothingMethod: m.key })}>
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
 onChange={e => onUpdateNutritionConfig({ ...nutritionConfig, adaptiveSmoothingDays: Number(e.target.value) })}
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
 <button key={g.key} onClick={() => onUpdateNutritionConfig({ ...nutritionConfig, goal: g.key })}
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
 <button key={r} onClick={() => onUpdateNutritionConfig({ ...nutritionConfig, weeklyRatePercent: r })}
 style={S.pill(nutritionConfig.weeklyRatePercent === r)}>{r}%</button>
 ))}
 </div>
 </div>
 )}
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Daily calorie target</span>
 <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
 <input type="text" inputMode="numeric" value={nutritionConfig.dailyCalorieTarget || ''}
 onChange={e => onUpdateNutritionConfig({ ...nutritionConfig, dailyCalorieTarget: Number(e.target.value) || 0 })}
 style={{ ...S.input, width:'80px', textAlign:'right', fontFamily:T.mono }} />
 <span style={{ fontSize:'12px', color:T.text3 }}>kcal</span>
 </div>
 </div>
 <div style={S.rowBorder}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Daily protein target</span>
 <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
 <input type="text" inputMode="numeric" value={nutritionConfig.dailyProteinTarget || ''}
 onChange={e => onUpdateNutritionConfig({ ...nutritionConfig, dailyProteinTarget: Number(e.target.value) || 0 })}
 style={{ ...S.input, width:'60px', textAlign:'right', fontFamily:T.mono }} />
 <span style={{ fontSize:'12px', color:T.text3 }}>g</span>
 </div>
 </div>
 </div>

 {/* Weekly Calorie Budget */}
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
 const mults = { ...(nutritionConfig.dayMultipliers || {mon:1,tue:1,wed:1,thu:1,fri:1,sat:1,sun:1}) };
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
 const currentSum = Object.values(mults).reduce((a, v) => a + v, 0);
 const drift = 7 - currentSum;
 if (Math.abs(drift) > 0.01) {
 const largestOther = otherDays.reduce((best, d) => mults[d] > mults[best] ? d : best, otherDays[0]);
 mults[largestOther] = Math.max(0.5, Math.round((mults[largestOther] + drift) * 100) / 100);
 }
 }
 onUpdateNutritionConfig({ ...nutritionConfig, dayMultipliers: mults });
 }}
 style={{ flex:1, accentColor:T.accent }} />
 <span style={{ fontSize:'12px', fontFamily:T.mono, color:T.text, width:'55px', textAlign:'right' }}>
 {dayCals.toLocaleString()}
 </span>
 </div>
 );
 })}
 <div style={{ fontSize:'11px', color:T.text3, textAlign:'right', padding:'4px 0' }}>
 Weekly: {Math.round((nutritionConfig.dailyCalorieTarget || 2200) * 7).toLocaleString()} kcal
 </div>
 </div>

 {/* Adaptive TDEE */}
 <div style={S.sub}>
 <span style={S.label}>Adaptive TDEE</span>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Current estimate</span>
 <span style={{ fontSize:'14px', fontFamily:T.mono, fontWeight:600, color:T.accent }}>
 {(nutritionConfig.estimatedTDEE || 2500).toLocaleString()} kcal/day
 </span>
 </div>
 <div style={S.row}>
 <span style={{ fontSize:'13px', color:T.text2 }}>Confidence</span>
 <span style={{ fontSize:'13px', color:
 nutritionConfig.tdeeConfidence === 'high' ? T.teal :
 nutritionConfig.tdeeConfidence === 'medium' ? T.warn : T.text3 }}>
 {(nutritionConfig.tdeeConfidence || 'low').charAt(0).toUpperCase() + (nutritionConfig.tdeeConfidence || 'low').slice(1)}
 {' '}
 {nutritionConfig.tdeeConfidence === 'high' ? '\u25CF\u25CF\u25CF\u25CF\u25CF' :
 nutritionConfig.tdeeConfidence === 'medium' ? '\u25CF\u25CF\u25CF\u25CB\u25CB' : '\u25CF\u25CB\u25CB\u25CB\u25CB'}
 </span>
 </div>
 <button onClick={() => {
 onUpdateNutritionConfig({ ...nutritionConfig, estimatedTDEE: nutritionConfig.initialTDEE || 2500, tdeeConfidence: 'low', tdeeHistory: [] });
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
 onChange={e => onUpdateCalibration({ ...calibration, deviceId: e.target.value })}
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
 }} onClick={() => !locked && onUpdateCalibration(recalcCalibration({ ...calibration, method: m.key }))}>
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
 <button onClick={() => {
 const pts = [...(calibration.points || [])];
 pts.splice(i, 1);
 onUpdateCalibration(recalcCalibration({ ...calibration, points: pts }));
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
 const pts = [...(calibration.points || []), pt];
 pts.sort((a, b) => a.date.localeCompare(b.date));
 onUpdateCalibration(recalcCalibration({ ...calibration, points: pts }));
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
 {calibration.method === 'linear_regression' && calibration.slope != null && `BF% = ${calibration.intercept} + ${calibration.slope} \u00D7 BIA (R\u00B2=${calibration.rSquared})`}
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
 {calibration.lastCalibrationDate && (() => {
 const daysSince = Math.floor((Date.now() - new Date(calibration.lastCalibrationDate + 'T12:00:00').getTime()) / 86400000);
 return daysSince > (calibration.stalenessWarningDays || 180) ? (
 <div style={{ padding:'8px 12px', background:T.warnSoft, borderRadius:'8px',
 border:`1px solid rgba(255,183,77,0.2)`, fontSize:'12px', color:T.warn }}>
 <AlertTriangle size={14} style={{ verticalAlign:'middle', marginRight:'6px' }} />
 Last calibration was {daysSince} days ago. Consider getting a new DEXA scan.
 </div>
 ) : null;
 })()}
 </SettingsSection>

 {/* =============== API =============== */}
 <SettingsSection id="api" title="API & Integrations" icon={Globe} sectionRef={apiRef}
 autoOpen={scrollToSection === 'api'}>
 <div style={{ ...S.rowBorder, paddingTop:0 }}>
 <div>
 <span style={{ fontSize:'14px', fontWeight:600, color:T.text }}>Enable community exercises</span>
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'2px' }}>
 Show ExerciseDB-powered manual swap options beneath curated alternatives.
 </div>
 </div>
 <button onClick={() => updApi('enableCommunityExercises', !apiCfg.enableCommunityExercises)} role="switch" aria-checked={apiCfg.enableCommunityExercises} style={S.toggle(apiCfg.enableCommunityExercises)}>
 <div style={S.toggleDot(apiCfg.enableCommunityExercises)} />
 </button>
 </div>

 <div style={{ ...S.sub, marginTop:'12px' }}>
 <span style={S.label}>YouTube Data API Key</span>
 <input
 type="password"
 value={apiCfg.keys?.youtubeDataV3 || ''}
 placeholder="AIza..."
 onChange={e => setApiKey('youtubeDataV3', e.target.value)}
 aria-label="YouTube Data API key"
 style={S.input}
 />
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'4px' }}>
 Leave blank to use `VITE_YOUTUBE_API_KEY` from `.env`.
 {' '}
 {getApiKeySource('youtubeDataV3') === 'local' ? 'Currently using the locally stored key.' : getApiKeySource('youtubeDataV3') === 'env' ? 'Currently using the environment key.' : 'No key detected yet.'}
 </div>
 </div>

 <div style={S.sub}>
 <span style={S.label}>ExerciseDB API Key</span>
 <input
 type="password"
 value={apiCfg.keys?.exerciseDB || ''}
 placeholder="Optional"
 onChange={e => setApiKey('exerciseDB', e.target.value)}
 aria-label="ExerciseDB API key"
 style={S.input}
 />
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'4px' }}>
 Optional. The current open ExerciseDB host works without a key, but this leaves room for alternate hosts later.
 </div>
 </div>

 <div style={S.sub}>
 <span style={S.label}>Usage Status</span>
 <div style={{ display:'grid', gap:'8px' }}>
 {[
  { id:'exerciseDB', label:'ExerciseDB', limit: API_LIMITS.exerciseDB },
  { id:'youtube', label:'YouTube', limit: API_LIMITS.youtube },
 ].map((entry) => {
  const usage = apiUsage[entry.id] || { calls:0, cacheHits:0, failures:0, recentCalls:0, remainingThisMinute:entry.limit };
  return (
  <div key={entry.id} style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:'10px', border:`1px solid ${T.border}` }}>
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
  <span style={{ fontSize:'13px', fontWeight:600, color:T.text }}>{entry.label}</span>
  <span style={{ fontSize:'11px', color:T.text3 }}>{usage.remainingThisMinute}/{entry.limit} left this minute</span>
  </div>
  <div style={{ fontSize:'11px', color:T.text2, lineHeight:1.6 }}>
  {usage.calls} calls · {usage.cacheHits} cache hits · {usage.failures} failures
  </div>
  </div>
  );
 })}
 </div>
 </div>

 <div style={S.sub}>
 <span style={S.label}>Curated Video Audit</span>
 <button onClick={runVideoAudit} disabled={auditState.loading} style={{
  width:'100%', padding:'12px 16px', borderRadius:'10px', border:`1px solid ${T.border}`,
  background:'rgba(255,255,255,0.04)', color:T.text, fontSize:'13px', fontWeight:500,
  cursor:auditState.loading ? 'default' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
  opacity:auditState.loading ? 0.6 : 1,
 }}>
 <RefreshCw size={15} style={{ animation:auditState.loading ? 'spin 1s linear infinite' : 'none' }} />
 {auditState.loading ? 'Checking video links...' : 'Audit curated YouTube links'}
 </button>
 <div style={{ fontSize:'10px', color:T.text3, marginTop:'4px' }}>
 Uses the YouTube Data API when a key is available. Good for checking if hardcoded tutorials are still public.
 </div>

 {auditState.error && (
 <div style={{ marginTop:'8px', fontSize:'11px', color:T.danger }}>{auditState.error}</div>
 )}

 {auditState.result && (
 <div style={{ marginTop:'8px', padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:'10px', border:`1px solid ${T.border}` }}>
 <div style={{ fontSize:'12px', color:T.text2, marginBottom:'6px' }}>
 {auditState.result.valid}/{auditState.result.total} curated links verified as public.
 </div>
 {auditState.result.broken.length > 0 ? (
 <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
 {auditState.result.broken.slice(0, 8).map((entry) => (
 <div key={entry.exerciseId} style={{ fontSize:'11px', color:T.warn, fontFamily:T.mono }}>
 {entry.exerciseId} · {entry.status}
 </div>
 ))}
 </div>
 ) : (
 <div style={{ fontSize:'11px', color:T.success }}>No broken curated video links found in this run.</div>
 )}
 </div>
 )}
 </div>
 </SettingsSection>

 {/* =============== DATA =============== */}
 <SettingsSection id="data" title="Data Management" icon={Database} sectionRef={dataRef}
 autoOpen={scrollToSection === 'data'}>
 <div style={{ fontSize:'12px', color:T.text2, marginBottom:'12px' }}>
 Storage used: <span style={{ fontFamily:T.mono, color:T.text }}>{storageUsed} KB</span> &middot; {LS.keys('').length} keys
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
 <button onClick={() => setConfirmReset(true)} style={{
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
 \u26A0 This will permanently delete all data including workouts, settings, and API keys.
 </div>
 <div style={{ display:'flex', gap:'8px' }}>
 <button onClick={clearAllData} style={{
 flex:1, padding:'10px', background:T.danger, border:'none', borderRadius:'8px',
 color:'#fff', fontWeight:600, fontSize:'12px', cursor:'pointer',
 }}>Yes, delete everything</button>
 <button onClick={() => setConfirmReset(false)} style={{
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
 NeuroFit v0.5 &middot; Data stored locally
 <div style={{ marginTop:'8px', padding:'10px', background:'rgba(128,128,128,0.08)', borderRadius:'8px', fontSize:'10px', color:T.text3 }}>
 <strong>Disclaimer:</strong> This app is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Consult a physician and/or physical therapist before starting any exercise program. The creators assume no liability for injuries or damages resulting from use of this app.
 <br/><br/>
 <strong>Privacy:</strong> All data is stored locally on your device. If you use the AI Coach, your data is sent directly to your selected API provider and is subject to their privacy policy.
 </div>
 </div>
 </div>
 );
}

export default SettingsTab;

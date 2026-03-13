import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp, ChevronLeft, Scale, Flame } from 'lucide-react';
import { T } from '@/design/tokens';
import { DEFAULT_STREAKS } from '@/data/defaults';
import { today, subtractDays } from '@/lib/dateUtils';
import { LS } from '@/lib/storage';
import { getCalibratedBodyFat } from '@/lib/bodyFatCalibration';
import GlassCard from '@/components/GlassCard';

function DailyLogCard({ settings, nutritionConfig, calibration, profile, onSave, onAddXP, currentDate, defaultCollapsed = false }) {
 const baseDate = currentDate || today();
 const [selectedDate, setSelectedDate] = useState(baseDate);
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
 const [collapsed, setCollapsed] = useState(defaultCollapsed);
 const [dexaBiaValue, setDexaBiaValue] = useState('');
 const [saved, setSaved] = useState(!!existing);

 // Reset form when date changes
 useEffect(() => {
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

 useEffect(() => {
 setSelectedDate(baseDate);
 }, [baseDate]);

 const calibrated = bfValue && calibration?.points?.length > 0
 ? getCalibratedBodyFat(Number(bfValue), calibration) : null;

 const streaks = profile?.streaks || DEFAULT_STREAKS;
 const combinedStreak = streaks.combined?.current || 0;

 const handleSave = () => {
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
 timestamp: Date.now(),
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
 const isToday = selectedDate === baseDate;
 const isYesterday = selectedDate === subtractDays(baseDate, 1);

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
 <div style={{ marginBottom:'12px' }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <Scale size={18} color={T.accent} />
 <span style={{ fontSize:'15px', fontWeight:600 }}>Daily Log</span>
 </div>
 <button onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed} style={{
 background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:'8px', color:T.text2,
 fontSize:'12px', padding:'6px 10px', cursor:'pointer', minHeight:'36px'
 }}>{collapsed ? 'Expand' : 'Collapse'}</button>
 </div>
 <div style={{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap' }}>
 <button onClick={() => setSelectedDate(subtractDays(selectedDate, 1))}
 aria-label="Previous day"
 style={{ padding:'8px', borderRadius:'6px', border:'none', fontSize:'14px', cursor:'pointer',
 background:'rgba(255,255,255,0.04)', color:T.text3, lineHeight:1, minWidth:'40px', minHeight:'40px',
 display:'flex', alignItems:'center', justifyContent:'center' }}>
 <ChevronLeft size={14} />
 </button>
 <input type="date" value={selectedDate}
 max={baseDate}
 onChange={e => { if (e.target.value) setSelectedDate(e.target.value); }}
 aria-label="Select log date"
 style={{
 background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:'6px',
 padding:'6px 8px', color:T.text, fontSize:'14px', fontFamily:T.mono, outline:'none',
 cursor:'pointer', colorScheme:'dark', flex:'1 1 140px', minWidth:0,
 }} />
 {!isToday && (
 <button onClick={() => setSelectedDate(baseDate)}
 style={{ padding:'8px 10px', borderRadius:'6px', border:'none', fontSize:'11px', fontWeight:600,
 cursor:'pointer', background:T.accentSoft, color:T.accent, minHeight:'36px' }}>Today</button>
 )}
 {selectedDate !== subtractDays(baseDate, 1) && !isToday && (
 <button onClick={() => setSelectedDate(subtractDays(baseDate, 1))}
 style={{ padding:'8px 10px', borderRadius:'6px', border:'none', fontSize:'11px', fontWeight:500,
 cursor:'pointer', background:'rgba(255,255,255,0.04)', color:T.text3, minHeight:'36px' }}>Yest.</button>
 )}
 </div>
 </div>

 {/* Date context label */}
 {!isToday && (
 <div style={{ fontSize:'11px', color: isYesterday ? T.teal : T.warn, marginBottom:'8px',
 padding:'4px 8px', borderRadius:'6px',
 background: isYesterday ? 'rgba(78,205,196,0.06)' : 'rgba(255,183,77,0.06)' }}>
 {isYesterday ? '📝 Logging for yesterday' : `📝 Logging for ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year: new Date(selectedDate).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })}`}
 </div>
 )}


 {collapsed && (
 <div style={{ padding:'8px 0 4px', fontSize:'12px', color:T.text3 }}>
 {saved ? 'Saved' : 'Not saved yet'} · {isToday ? 'Today' : isYesterday ? 'Yesterday' : selectedDate}
 </div>
 )}

 {!collapsed && (
 <>
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
 <button onClick={() => setShowMore(!showMore)} aria-expanded={showMore} style={{
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
 <button key={q} onClick={() => setSleepQuality(sleepQuality === q ? null : q)} aria-pressed={sleepQuality === q} aria-label={`Sleep quality: ${q}`} style={{
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

 </>
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

export default DailyLogCard;

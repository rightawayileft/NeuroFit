import React, { useState, useMemo } from 'react';
import { Target, ChevronRight } from 'lucide-react';
import { T } from '@/design/tokens';
import { VOLUME_LANDMARKS, getAdjustedLandmarks } from '@/data/volumeLandmarks';
import { LS } from '@/lib/storage';
import { isWorkingVolume } from '@/lib/progressiveOverload';
import { getWorkoutExercises } from '@/lib/workoutNormalize';
import GlassCard from '@/components/GlassCard';

function VolumeTracker({ history, settings }) {
 const [expandedMuscle, setExpandedMuscle] = useState(null);

 // Compute weekly completed sets per primaryMuscleGroup
 const weeklyVolume = useMemo(() => {
 const volume = {};
 const now = new Date();
 const firstDay = settings?.firstDayOfWeek ?? 0;
 const weekStart = new Date(now);
 const currentDay = weekStart.getDay();
 const daysBack = (currentDay - firstDay + 7) % 7;
 weekStart.setDate(weekStart.getDate() - daysBack);
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
 onClick={() => hasSubgroups && setExpandedMuscle(isExpanded ? null : muscle)}
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

export default VolumeTracker;

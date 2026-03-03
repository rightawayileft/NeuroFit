import React, { useState, useMemo } from 'react';
import { ChevronRight, Target } from 'lucide-react';
import { T } from '@/design/tokens';
import { DEFAULT_NUTRITION_CONFIG } from '@/data/defaults';
import { today, subtractDays } from '@/lib/dateUtils';
import { loadAllBodyLogs, smoothEWMA } from '@/lib/weightSmoothing';
import GlassCard from '@/components/GlassCard';

function WeeklyCheckInCard({ nutritionConfig, onUpdateNutritionConfig, settings, allBodyLogs }) {
 const [dismissed, setDismissed] = useState(false);
 const cfg = nutritionConfig || DEFAULT_NUTRITION_CONFIG;

 const checkInData = useMemo(() => {
 const lastCheckIn = cfg.lastCheckInDate;
 const allLogs = allBodyLogs || loadAllBodyLogs();
 const logsWithWeight = allLogs.filter(l => l.weight);
 const logsWithCals = allLogs.filter(l => l.calories);

 // Must have 7+ days of data
 if (logsWithWeight.length < 7 && logsWithCals.length < 7) return null;

 // Check if 7+ days since last check-in
 const todayStr = today();

 // Check snooze
 if (cfg.snoozeUntilDate && todayStr < cfg.snoozeUntilDate) return null;

 if (lastCheckIn) {
 const daysSince = Math.floor((new Date(todayStr + 'T12:00:00') - new Date(lastCheckIn + 'T12:00:00')) / 86400000);
 if (daysSince < 7) return null;
 } else {
 // No check-in ever — need 7+ days of data
 const firstDate = [...logsWithWeight,...logsWithCals].sort((a, b) => a.date.localeCompare(b.date))[0]?.date;
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

 const handleAccept = () => {
 onUpdateNutritionConfig({
...cfg,
 dailyCalorieTarget: newTarget,
 lastCheckInDate: today(),
 });
 setDismissed(true);
 };

 const handleDismiss = () => {
 onUpdateNutritionConfig({
...cfg,
 lastCheckInDate: today(),
 });
 setDismissed(true);
 };

 const handleSnooze = () => {
 const snoozeDate = new Date();
 snoozeDate.setDate(snoozeDate.getDate() + 3);
 onUpdateNutritionConfig({
...cfg,
 snoozeUntilDate: snoozeDate.toISOString().split('T')[0],
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
 <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: T.mono, color: T.accent }}>{tdee.toLocaleString()}</div>
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
 <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: T.mono, color: T.text }}>{avgIntake.toLocaleString()}</div>
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
 {currentTarget.toLocaleString()}
 </div>
 </div>
 <ChevronRight size={16} color={T.teal} />
 <div style={{ textAlign: 'center' }}>
 <div style={{ fontSize: '10px', color: T.teal }}>Proposed</div>
 <div style={{ fontSize: '16px', fontFamily: T.mono, color: T.teal, fontWeight: 700 }}>
 {newTarget.toLocaleString()}
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

export default WeeklyCheckInCard;

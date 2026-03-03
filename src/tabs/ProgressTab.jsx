import React, { useState, useMemo } from 'react';
import {
  Dumbbell, Activity, Flame, ChevronRight, ChevronDown, Settings,
  FileText, Calendar, Loader, RotateCcw
} from 'lucide-react';
import { T } from '@/design/tokens';
import { LEVELS, XP_REWARDS } from '@/data/levels';
import { DEFAULT_NUTRITION_CONFIG, DEFAULT_CALIBRATION, DEFAULT_STREAKS } from '@/data/defaults';
import { today, subtractDays, getWeekId, getMonthId } from '@/lib/dateUtils';
import { LS } from '@/lib/storage';
import { loadBodyLogs, loadAllBodyLogs, getSmoothedWeights } from '@/lib/weightSmoothing';
import { getCalibratedBodyFat } from '@/lib/bodyFatCalibration';
import { getWorkoutExercises } from '@/lib/workoutNormalize';
import { computeWeightedMuscleVolume, analyzeMuscleBalance } from '@/lib/muscleBalance';
import GlassCard from '@/components/GlassCard';
import CalendarHeatmap from '@/components/CalendarHeatmap';
import MuscleMap from '@/components/MuscleMap';
import WeightTrendChart from '@/components/WeightTrendChart';
import BodyFatChart from '@/components/BodyFatChart';
import NutritionChart from '@/components/NutritionChart';
import TDEETrendChart from '@/components/TDEETrendChart';
import WaistChart from '@/components/WaistChart';
import VolumeTracker from '@/components/VolumeTracker';
import ExerciseProgressChart from '@/components/StrengthChart';
import WeeklyCheckInCard from '@/components/WeeklyCheckInCard';
import MultiMetricOverlay from '@/components/MultiMetricOverlay';
import { WorkoutDetailModal } from '@/tabs/TodayTab';

// ============================================================
// Coach-related imports for ProgressReports
// ============================================================
import {
  PROVIDERS, DISPATCH, DEFAULT_COACH_CONFIG,
  estimateTokens, estimateCost,
  buildFullSystemPrompt, buildSessionContext
} from '@/tabs/CoachTab';

// ============================================================
// MUSCLE BALANCE CARD
// ============================================================

export function MuscleBalanceCard({ settings }) {
 const [expanded, setExpanded] = useState(false);

 const analysis = useMemo(() => {
 const vol = computeWeightedMuscleVolume(settings);
 return { weighted: vol, ...analyzeMuscleBalance(vol) };
 }, [settings]);

 const imbalanceCount = analysis.pairs.filter(p => !p.balanced).length + analysis.undertrained.length;
 const hasData = analysis.pairs.some(p => p.valA > 0 || p.valB > 0);

 if (!hasData) return null;

 return (
 <div style={{ marginBottom: '20px' }}>
 <div
 onClick={() => setExpanded(!expanded)}
 style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '10px' }}
 >
 <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
 \uD83C\uDFAF Muscle Balance
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
 {pair.valA} : {pair.valB}{!pair.balanced && pair.ratio !== Infinity ? ` (${pair.ratio}:1)` : !pair.balanced ? ' (\u221E)' : ''}
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
 \u26A0 {pair.recommendation}
 </div>
 )}
 </div>
 );
 })}

 {/* Undertrained standalone muscles */}
 {analysis.undertrained.map(u => (
 <div key={u.muscle} style={{ marginBottom: '6px', padding: '6px 8px', background: T.warnSoft, borderRadius: T.radiusSm }}>
 <div style={{ fontSize: '11px', fontWeight: 600, color: T.warn }}>{u.muscle}: {u.weightedSets} weighted sets</div>
 <div style={{ fontSize: '10px', color: T.text2, marginTop: '2px' }}>\u26A0 {u.recommendation}</div>
 </div>
 ))}
 </GlassCard>
 )}
 </div>
 );
}

// ============================================================
// PROGRESS REPORTS — LLM-generated weekly/monthly summaries
// ============================================================

const REPORT_SYSTEM_PROMPT = `You are an insightful fitness and rehab coach who writes progress reports. Your job is to analyze workout history data and produce encouraging, personalized reports.

Guidelines:
- Be warm, specific, and encouraging \u2014 reference actual exercises and numbers from the data
- Spot subtle patterns the user may have missed (volume trends, consistency patterns, exercise preferences, recovery adherence, strength progressions or plateaus)
- Make 2-3 concrete, actionable recommendations based on the data
- Note what's going well and what could improve \u2014 keep criticism constructive and gentle
- End with genuine encouragement tied to something specific you noticed
- Reference the user profile if provided for personalized insights
- Use the selected weight unit consistently`;

function buildReportData(history, daysBack, weightUnit = 'lbs') {
 const now = new Date();
 const cutoff = new Date(now.getTime() - daysBack * 86400000);
 const cutoffStr = cutoff.toISOString().split('T')[0];

 // Gather all dates in range
 const datesInRange = Object.entries(history || {})
 .filter(([d]) => d >= cutoffStr)
 .sort((a, b) => a[0].localeCompare(b[0]));

 const workoutDates = datesInRange.filter(([, acts]) => acts.includes('workout'));
 const rehabDates = datesInRange.filter(([, acts]) => acts.includes('rehab'));
 const cardioDates = datesInRange.filter(([, acts]) => acts.includes('cardio'));

 // Load actual workout data
 const workoutDetails = [];
 const exerciseStats = {};

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
 const maxWeight = Math.max(...sets.map(s => s.weight));
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
 const bodyLogs = loadBodyLogs().filter(l => l.date >= cutoffStr);
 const allBodyLogs = loadAllBodyLogs().filter(l => l.date >= cutoffStr);
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
 period: `${cutoffStr} to ${now.toISOString().split('T')[0]}`,
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
 prompt += `- Weight: ${bt.weightTrend.start}\u2192${bt.weightTrend.end} ${bt.weightTrend.unit} (${bt.weightTrend.delta > 0 ? '+' : ''}${bt.weightTrend.delta}), avg ${bt.avgWeight}\n`;
 }
 if (bt.avgCalories) {
 prompt += `- Avg daily calories: ${bt.avgCalories} kcal (target: ${bt.calorieTarget}, adherence: ${bt.adherencePct}%)\n`;
 }
 if (bt.tdee) {
 prompt += `- TDEE estimate: ${bt.tdee} kcal (${bt.tdeeConfidence} confidence)${bt.tdeeTrend ? ', trend: ' + (bt.tdeeTrend > 0 ? '+' : '') + Math.round(bt.tdeeTrend) + ' kcal' : ''}\n`;
 }
 if (bt.bodyFatTrend) {
 prompt += `- Body fat: ${bt.bodyFatTrend.start}%\u2192${bt.bodyFatTrend.end}% (${bt.bodyFatTrend.delta > 0 ? '+' : ''}${bt.bodyFatTrend.delta}%)\n`;
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
 const arrow = p.weightDelta > 0 ? '\u2191' : p.weightDelta < 0 ? '\u2193' : '\u2192';
 prompt += `- ${p.name}: ${p.firstMax}\u2192${p.lastMax}${data.weightUnit} (${arrow}${Math.abs(p.weightDelta)}), volume ${p.firstVol}\u2192${p.lastVol} over ${p.sessions} sessions\n`;
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

export function ProgressReports({ profile, history, settings, coachCfg, goToSettings }) {
 const [weeklyReport, setWeeklyReport] = useState(() => LS.get(`report:weekly:${getWeekId()}`, null));
 const [monthlyReport, setMonthlyReport] = useState(() => LS.get(`report:monthly:${getMonthId()}`, null));
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
 ...cfg,
 systemPrompt: REPORT_SYSTEM_PROMPT,
 });
 const userPrompt = buildReportPrompt(type, data, profile, settings);

 const dispatcher = DISPATCH[cfg.provider];
 if (!dispatcher) throw new Error(`Unknown provider: ${cfg.provider}`);

 const overrideCfg = { ...cfg, maxTokens: type === 'weekly' ? 400 : 800 };
 const result = await dispatcher(overrideCfg, systemPrompt, [{ role: 'user', content: userPrompt }]);

 const report = {
 text: result.text,
 generatedAt: new Date().toISOString(),
 type,
 period: type === 'weekly' ? getWeekId() : getMonthId(),
 stats: { workouts: data.workoutCount, rehab: data.rehabCount, cardio: data.cardioCount, activeDays: data.totalActiveDays },
 };

 const key = type === 'weekly' ? `report:weekly:${getWeekId()}` : `report:monthly:${getMonthId()}`;
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
 }} onClick={() => hasReport && setExpandedReport(isExpanded ? null : type)}
 role={hasReport ? 'button' : undefined} tabIndex={hasReport ? 0 : undefined}
 aria-expanded={hasReport ? isExpanded : undefined}
 onKeyDown={(e) => { if (hasReport && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setExpandedReport(isExpanded ? null : type); } }}
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
 ? `Generated ${formatDate(report.generatedAt)} \u00B7 ${report.stats.workouts}W ${report.stats.rehab}R ${report.stats.cardio}C`
 : 'No report yet'
 }
 </div>
 </div>
 {hasReport ? (
 <ChevronDown size={16} color={T.text3} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
 ) : (
 <button
 onClick={(e) => { e.stopPropagation(); generateReport(type); }}
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
 {isGenerating ? <><Loader size={12} style={{ animation: 'pulse 1s infinite' }} /> Generating...</> : 'Generate'}
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
 onClick={() => generateReport(type)}
 disabled={!hasKey || isGenerating}
 style={{
 padding: '8px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
 border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.03)',
 color: T.text2, cursor: hasKey ? 'pointer' : 'default',
 display: 'flex', alignItems: 'center', gap: '5px',
 }}
 >
 <RotateCcw size={12} /> {isGenerating ? 'Generating...' : 'Regenerate'}
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
 <button onClick={() => goToSettings?.('coach')} style={{
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

 <button onClick={() => goToSettings?.('coach')} style={{
 width: '100%', padding: '8px', background: 'none', border: 'none',
 color: T.text3, fontSize: '11px', cursor: 'pointer', marginTop: '4px',
 }}>
 Reports use your AI Coach provider &middot; Tap to configure
 </button>
 </div>
 );
}

// ============================================================
// TAB: PROGRESS
// ============================================================

function ProgressTab({ profile, history, goToSettings, coachEnabled, settings, coachCfg, nutritionConfig, onUpdateNutritionConfig, goToToday }) {
 const [historyDetailDate, setHistoryDetailDate] = useState(null);
 const level = LEVELS.find((l, i) => (LEVELS[i+1]?.xp || Infinity) > profile.xp) || LEVELS[0];
 const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];
 const xpInLevel = profile.xp - level.xp;
 const xpForNext = nextLevel ? nextLevel.xp - level.xp : 1;
 const progressPct = nextLevel ? Math.min((xpInLevel / xpForNext) * 100, 100) : 100;

 const recentMuscles = useMemo(() => {
 const muscleHours = {};
 const now = Date.now();
 const keys = LS.keys('workout:');
 const sortedKeys = keys.sort((a, b) => b.localeCompare(a));
 for (const key of sortedKeys) {
 const dateStr = key.replace('workout:', '');
 const date = new Date(dateStr + 'T12:00:00');
 const hoursSince = (now - date.getTime()) / (1000 * 60 * 60);
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
 const bodyLogs = useMemo(() => loadBodyLogs(), []);
 const allBodyLogs = useMemo(() => loadAllBodyLogs(), []);

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
 <div style={{ fontSize:'13px', color:T.text2, marginTop:'2px' }}>{profile.xp.toLocaleString()} XP</div>

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
 {historyDetailDate && <WorkoutDetailModal date={historyDetailDate} onClose={() => setHistoryDetailDate(null)} />}

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
 <span style={{ color:T.success }}>&bull; &lt;48hr</span>
 <span style={{ color:T.warn }}>&bull; 48-96hr</span>
 <span style={{ color:T.danger }}>&bull; &gt;96hr</span>
 <span style={{ color:T.text3 }}>&bull; Never</span>
 </div>
 </GlassCard>

 {/* AI Reports */}
 {settings?.reportsEnabled && (
 <ProgressReports profile={profile} history={history} settings={settings || {}}
 coachCfg={coachCfg || {}} goToSettings={goToSettings} />
 )}

 {/* Quick Settings Link */}
 <button onClick={() => goToSettings?.('training')} style={{
 width:'100%', padding:'14px 16px', background:T.bgCard, border:`1px solid ${T.border}`,
 borderRadius:T.radius, cursor:'pointer', display:'flex', alignItems:'center', gap:'12px',
 marginTop:'16px', transition:'all 0.2s',
 }}>
 <Settings size={18} color={T.text3} />
 <div style={{ flex:1, textAlign:'left' }}>
 <div style={{ fontSize:'14px', fontWeight:600, color:T.text }}>Settings</div>
 <div style={{ fontSize:'11px', color:T.text3, marginTop:'1px' }}>
 {profile.phase} &middot; {profile.location} &middot; units, timers, recovery{coachEnabled ? ', AI coach' : ''}{settings?.reportsEnabled ? ', reports' : ''}
 </div>
 </div>
 <ChevronRight size={16} color={T.text3} />
 </button>
 </div>
 );
}

export default ProgressTab;

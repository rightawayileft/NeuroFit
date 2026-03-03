import { EXERCISES, EXERCISE_MAP } from '@/data/exercises';
import { VOLUME_LANDMARKS, getAdjustedLandmarks } from '@/data/volumeLandmarks';
import { LS } from '@/lib/storage';
import { getWorkoutExercises } from '@/lib/workoutNormalize';

// ============================================================
// MUSCLE BALANCE ANALYSIS
// ============================================================

export function computeWeightedMuscleVolume(settings) {
  const result = {};
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
    if (new Date(dateStr) < weekStart) continue;
    const exercises = getWorkoutExercises(LS.get(key, null));
    for (const ex of exercises) {
      const doneSets = (ex.logSets || []).filter(s => s.done).length;
      if (doneSets === 0) continue;
      const def = EXERCISE_MAP[ex.id];
      if (!def?.muscles) continue;
      const allMuscles = {...(def.muscles.primary || {}), ...(def.muscles.secondary || {}) };
      for (const [muscle, pct] of Object.entries(allMuscles)) {
        if (!result[muscle]) result[muscle] = { weightedSets: 0, rawSets: 0, exerciseContributions: [] };
        const weighted = doneSets * (pct / 100);
        result[muscle].weightedSets += weighted;
        result[muscle].rawSets += doneSets;
        result[muscle].exerciseContributions.push({ id: ex.id, name: def.name, sets: doneSets, pct });
      }
    }
  }
  // Round for display
  for (const m of Object.values(result)) m.weightedSets = Math.round(m.weightedSets * 10) / 10;
  return result;
}

export const MUSCLE_PAIRS = [
  { name: 'Front vs Rear Delts', muscleA: ['anterior_deltoid'], muscleB: ['posterior_deltoid'], labelA: 'Front Delts', labelB: 'Rear Delts', threshold: 2.5 },
  { name: 'Chest vs Upper Back', muscleA: ['pec_major_sternal', 'pec_major_clavicular'], muscleB: ['middle_trapezius', 'rhomboids', 'lower_trapezius'], labelA: 'Chest', labelB: 'Upper Back', threshold: 2 },
  { name: 'Biceps vs Triceps', muscleA: ['biceps_long_head', 'biceps_short_head', 'brachialis'], muscleB: ['triceps_long_head', 'triceps_lateral_head', 'triceps_medial_head'], labelA: 'Biceps', labelB: 'Triceps', threshold: 2 },
  { name: 'Quads vs Hamstrings', muscleA: ['rectus_femoris', 'vastus_lateralis', 'vastus_medialis', 'vastus_intermedius'], muscleB: ['biceps_femoris', 'semitendinosus', 'semimembranosus'], labelA: 'Quads', labelB: 'Hamstrings', threshold: 2.5 },
  { name: 'Lateral Deltoid', muscleA: ['lateral_deltoid'], muscleB: null, labelA: 'Side Delts', labelB: null, threshold: null },
];

function sumWeighted(vol, muscles) {
  return muscles.reduce((s, m) => s + (vol[m]?.weightedSets || 0), 0);
}

export function analyzeMuscleBalance(weightedVolume) {
  const pairs = [];
  const undertrained = [];

  for (const pair of MUSCLE_PAIRS) {
    const valA = sumWeighted(weightedVolume, pair.muscleA);

    // Standalone muscle check (e.g., lateral deltoid)
    if (!pair.muscleB) {
      if (valA < 2) {
        undertrained.push({ muscle: pair.labelA, weightedSets: valA, recommendation: findRecommendation(pair.muscleA) });
      }
      continue;
    }

    const valB = sumWeighted(weightedVolume, pair.muscleB);
    const max = Math.max(valA, valB);
    const min = Math.max(valA, valB) === valA ? valB : valA;
    const ratio = min > 0 ? Math.round((max / min) * 10) / 10 : (max > 0 ? Infinity : 1);
    const dominant = valA >= valB ? 'A' : 'B';
    const balanced = ratio <= pair.threshold;

    let recommendation = '';
    if (!balanced) {
      const weakLabel = dominant === 'A' ? pair.labelB : pair.labelA;
      const weakMuscles = dominant === 'A' ? pair.muscleB : pair.muscleA;
      recommendation = `${weakLabel} undertrained — ${findRecommendation(weakMuscles)}`;
    }

    pairs.push({
      name: pair.name, labelA: pair.labelA, labelB: pair.labelB,
      valA: Math.round(valA * 10) / 10, valB: Math.round(valB * 10) / 10,
      ratio, dominant, balanced, recommendation,
    });
  }

  return { pairs, undertrained };
}

function findRecommendation(targetMuscles) {
  const suggestions = [];
  for (const ex of EXERCISES) {
    if (!ex.muscles?.primary) continue;
    for (const m of targetMuscles) {
      if ((ex.muscles.primary[m] || 0) >= 50) {
        suggestions.push(ex.name);
        break;
      }
    }
    if (suggestions.length >= 3) break;
  }
  return suggestions.length > 0 ? `try ${suggestions.join(', ')}` : 'add isolation work';
}

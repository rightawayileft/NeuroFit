import { LS } from '@/lib/storage';
import { EXERCISES, EXERCISE_MAP } from '@/data/exercises';
import { VOLUME_LANDMARKS, getAdjustedLandmarks, UPPER_CATEGORIES } from '@/data/volumeLandmarks';
import { today, subtractDays } from '@/lib/dateUtils';
import { getWorkoutExercises } from '@/lib/workoutNormalize';

// ============================================================
// PROGRESSIVE OVERLOAD ENGINE
// ============================================================

export function estimate1RM(weight, reps) {
  if (!weight || !reps || reps <= 0) return 0;
  if (reps === 1) return weight;
  if (reps > 12) return weight * (1 + reps / 30); // Epley approx for high reps
  return weight * (36 / (37 - reps)); // Brzycki
}

// Volume helper: warm-up sets don't count toward working volume
export function isWorkingVolume(set) {
  return set.setType !== 'warmup';
}

export function getExerciseHistory(exerciseId, maxSessions = 5) {
  const keys = LS.keys('workout:');
  const sessions = [];
  const sortedKeys = keys.sort((a, b) => b.localeCompare(a));
  for (const key of sortedKeys) {
    if (sessions.length >= maxSessions) break;
    const raw = LS.get(key, null);
    const exs = getWorkoutExercises(raw);
    for (const ex of exs) {
      if (ex.id === exerciseId) {
        const doneSets = (ex.logSets || []).filter(s => s.done && (s.weight || s.reps));
        if (doneSets.length > 0) {
          sessions.push({
            date: key.replace('workout:', ''),
            sets: doneSets.map(s => ({
              weight: parseFloat(s.weight) || 0,
              reps: parseInt(s.reps) || 0,
              rpe: parseFloat(s.rpe) || 0,
            })),
          });
        }
      }
    }
  }
  return sessions;
}

export function prescribeNextSession(exerciseId, trainingGoal = 'hypertrophy', settings = {}) {
  const exercise = EXERCISES.find(e => e.id === exerciseId);
  if (!exercise) return null;

  const history = getExerciseHistory(exerciseId, 5);
  if (history.length === 0) return null;

  const isUpper = UPPER_CATEGORIES.has(exercise.category);
  const increment = isUpper
    ? (settings.weightIncrementUpper || 5)
    : (settings.weightIncrementLower || 10);

  const repRange = exercise.repRanges?.[trainingGoal] || exercise.repRanges?.hypertrophy || { min: 8, max: 12 };
  const { min: repLow, max: repHigh } = repRange;

  const lastSession = history[0];
  const lastSets = lastSession.sets;
  const lastWeight = lastSets.reduce((max, s) => Math.max(max, s.weight), 0);
  const lastAvgReps = Math.round(lastSets.reduce((sum, s) => sum + s.reps, 0) / lastSets.length);
  const isBodyweight = lastWeight === 0;

  let prescribedWeight, prescribedReps, action;

  if (isBodyweight) {
    // BW: only track reps
    const allAboveHigh = lastSets.every(s => s.reps >= repHigh);
    const consecutiveHigh = history.slice(0, 3).every(sess =>
      sess.sets.every(s => s.reps >= repHigh)
    );
    if (consecutiveHigh && history.length >= 3 && exercise.progressionIds?.length > 0) {
      action = 'progress_exercise';
      prescribedWeight = 0;
      prescribedReps = repLow;
    } else if (allAboveHigh) {
      action = 'add_rep';
      prescribedWeight = 0;
      prescribedReps = Math.min(lastAvgReps + 1, repHigh + 5);
    } else {
      action = 'maintain';
      prescribedWeight = 0;
      prescribedReps = Math.min(lastAvgReps + 1, repHigh);
    }
  } else {
    const allAboveHigh = lastSets.every(s => s.reps >= repHigh);
    const anyBelowLow = lastSets.some(s => s.reps < repLow);

    if (allAboveHigh) {
      action = 'increase_weight';
      prescribedWeight = lastWeight + increment;
      prescribedReps = repLow;
    } else if (anyBelowLow) {
      action = 'decrease_weight';
      prescribedWeight = Math.max(0, lastWeight - increment);
      prescribedReps = repLow;
    } else {
      action = 'add_rep';
      prescribedWeight = lastWeight;
      prescribedReps = Math.min(lastAvgReps + 1, repHigh);
    }
  }

  // Check for stall → suggest regression if available
  const stallStatus = detectStall(exerciseId);
  if (stallStatus.stalled && exercise.regressionIds?.length > 0 && action !== 'progress_exercise') {
    action = 'regress_exercise';
  }

  // Compute rolling e1RM
  const recent1RMs = history.slice(0, 3).flatMap(s =>
    s.sets.filter(set => set.weight > 0 && set.reps > 0 && set.reps <= 12).map(set => estimate1RM(set.weight, set.reps))
  );
  const avg1RM = recent1RMs.length > 0 ? Math.round(recent1RMs.reduce((a, b) => a + b, 0) / recent1RMs.length) : 0;

  return {
    prescribedWeight,
    prescribedReps,
    action, // 'increase_weight' | 'decrease_weight' | 'add_rep' | 'maintain' | 'progress_exercise' | 'regress_exercise'
    lastWeight,
    lastAvgReps,
    repRange: { low: repLow, high: repHigh },
    rest: repRange.rest,
    estimated1RM: avg1RM,
    historyLength: history.length,
    progressionExercise: action === 'progress_exercise'
      ? EXERCISES.find(e => e.id === exercise.progressionIds?.[0])?.name
      : null,
    progressionIds: exercise.progressionIds || [],
    regressionExercise: action === 'regress_exercise'
      ? EXERCISES.find(e => e.id === exercise.regressionIds?.[0])?.name
      : null,
    regressionIds: exercise.regressionIds || [],
  };
}

// ============================================================
// STALL DETECTION
// ============================================================

export function detectStall(exerciseId) {
  const history = getExerciseHistory(exerciseId, 5);
  if (history.length < 3) return { stalled: false, fatigued: false };

  const recent3 = history.slice(0, 3);

  // Check weight+reps stall: unchanged for 3 sessions
  const weights = recent3.map(s => Math.max(...s.sets.map(x => x.weight)));
  const avgReps = recent3.map(s => Math.round(s.sets.reduce((sum, x) => sum + x.reps, 0) / s.sets.length));
  const weightStall = weights.every(w => w === weights[0]);
  const repStall = avgReps.every(r => r === avgReps[0]);
  const stalled = weightStall && repStall;

  // Check RPE fatigue: trending up
  const avgRPEs = recent3.map(s => {
    const rpes = s.sets.filter(x => x.rpe > 0).map(x => x.rpe);
    return rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0;
  }).filter(r => r > 0);

  let fatigued = false;
  if (avgRPEs.length >= 3) {
    // oldest to newest
    const reversed = [...avgRPEs].reverse();
    const trend = reversed[reversed.length - 1] - reversed[0];
    fatigued = trend >= 1.0; // RPE rising by 1+ over 3 sessions at same load
  }

  return { stalled, fatigued };
}

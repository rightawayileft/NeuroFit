import { EXERCISES, EXERCISE_MAP } from '@/data/exercises';
import { SPLIT_TEMPLATES, selectSplit, getSplitDay } from '@/data/splitTemplates';
import { VOLUME_LANDMARKS, getAdjustedLandmarks, UPPER_CATEGORIES } from '@/data/volumeLandmarks';
import { LS } from '@/lib/storage';
import { today, subtractDays } from '@/lib/dateUtils';
import { getExerciseHistory, prescribeNextSession, detectStall } from '@/lib/progressiveOverload';
import { normalizeWorkout, getWorkoutExercises } from '@/lib/workoutNormalize';

// ============================================================
// WORKOUT GENERATION (Split-Aware)
// ============================================================

export function generateWorkout(phase, location, history = [], settings = {}, overrides = {}) {
  const pool = EXERCISES.filter(ex => {
    const phaseData = ex.phase?.[phase];
    if (!phaseData || phaseData.s === 'avoid') return false;
    if (!ex.location?.[location]) return false;
    return true;
  });

  // Determine split — user override takes priority
  const daysPerWeek = settings.daysPerWeek || 3;
  const experienceLevel = settings.experienceLevel || 'beginner';
  const trainingGoal = settings.trainingGoal || 'hypertrophy';
  const split = overrides.forceSplit || selectSplit(daysPerWeek, experienceLevel);

  // Figure out which day index we're on based on recent history (or user override)
  const template = SPLIT_TEMPLATES[split];
  let dayIndex = 0;

  if (overrides.forceDayIndex != null && template) {
    dayIndex = overrides.forceDayIndex;
  } else {
    const recentSplitDays = history
      .map(h => normalizeWorkout(h))
      .filter(Boolean)
      .map(w => w.splitDay || 'full_body');
    if (template && recentSplitDays.length > 0) {
      const lastDay = recentSplitDays[0];
      const lastIdx = template.days.findIndex(d => d.name.toLowerCase().replace(/\s+/g, '_') === lastDay);
      dayIndex = lastIdx >= 0 ? (lastIdx + 1) % template.days.length : 0;
    }
  }
  const splitDay = template ? template.days[dayIndex % template.days.length] : SPLIT_TEMPLATES.full_body.days[0];
  const splitDayName = splitDay.name.toLowerCase().replace(/\s+/g, '_');
  const targetCategories = new Set(splitDay.slots);

  // Build a lookup of last-used weight/reps per exercise ID from recent history
  const lastUsed = {};
  const lastSessionSetsMap = {}; // exerciseId -> array of {weight, reps} from last session
  for (const pastWorkout of history) {
    const exs = getWorkoutExercises(pastWorkout);
    for (const ex of exs) {
      if (lastUsed[ex.id]) continue;
      const doneSets = (ex.logSets || []).filter(s => s.done && (s.weight || s.reps));
      if (doneSets.length > 0) {
        const last = doneSets[doneSets.length - 1];
        lastUsed[ex.id] = { weight: last.weight || '', reps: last.reps || '', rpe: last.rpe || '' };
        lastSessionSetsMap[ex.id] = doneSets.map(s => ({ weight: s.weight || 0, reps: s.reps || 0 }));
      }
    }
  }

  // Avoid repeating same exercise from last session
  const lastWorkout = history[0];
  const lastExs = getWorkoutExercises(lastWorkout);
  const lastIds = new Set(lastExs.map(e => e.id));

  // For full body, use the original slot system for best results
  if (split === 'full_body') {
    const slots = [
      { role: 'Chest Press', cats: ['chest'], patternFilter: ['horizontal_push'], mandatory: true },
      { role: 'Horizontal Row', cats: ['back'], patternFilter: ['horizontal_pull'], mandatory: true },
      { role: 'Shoulder Press', cats: ['shoulders'], patternFilter: ['vertical_push'], mandatory: true },
      { role: 'Lower Compound', cats: ['quads'], patternFilter: ['squat','lunge'], mandatory: true },
      { role: 'Hip Hinge', cats: ['hamstrings'], patternFilter: ['hip_hinge'], mandatory: true },
      { role: 'Glute', cats: ['glutes'], mandatory: true },
      { role: 'Core', cats: ['core'], mandatory: true },
      { role: 'Scapular Corrective', cats: ['back','shoulders','neck'], patternFilter: ['corrective'], mandatory: true },
      { role: 'Glute Med', cats: ['glutes'], patternFilter: ['isolation_lower'], mandatory: true },
      { role: 'Triceps', cats: ['triceps'], mandatory: false },
      { role: 'Biceps', cats: ['biceps'], mandatory: false },
      { role: 'Calves', cats: ['calves'], mandatory: false },
      { role: 'Neck', cats: ['neck'], mandatory: false },
    ];

    return buildWorkoutFromSlots(slots, pool, lastIds, lastUsed, lastSessionSetsMap, phase, trainingGoal, settings, splitDayName);
  }

  // For upper/lower/PPL, build slots dynamically from split day
  const slots = [];
  const catSlotMap = {
    chest: [{ role: 'Chest Press', patternFilter: ['horizontal_push'], mandatory: true },
            { role: 'Chest Isolation', patternFilter: ['isolation_upper'], mandatory: false }],
    back: [{ role: 'Horizontal Row', patternFilter: ['horizontal_pull'], mandatory: true },
           { role: 'Vertical Pull', patternFilter: ['vertical_pull'], mandatory: true }],
    shoulders: [{ role: 'Shoulder Press', patternFilter: ['vertical_push'], mandatory: true },
                { role: 'Side Delt', patternFilter: ['isolation_upper'], mandatory: false }],
    rear_delts:[{ role: 'Rear Delt', patternFilter: ['horizontal_pull','isolation_upper','corrective'], mandatory: false }],
    triceps: [{ role: 'Triceps', mandatory: false }],
    biceps: [{ role: 'Biceps', mandatory: false }],
    quads: [{ role: 'Quad Compound', patternFilter: ['squat','lunge'], mandatory: true },
            { role: 'Quad Isolation', patternFilter: ['isolation_lower'], mandatory: false }],
    hamstrings:[{ role: 'Hip Hinge', patternFilter: ['hip_hinge'], mandatory: true },
               { role: 'Ham Curl', patternFilter: ['isolation_lower'], mandatory: false }],
    glutes: [{ role: 'Glute', mandatory: true }],
    calves: [{ role: 'Calves', mandatory: false }],
    core: [{ role: 'Core', mandatory: false }],
    neck: [{ role: 'Neck', mandatory: false }],
  };

  for (const cat of splitDay.slots) {
    const catSlots = catSlotMap[cat] || [{ role: cat, mandatory: false }];
    for (const s of catSlots) {
      slots.push({...s, cats: [cat === 'rear_delts' ? 'shoulders' : cat] });
    }
  }

  return buildWorkoutFromSlots(slots, pool, lastIds, lastUsed, lastSessionSetsMap, phase, trainingGoal, settings, splitDayName);
}

function buildWorkoutFromSlots(slots, pool, lastIds, lastUsed, lastSessionSetsMap, phase, trainingGoal, settings, splitDayName) {
  const used = new Set();
  const workout = [];

  for (const slot of slots) {
    let candidates = pool.filter(ex =>
      slot.cats.includes(ex.category) && !used.has(ex.id)
    );

    // Filter by movement pattern if specified
    if (slot.patternFilter) {
      const patternFiltered = candidates.filter(ex => slot.patternFilter.includes(ex.movementPattern));
      if (patternFiltered.length > 0) candidates = patternFiltered;
    }

    // Prefer not repeating from last session
    const fresh = candidates.filter(ex => !lastIds.has(ex.id));
    if (fresh.length > 0) candidates = fresh;

    // Deprioritize stalled exercises — prefer non-stalled alternatives
    const nonStalled = candidates.filter(ex => {
      const s = detectStall(ex.id);
      return !s.stalled;
    });
    if (nonStalled.length > 0) candidates = nonStalled;

    // Sort by: SFR rating (prefer higher), then phase priority
    candidates.sort((a, b) => {
      const ap = a.phase?.[phase]?.p || 0;
      const bp = b.phase?.[phase]?.p || 0;
      if (bp !== ap) return bp - ap;
      return (b.sfrRating || 3) - (a.sfrRating || 3);
    });

    if (candidates.length > 0) {
      const topN = candidates.slice(0, Math.min(3, candidates.length));
      const weights = topN.map((_, i) => topN.length - i);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let roll = Math.random() * totalWeight;
      let pickIdx = 0;
      for (let i = 0; i < weights.length; i++) {
        roll -= weights[i];
        if (roll <= 0) { pickIdx = i; break; }
      }
      const pick = topN[pickIdx];
      used.add(pick.id);

      // Get prescription if progressive overload is enabled
      const prescription = settings.enableProgressiveOverload !== false
        ? prescribeNextSession(pick.id, trainingGoal, settings)
        : null;

      const prev = lastUsed[pick.id];
      const repRange = pick.repRanges?.[trainingGoal] || pick.repRanges?.hypertrophy;
      const restTime = repRange?.rest || pick.rest || 90;
      const numSets = pick.sets || 3;

      workout.push({
        ...pick,
        slot: slot.role,
        mandatory: slot.mandatory,
        rest: restTime,
        prescription,
        lastSessionSets: lastSessionSetsMap[pick.id] || null,
        logSets: Array.from({length: numSets}, () => ({
          weight: prescription?.prescribedWeight ?? prev?.weight ?? '',
          reps: prescription?.prescribedReps ?? prev?.reps ?? '',
          rpe: prev?.rpe || '',
          done: false,
        })),
      });
    }
  }

  // Wrap in v2 schema
  workout._splitDay = splitDayName;
  return workout;
}

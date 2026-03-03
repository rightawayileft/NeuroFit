// ============================================================
// WORKOUT NORMALIZATION (backward compat for flat arrays)
// ============================================================

export function normalizeWorkout(stored) {
  if (!stored) return null;
  if (Array.isArray(stored)) return { exercises: stored, version: 1, splitDay: 'full_body' };
  if (stored.exercises) return stored;
  return null;
}

export function getWorkoutExercises(stored) {
  const w = normalizeWorkout(stored);
  return w ? w.exercises : [];
}

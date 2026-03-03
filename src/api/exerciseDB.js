import { API_URLS, apiFetch, rateLimitOk, trackCacheHit } from './apiConfig';

const exerciseCache = new Map();
const EXERCISE_LIST_CACHE_KEY = 'allExercises';
let snapshotPromise = null;

const CATEGORY_TO_QUERY = {
 chest: { bodyPart: 'chest' },
 back: { bodyPart: 'back' },
 shoulders: { bodyPart: 'shoulders' },
 rear_delts: { bodyPart: 'shoulders', target: 'delts' },
 biceps: { target: 'biceps' },
 triceps: { target: 'triceps' },
 quads: { target: 'quads' },
 hamstrings: { target: 'hamstrings' },
 glutes: { target: 'glutes' },
 calves: { target: 'calves' },
 core: { target: 'abs' },
 neck: { bodyPart: 'neck' },
 cardio: { bodyPart: 'cardio' },
};

const EQUIPMENT_MAP = {
 dumbbell: 'dumbbells',
 barbell: 'barbell',
 cable: 'cable_machine',
 'body weight': 'bodyweight',
 'leverage machine': 'machine',
 band: 'resistance_bands',
 'smith machine': 'smith_machine',
 kettlebell: 'kettlebell',
};

function normalizeText(value) {
 return String(value || '').trim().toLowerCase();
}

function getCacheEntry(key) {
 if (!exerciseCache.has(key)) return null;
 trackCacheHit('exerciseDB');
 return exerciseCache.get(key);
}

function mapCategory(raw) {
 const target = normalizeText(raw?.target || raw?.targetMuscles?.[0]);
 const bodyPart = normalizeText(raw?.bodyPart || raw?.bodyParts?.[0]);

 if (target.includes('tricep')) return 'triceps';
 if (target.includes('bicep')) return 'biceps';
 if (target.includes('hamstring')) return 'hamstrings';
 if (target.includes('glute')) return 'glutes';
 if (target.includes('quad')) return 'quads';
 if (target.includes('calf')) return 'calves';
 if (target.includes('abs') || bodyPart === 'waist') return 'core';
 if (bodyPart === 'upper arms') return 'biceps';
 if (bodyPart === 'lower arms') return 'forearms';
 if (bodyPart === 'upper legs') return 'quads';
 if (bodyPart === 'lower legs') return 'calves';
 if (bodyPart === 'chest' || bodyPart === 'back' || bodyPart === 'shoulders' || bodyPart === 'neck' || bodyPart === 'cardio') {
  return bodyPart;
 }

 return 'other';
}

function getLocation(raw) {
 const equipment = normalizeText(raw?.equipment || raw?.equipments?.[0]);
 const portable = ['body weight', 'band', 'dumbbell', 'kettlebell'].includes(equipment);
 return {
 gym: true,
 home: portable,
 work: equipment === 'body weight' || equipment === 'band',
 };
}

function extractExercises(result) {
 if (Array.isArray(result)) return result;
 if (Array.isArray(result?.data)) return result.data;
 if (Array.isArray(result?.data?.exercises)) return result.data.exercises;
 if (Array.isArray(result?.exercises)) return result.exercises;
 return [];
}

function matchesEquipment(exercise, equipment) {
 if (!equipment) return true;
 const wanted = normalizeText(equipment);
 const actual = normalizeText(exercise?.equipment?.[0] || exercise?.equipmentName);
 return !wanted || !actual || actual.includes(wanted) || wanted.includes(actual);
}

function matchesBodyPart(raw, bodyPart) {
 if (!bodyPart) return true;
 const wanted = normalizeText(bodyPart);
 const mapped = CATEGORY_TO_QUERY[wanted]?.bodyPart || wanted;
 const rawParts = Array.isArray(raw?.bodyParts)
  ? raw.bodyParts.map(normalizeText)
  : [normalizeText(raw?.bodyPart)];
 return rawParts.includes(normalizeText(mapped));
}

function matchesTarget(raw, target) {
 if (!target) return true;
 const wanted = normalizeText(target);
 const rawTargets = Array.isArray(raw?.targetMuscles)
  ? raw.targetMuscles.map(normalizeText)
  : [normalizeText(raw?.target)];
 return rawTargets.some((entry) => entry.includes(wanted) || wanted.includes(entry));
}

function matchesRawEquipment(raw, equipment) {
 if (!equipment) return true;
 const wanted = normalizeText(equipment);
 const rawEquipment = Array.isArray(raw?.equipments)
  ? raw.equipments.map(normalizeText)
  : [normalizeText(raw?.equipment)];
 return rawEquipment.some((entry) => entry.includes(wanted) || wanted.includes(entry));
}

async function fetchAllExercises() {
 const cached = getCacheEntry(EXERCISE_LIST_CACHE_KEY);
 if (cached) return cached;

 if (!snapshotPromise) {
  snapshotPromise = import('@/data/exerciseDbSnapshot.json')
   .then((module) => module.default || [])
   .catch(() => null);
 }

 const snapshot = await snapshotPromise;
 if (Array.isArray(snapshot) && snapshot.length > 0) {
  exerciseCache.set(EXERCISE_LIST_CACHE_KEY, snapshot);
  return snapshot;
 }

 const result = await apiFetch(`${API_URLS.exerciseDB}/exercises?offset=0&limit=100`, { apiName: 'exerciseDB' });
 if (result?.error) return result;

 const exercises = extractExercises(result);
 exerciseCache.set(EXERCISE_LIST_CACHE_KEY, exercises);
 return exercises;
}

function normalizeExerciseDBEntry(raw) {
 if (!raw || !raw.name) return null;

 const normalizedCategory = mapCategory(raw);
 const equipment = normalizeText(raw.equipment || raw.equipments?.[0]);
 const normalizedEquipment = EQUIPMENT_MAP[equipment] || equipment || 'bodyweight';
 const displayName = String(raw.name)
  .split(' ')
  .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
  .join(' ');

 return {
  id: `EDB-${raw.id || raw.exerciseId || displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  name: displayName,
  category: normalizedCategory,
  equipment: [normalizedEquipment],
  location: getLocation(raw),
  source: 'exercisedb',
  imageUrl: raw.gifUrl || raw.imageUrl || null,
  target: raw.target || raw.targetMuscles?.[0] || null,
  secondaryMuscles: Array.isArray(raw.secondaryMuscles) ? raw.secondaryMuscles : [],
  instructions: Array.isArray(raw.instructions) ? raw.instructions : [],
  sets: 3,
  reps: '8-12',
  rest: 90,
  tier: 3,
  phase: {
   acute: { s: 'caution', p: 1, n: 'Community exercise: not individually reviewed for rehab safety. Use caution.' },
   subacute: { s: 'suitable', p: 2, n: 'Community exercise: verify form independently before loading.' },
   maintenance: { s: 'suitable', p: 3, n: 'Community exercise from ExerciseDB.' },
  },
  cues: [],
  mistakes: [],
  why: '',
  muscles: { primary: {}, secondary: {} },
  movementPattern: 'unknown',
  primaryMuscleGroup: normalizedCategory,
  secondaryMuscleGroups: [],
  sfrRating: 2,
  progressionIds: [],
  regressionIds: [],
  subs: [],
 };
}

export async function searchExerciseDB({ bodyPart, equipment, target, limit = 10 } = {}) {
 if (!rateLimitOk('exerciseDB')) {
  return { error: true, message: 'Rate limit reached. Try again in a moment.', data: [] };
 }

 const mapped = CATEGORY_TO_QUERY[bodyPart] || {};
 const resolvedTarget = target || mapped.target || '';
 const resolvedBodyPart = mapped.bodyPart || bodyPart || '';

 const cacheKey = `search|${resolvedBodyPart}|${resolvedTarget}|${equipment || ''}`;
 const cached = getCacheEntry(cacheKey);
 if (cached) {
  return { error: false, data: cached.slice(0, limit) };
 }

 const result = await fetchAllExercises();
 if (!Array.isArray(result)) {
  return { error: true, message: result.message || 'Unable to load community exercises.', data: [] };
 }

 const normalized = result
  .filter((raw) => matchesBodyPart(raw, resolvedBodyPart))
  .filter((raw) => matchesTarget(raw, resolvedTarget))
  .filter((raw) => matchesRawEquipment(raw, equipment))
  .map(normalizeExerciseDBEntry)
  .filter(Boolean)
  .filter((exercise) => matchesEquipment(exercise, equipment));

 exerciseCache.set(cacheKey, normalized);
 return { error: false, data: normalized.slice(0, limit) };
}

export async function getBodyPartList() {
 const cacheKey = 'bodyPartList';
 const cached = getCacheEntry(cacheKey);
 if (cached) return cached;
 if (!rateLimitOk('exerciseDB')) return [];

 const result = await fetchAllExercises();
 if (!Array.isArray(result)) return [];
 const list = [...new Set(result.flatMap((raw) => raw.bodyParts || []).map(normalizeText))].sort();
 exerciseCache.set(cacheKey, list);
 return list;
}

export async function getEquipmentList() {
 const cacheKey = 'equipmentList';
 const cached = getCacheEntry(cacheKey);
 if (cached) return cached;
 if (!rateLimitOk('exerciseDB')) return [];

 const result = await fetchAllExercises();
 if (!Array.isArray(result)) return [];
 const list = [...new Set(result.flatMap((raw) => raw.equipments || []).map(normalizeText))].sort();
 exerciseCache.set(cacheKey, list);
 return list;
}

# NeuroFit Engineering Guide
## Architecture Refactor · API Integration · Documentation & Roadmap

**Version:** 1.0  
**App:** NeuroFit (NeuroRehab Tracker)  
**Current state:** Modular React PWA with Vite + React 18 (Phase A complete)
**License:** BUSL-1.1 (converts to BSD-3-Clause on 2030-03-03)

---

# Part A — Breaking Up the Monolith ✅ COMPLETE

## A.1 — Why This Matters

The current `App.jsx` is approximately 8,927 lines containing the entire application: design system tokens, a 102-exercise database with detailed rehab phase data, YouTube video URL mappings, volume landmark constants, split templates, body tracking algorithms (3 weight-smoothing methods, body fat calibration with 4 strategies, adaptive TDEE), progressive overload engine, PR detection, workout generation, 7+ tab-level UI components, dozens of sub-components, and the root App orchestrator with ~10 `useState` hooks.

This works, but it creates concrete problems:

- **Merge conflicts**: Any change to any feature touches the same file, making collaborative work or even multi-branch solo work painful.
- **Bundle size**: Vite can't tree-shake or code-split a single file effectively. Every user pays the cost of loading the full exercise database even if they only open Settings.
- **Testability**: You can't unit-test `smoothMacroFactor()` without importing 9,000 lines of React components. Pure algorithmic functions are tangled with UI.
- **Cognitive load**: Finding `prescribeNextSession` requires searching through thousands of lines instead of opening `src/lib/progressiveOverload.js`.
- **API integration surface area**: When you add ExerciseDB and YouTube API calls, you need clear boundaries for where external data enters vs. where local curated data lives. A monolith makes this boundary invisible.

## A.2 — Target File Structure

```
src/
├── App.jsx                          # Root orchestrator ONLY (~200 lines)
├── main.jsx                         # Entry point (unchanged)
│
├── design/
│   └── tokens.js                    # T object, css string, GlassCard, shared styles
│
├── data/
│   ├── exercises.js                 # EXERCISES array (all 102 exercise objects)
│   ├── videoUrls.js                 # VIDEO_URLS map + getVideoUrl()
│   ├── splitTemplates.js            # SPLIT_TEMPLATES, selectSplit(), getSplitDay()
│   ├── volumeLandmarks.js           # VOLUME_LANDMARKS, getAdjustedLandmarks()
│   ├── dailyRehab.js                # DAILY_REHAB array
│   ├── cardioOptions.js             # CARDIO_OPTIONS array
│   ├── levels.js                    # LEVELS array, XP_REWARDS, BODY_XP
│   └── defaults.js                  # DEFAULT_SETTINGS, DEFAULT_NUTRITION_CONFIG,
│                                    # DEFAULT_CALIBRATION, DEFAULT_BODY_LOG,
│                                    # DEFAULT_STREAKS, DEFAULT_COACH_CONFIG
│
├── lib/
│   ├── storage.js                   # LS object, _lsAvailable, _memoryStore
│   ├── dateUtils.js                 # today(), dayKey(), subtractDays()
│   ├── weightSmoothing.js           # smoothMacroFactor, smoothHappyScale,
│   │                                # smoothLibra, interpolateMissing,
│   │                                # getSmoothedWeights
│   ├── bodyFatCalibration.js        # recalcCalibration, getCalibratedBodyFat
│   ├── tdee.js                      # linearRegressionSlope, updateExpenditure,
│   │                                # computeCalorieTarget
│   ├── streaks.js                   # updateStreaks, checkCombinedStreak
│   ├── workoutNormalize.js          # normalizeWorkout, getWorkoutExercises
│   ├── progressiveOverload.js       # estimate1RM, isWorkingVolume,
│   │                                # prescribeNextSession, getExerciseHistory,
│   │                                # detectStall
│   ├── prDetection.js               # getPRData, savePRData, detectPRs
│   ├── muscleBalance.js             # MUSCLE_PAIRS, computeWeightedMuscleVolume,
│   │                                # analyzeMuscleBalance, sumWeighted,
│   │                                # findRecommendation
│   ├── workoutGenerator.js          # generateWorkout (the main algorithm)
│   └── exportImport.js              # Data export/import logic
│
├── api/                             # NEW — external API integrations
│   ├── exerciseDB.js                # ExerciseDB fetch + transform
│   ├── youtube.js                   # YouTube Data API v3 link validation
│   └── apiConfig.js                 # API keys, base URLs, rate limit helpers
│
├── hooks/
│   ├── useLocalStorage.js           # Generic hook wrapping LS get/set
│   ├── useRestTimer.js              # Rest timer logic (currently inline)
│   ├── useWakeLock.js               # Screen wake lock (currently inline)
│   └── useWorkout.js                # Workout state + handlers (optional)
│
├── components/
│   ├── ExerciseCard.jsx             # The big exercise card component
│   ├── GlassCard.jsx                # Reusable glass card wrapper
│   ├── Toast.jsx                    # Toast notification
│   ├── MuscleMap.jsx                # SVG muscle map visualization
│   ├── VolumeTracker.jsx            # Weekly volume bar chart
│   ├── StrengthChart.jsx            # Per-exercise strength progress SVG
│   ├── WeightTrendChart.jsx         # Body weight trend chart
│   ├── NutritionChart.jsx           # Calorie/protein chart
│   ├── TDEETrendChart.jsx           # TDEE trend chart
│   ├── WaistChart.jsx               # Waist circumference chart
│   ├── BodyFatChart.jsx             # Body fat trend chart
│   ├── RestTimerBar.jsx             # Floating rest timer
│   └── SwapPanel.jsx                # Exercise swap/skip panel
│
├── tabs/
│   ├── TodayTab.jsx                 # Train tab
│   ├── RehabTab.jsx                 # Daily rehab checklist
│   ├── CardioTab.jsx                # Cardio logging
│   ├── ProgressTab.jsx              # Progress/analytics dashboard
│   ├── CoachTab.jsx                 # AI coach chat
│   └── SettingsTab.jsx              # Settings & data management
│
└── __tests__/                       # Unit tests (see Part C)
    ├── weightSmoothing.test.js
    ├── progressiveOverload.test.js
    ├── prDetection.test.js
    ├── muscleBalance.test.js
    ├── tdee.test.js
    └── workoutGenerator.test.js
```

## A.3 — Extraction Order (Dependency-Safe Sequence)

Do this in order. Each step should leave the app fully functional before starting the next. Commit after each step.

### Phase 1: Zero-dependency extractions (pure data, no imports needed)

These files import nothing from the rest of the app. Extract them first.

```
Step 1:  design/tokens.js          ← T object, css template string
Step 2:  data/levels.js            ← LEVELS, XP_REWARDS, BODY_XP
Step 3:  data/defaults.js          ← All DEFAULT_* objects
Step 4:  data/dailyRehab.js        ← DAILY_REHAB array
Step 5:  data/cardioOptions.js     ← CARDIO_OPTIONS array
Step 6:  data/volumeLandmarks.js   ← VOLUME_LANDMARKS + getAdjustedLandmarks()
Step 7:  data/splitTemplates.js    ← SPLIT_TEMPLATES + selectSplit() + getSplitDay()
Step 8:  lib/dateUtils.js          ← today(), dayKey(), subtractDays()
```

### Phase 2: Storage layer (depended on by everything above)

```
Step 9:  lib/storage.js            ← LS object, _lsAvailable, _memoryStore
```

Note: `LS` is imported by almost every `lib/` module and many components. Extract it early, then update imports in subsequent steps.

### Phase 3: Pure algorithmic modules (depend only on dateUtils + storage)

```
Step 10: lib/weightSmoothing.js    ← All smoothing functions + interpolateMissing
Step 11: lib/bodyFatCalibration.js  ← recalcCalibration + getCalibratedBodyFat
Step 12: lib/tdee.js               ← linearRegressionSlope + updateExpenditure + computeCalorieTarget
Step 13: lib/streaks.js            ← updateStreaks + checkCombinedStreak
```

### Phase 4: Exercise database and workout engine (depend on data + lib)

```
Step 14: data/exercises.js         ← EXERCISES array (this is ~3000 lines alone!)
                                     Also export EXERCISE_MAP built from EXERCISES
Step 15: data/videoUrls.js         ← VIDEO_URLS + SEARCH_FALLBACKS + getVideoUrl()
Step 16: lib/workoutNormalize.js   ← normalizeWorkout + getWorkoutExercises
Step 17: lib/progressiveOverload.js ← estimate1RM + isWorkingVolume +
                                      prescribeNextSession + getExerciseHistory +
                                      detectStall
Step 18: lib/prDetection.js        ← getPRData + savePRData + detectPRs
Step 19: lib/muscleBalance.js      ← MUSCLE_PAIRS + computeWeightedMuscleVolume +
                                      analyzeMuscleBalance + sumWeighted +
                                      findRecommendation
Step 20: lib/workoutGenerator.js   ← generateWorkout (the main generation function)
```

### Phase 5: Reusable UI components (depend on design tokens + some lib modules)

```
Step 21: components/GlassCard.jsx
Step 22: components/Toast.jsx
Step 23: components/RestTimerBar.jsx
Step 24: components/MuscleMap.jsx
Step 25: components/SwapPanel.jsx
Step 26: components/ExerciseCard.jsx    ← Largest component. Depends on SwapPanel,
                                          videoUrls, progressiveOverload, prDetection
Step 27: components/VolumeTracker.jsx
Step 28: components/StrengthChart.jsx
Step 29: components/WeightTrendChart.jsx
Step 30: components/NutritionChart.jsx
Step 31: components/TDEETrendChart.jsx
Step 32: components/WaistChart.jsx
Step 33: components/BodyFatChart.jsx
```

### Phase 6: Tab components (depend on everything above)

```
Step 34: tabs/RehabTab.jsx         ← Simplest tab, extract first
Step 35: tabs/CardioTab.jsx        ← Simple, few dependencies
Step 36: tabs/ProgressTab.jsx      ← Depends on chart components + volume tracker
Step 37: tabs/CoachTab.jsx         ← Depends on coach config + API calls
Step 38: tabs/SettingsTab.jsx      ← Large, many settings sections
Step 39: tabs/TodayTab.jsx         ← Most complex tab, extract last
```

### Phase 7: Root App.jsx cleanup

```
Step 40: Slim App.jsx to ~200 lines:
         - useState declarations
         - useEffect persistence hooks
         - Handler functions (generateWorkout, updateExercise, etc.)
         - Tab routing
         - Bottom nav
         - Toast overlay
```

## A.4 — Extraction Rules (Follow These Every Step)

1. **Copy, don't cut.** Duplicate the code into the new file first. Add proper imports/exports. Verify the app still builds (`npm run build`). Only THEN delete the original code from App.jsx.

2. **Named exports, not default exports** for everything except React components (which use default export). This makes imports explicit and refactoring easier:
   ```js
   // lib/weightSmoothing.js
   export function smoothMacroFactor(logs, alpha = 0.05) { ... }
   export function smoothHappyScale(logs, alpha = 0.05) { ... }
   export function getSmoothedWeights(logs, config) { ... }
   
   // In consuming file:
   import { smoothMacroFactor, getSmoothedWeights } from '../lib/weightSmoothing';
   ```

3. **Barrel files are optional but useful for data/.** A `data/index.js` that re-exports everything keeps imports clean:
   ```js
   // data/index.js
   export { EXERCISES, EXERCISE_MAP } from './exercises';
   export { VIDEO_URLS, getVideoUrl } from './videoUrls';
   export { SPLIT_TEMPLATES, selectSplit, getSplitDay } from './splitTemplates';
   // etc.
   ```

4. **Verify after every step.** Run `npm run dev` and test the affected feature. The refactor should be invisible to the user at every commit.

5. **Git discipline.** One commit per extraction step. Commit message format: `refactor: extract [module] to src/[path]`. This makes it easy to bisect if something breaks.

6. **Do not change any logic during extraction.** No "while I'm here" improvements. Extract first, improve later. Mixing refactoring with behavior changes is how bugs hide.

## A.5 — Import Alias (Optional but Recommended)

Add a Vite path alias to avoid deep relative imports like `../../../lib/storage`:

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: { host: true, port: 5173 },
});
```

Then imports become:
```js
import { LS } from '@/lib/storage';
import { T } from '@/design/tokens';
import { EXERCISES } from '@/data/exercises';
```

## A.6 — Post-Extraction Validation Checklist

After all 40 steps are complete, verify:

- [ ] `npm run build` succeeds with zero errors
- [ ] `npm run dev` launches and all 6 tabs render correctly
- [ ] Generate a workout, log sets, complete exercises — full workflow
- [ ] Rehab checklist toggles persist
- [ ] Cardio logging works
- [ ] Progress tab charts render with existing data
- [ ] Coach tab sends/receives messages (if API key configured)
- [ ] Settings: all sections load, changes persist on reload
- [ ] Export/Import data works
- [ ] App.jsx is under 300 lines
- [ ] No file in `src/` exceeds ~1,500 lines (except `data/exercises.js`, which is inherently large)
- [ ] `exercises.js` is the only data file over 500 lines

---

# Part B — API Integration (NOT STARTED)

## B.1 — API Configuration Layer

Create `src/api/apiConfig.js` as the single source of truth for all API configuration:

```js
// src/api/apiConfig.js

// API keys — in production, these come from environment variables.
// For development, they can be set in a .env file (Vite auto-loads VITE_ prefixed vars).
// IMPORTANT: Never commit real API keys. Use .env.local (gitignored).

export const API_KEYS = {
  exerciseDB: import.meta.env.VITE_EXERCISEDB_API_KEY || '',
  youtubeDataV3: import.meta.env.VITE_YOUTUBE_API_KEY || '',
};

export const API_URLS = {
  exerciseDB: 'https://exercisedb-api.vercel.app/api/v1',
  youtubeDataV3: 'https://www.googleapis.com/youtube/v3',
};

// Simple rate limiter: tracks timestamps per API, rejects if over limit
const callLog = {};

export function rateLimitOk(apiName, maxPerMinute = 10) {
  const now = Date.now();
  if (!callLog[apiName]) callLog[apiName] = [];
  // Purge calls older than 60s
  callLog[apiName] = callLog[apiName].filter(t => now - t < 60000);
  if (callLog[apiName].length >= maxPerMinute) return false;
  callLog[apiName].push(now);
  return true;
}

// Generic fetch wrapper with timeout, error normalization, and retry
export async function apiFetch(url, options = {}) {
  const { timeout = 8000, retries = 1, ...fetchOpts } = options;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...fetchOpts,
        signal: controller.signal,
      });
      clearTimeout(timer);
      
      if (!response.ok) {
        throw new Error(`API ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      if (attempt === retries) {
        console.error(`API call failed after ${retries + 1} attempts:`, err.message);
        return { error: true, message: err.message, data: null };
      }
      // Wait 1s before retry
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}
```

Add to `.env.local` (gitignored):
```
VITE_EXERCISEDB_API_KEY=your_key_here
VITE_YOUTUBE_API_KEY=your_key_here
```

Add to `.env.example` (committed, no real keys):
```
VITE_EXERCISEDB_API_KEY=
VITE_YOUTUBE_API_KEY=
```

Add to `.gitignore`:
```
.env.local
.env.*.local
```

## B.2 — ExerciseDB Integration (Exercise Expansion Layer)

### B.2.1 — The Integration Module

```js
// src/api/exerciseDB.js

import { API_URLS, apiFetch, rateLimitOk } from './apiConfig';

// Cache fetched exercises in memory to avoid redundant calls within a session
const exerciseCache = new Map();

/**
 * Search ExerciseDB for exercises matching a query.
 * Returns results normalized to match the shape our app expects.
 * 
 * @param {Object} params
 * @param {string} params.bodyPart - e.g. 'chest', 'back', 'shoulders'
 * @param {string} params.equipment - e.g. 'dumbbell', 'barbell', 'cable'
 * @param {string} [params.target] - specific muscle target
 * @param {number} [params.limit=10] - max results
 * @returns {Promise<Array>} Normalized exercise objects
 */
export async function searchExerciseDB({ bodyPart, equipment, target, limit = 10 }) {
  if (!rateLimitOk('exerciseDB', 15)) {
    return { error: true, message: 'Rate limit reached. Try again in a moment.', data: [] };
  }

  // Build the most specific query possible
  let endpoint;
  if (target) {
    endpoint = `${API_URLS.exerciseDB}/exercises/target/${encodeURIComponent(target)}`;
  } else if (bodyPart) {
    endpoint = `${API_URLS.exerciseDB}/exercises/bodyPart/${encodeURIComponent(bodyPart)}`;
  } else if (equipment) {
    endpoint = `${API_URLS.exerciseDB}/exercises/equipment/${encodeURIComponent(equipment)}`;
  } else {
    endpoint = `${API_URLS.exerciseDB}/exercises`;
  }

  // Check cache
  const cacheKey = endpoint;
  if (exerciseCache.has(cacheKey)) {
    return { error: false, data: exerciseCache.get(cacheKey).slice(0, limit) };
  }

  const result = await apiFetch(endpoint);
  if (result.error) return { error: true, message: result.message, data: [] };

  // ExerciseDB returns an array of exercise objects. 
  // The exact shape depends on their API version; normalize defensively.
  const exercises = (result.data?.exercises || result || []);
  const normalized = exercises.map(normalizeExerciseDBEntry).filter(Boolean);

  exerciseCache.set(cacheKey, normalized);
  return { error: false, data: normalized.slice(0, limit) };
}

/**
 * Map an ExerciseDB exercise into the shape our app's SwapPanel expects.
 * These are intentionally LESS detailed than our curated exercises.
 * The `source: 'exercisedb'` flag lets the UI distinguish them.
 */
function normalizeExerciseDBEntry(raw) {
  if (!raw || !raw.name) return null;

  // Map ExerciseDB body parts to our category system
  const categoryMap = {
    chest: 'chest', back: 'back', shoulders: 'shoulders',
    'upper arms': 'biceps', 'lower arms': 'forearms',
    'upper legs': 'quads', 'lower legs': 'calves',
    waist: 'core', cardio: 'cardio', neck: 'neck',
  };

  // Map ExerciseDB equipment names to our equipment system
  const equipmentMap = {
    dumbbell: 'dumbbells', barbell: 'barbell',
    'cable': 'cable_machine', 'body weight': 'bodyweight',
    'leverage machine': 'machine', band: 'resistance_bands',
    'smith machine': 'smith_machine', kettlebell: 'kettlebell',
  };

  return {
    id: `EDB-${raw.id || raw.exerciseId || Math.random().toString(36).slice(2, 8)}`,
    name: raw.name,
    category: categoryMap[raw.bodyPart?.toLowerCase()] || raw.bodyPart || 'other',
    equipment: [equipmentMap[raw.equipment?.toLowerCase()] || raw.equipment || 'bodyweight'],
    source: 'exercisedb',                // KEY FLAG — distinguishes from curated
    imageUrl: raw.gifUrl || raw.imageUrl || null,
    target: raw.target || null,
    secondaryMuscles: raw.secondaryMuscles || [],
    instructions: raw.instructions || [],
    // Minimal defaults so the exercise can be logged
    sets: 3,
    reps: '8-12',
    rest: 90,
    tier: 3,
    phase: {
      acute: { s: 'caution', p: 1, n: 'Community exercise — not individually reviewed for rehab safety. Use caution.' },
      subacute: { s: 'suitable', p: 2, n: 'Community exercise — verify form independently.' },
      maintenance: { s: 'suitable', p: 3, n: 'Community exercise.' },
    },
    // These fields are empty because ExerciseDB doesn't provide them —
    // this is the value gap between curated and community exercises.
    cues: [],
    mistakes: [],
    why: '',
    muscles: { primary: {}, secondary: {} },
    movementPattern: 'unknown',
    primaryMuscleGroup: categoryMap[raw.bodyPart?.toLowerCase()] || 'other',
    sfrRating: 2,
  };
}

/**
 * Get the list of available body parts from ExerciseDB.
 * Useful for building filter UI.
 */
export async function getBodyPartList() {
  if (!rateLimitOk('exerciseDB', 15)) return [];
  const cacheKey = 'bodyPartList';
  if (exerciseCache.has(cacheKey)) return exerciseCache.get(cacheKey);
  
  const result = await apiFetch(`${API_URLS.exerciseDB}/exercises/bodyPartList`);
  if (result.error || !Array.isArray(result)) return [];
  exerciseCache.set(cacheKey, result);
  return result;
}

/**
 * Get available equipment list from ExerciseDB.
 */
export async function getEquipmentList() {
  if (!rateLimitOk('exerciseDB', 15)) return [];
  const cacheKey = 'equipmentList';
  if (exerciseCache.has(cacheKey)) return exerciseCache.get(cacheKey);
  
  const result = await apiFetch(`${API_URLS.exerciseDB}/exercises/equipmentList`);
  if (result.error || !Array.isArray(result)) return [];
  exerciseCache.set(cacheKey, result);
  return result;
}
```

### B.2.2 — UI Integration: Swap Panel Enhancement

This describes how to modify the existing SwapPanel (inside `ExerciseCard`) to include an "Explore more exercises" section at the bottom of the alternatives list. The key UX principle: **curated exercises always appear first, community exercises are opt-in and clearly labeled.**

**Where it goes:** In the existing swap panel JSX (currently around line ~2234 in the monolith), after the "Other options" section and before the "Remove from today's workout" button.

**What it looks like:**

```
┌─────────────────────────────────────┐
│ Replace "Flat DB Press"             │
│                                     │
│ ★ Floor Press (Suggested)       →   │  ← Curated (existing)
│                                     │
│ Other options:                      │
│   Pec Deck Machine                  │  ← Curated (existing)
│   Cable Crossover                   │
│                                     │
│ ─── Explore more exercises ───      │  ← NEW expandable section
│                                     │
│ [When expanded:]                    │
│  ⓘ Community exercises are not      │
│    individually reviewed for rehab  │
│    safety. Use with caution.        │
│                                     │
│  🌐 Incline Dumbbell Fly       →   │  ← ExerciseDB results
│  🌐 Decline Press Machine      →   │
│  🌐 Svend Press                →   │
│                                     │
│ ✕ Remove from today's workout      │
└─────────────────────────────────────┘
```

**Implementation approach:**

```jsx
// Inside SwapPanel component, add state:
const [showCommunity, setShowCommunity] = useState(false);
const [communityExercises, setCommunityExercises] = useState([]);
const [communityLoading, setCommunityLoading] = useState(false);
const [communityError, setCommunityError] = useState(null);

// Fetch handler (called when user expands):
const loadCommunityExercises = async () => {
  if (communityExercises.length > 0) return; // Already loaded
  setCommunityLoading(true);
  setCommunityError(null);
  
  const result = await searchExerciseDB({
    bodyPart: exercise.category,  // Use current exercise's category
    limit: 8,
  });
  
  if (result.error) {
    setCommunityError(result.message);
  } else {
    // Filter out exercises that match names we already have curated
    const curatedNames = new Set(EXERCISES.map(e => e.name.toLowerCase()));
    const filtered = result.data.filter(e => !curatedNames.has(e.name.toLowerCase()));
    setCommunityExercises(filtered.slice(0, 6));
  }
  setCommunityLoading(false);
};

const handleExpandCommunity = () => {
  setShowCommunity(!showCommunity);
  if (!showCommunity) loadCommunityExercises();
};
```

**Critical safeguards for community exercises:**

1. Always show the caution banner when community exercises are visible (especially in acute phase)
2. If `profile.phase === 'acute'`, add an extra warning: "You are in acute rehab phase. Community exercises have not been screened for your conditions."
3. Community exercises should never appear in auto-generated workouts — only as manual swaps
4. When a community exercise is swapped in, persist its `source: 'exercisedb'` flag so the ExerciseCard can show a "Community" badge
5. Community exercises get no progressive overload prescriptions (they lack the data to drive it safely)

## B.3 — YouTube Data API v3 Integration

### B.3.1 — The Integration Module

The YouTube API serves two purposes:
1. **Link validation**: Verify that hardcoded VIDEO_URLS still point to live, public videos
2. **Dynamic search**: Find form tutorial videos for ExerciseDB community exercises that have no curated video link

```js
// src/api/youtube.js

import { API_KEYS, API_URLS, apiFetch, rateLimitOk } from './apiConfig';

/**
 * Validate a YouTube video ID — check if it's still public and available.
 * Returns { valid, title, thumbnail } or { valid: false }.
 * 
 * Use this to periodically audit VIDEO_URLS entries.
 * NOT called on every render — run as a background check or admin tool.
 */
export async function validateVideoId(videoId) {
  if (!API_KEYS.youtubeDataV3) return { valid: null, reason: 'No API key configured' };
  if (!rateLimitOk('youtube', 20)) return { valid: null, reason: 'Rate limited' };

  const url = `${API_URLS.youtubeDataV3}/videos?` + new URLSearchParams({
    part: 'snippet,status',
    id: videoId,
    key: API_KEYS.youtubeDataV3,
  });

  const result = await apiFetch(url);
  if (result.error) return { valid: null, reason: result.message };

  const items = result.items || [];
  if (items.length === 0) return { valid: false, reason: 'Video not found or private' };

  const video = items[0];
  const isPublic = video.status?.privacyStatus === 'public';
  const isEmbeddable = video.status?.embeddable !== false;

  return {
    valid: isPublic,
    embeddable: isEmbeddable,
    title: video.snippet?.title || '',
    channelTitle: video.snippet?.channelTitle || '',
    thumbnail: video.snippet?.thumbnails?.medium?.url || '',
    reason: isPublic ? 'OK' : `Status: ${video.status?.privacyStatus}`,
  };
}

/**
 * Extract a YouTube video ID from a full URL.
 */
export function extractVideoId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Search YouTube for exercise form tutorials.
 * Used for community (ExerciseDB) exercises that lack curated video links.
 * 
 * @param {string} exerciseName - e.g. "Incline Dumbbell Fly"
 * @param {number} maxResults - max results to return (default 3)
 * @returns {Promise<Array<{videoId, title, thumbnail, channelTitle}>>}
 */
export async function searchExerciseVideo(exerciseName, maxResults = 3) {
  if (!API_KEYS.youtubeDataV3) {
    // Fallback: return a YouTube search URL (no API key needed)
    return {
      fallback: true,
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + ' form tutorial')}`,
      results: [],
    };
  }
  if (!rateLimitOk('youtube', 20)) {
    return {
      fallback: true,
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + ' form tutorial')}`,
      results: [],
    };
  }

  const url = `${API_URLS.youtubeDataV3}/search?` + new URLSearchParams({
    part: 'snippet',
    q: `${exerciseName} exercise form tutorial how to`,
    type: 'video',
    maxResults: maxResults.toString(),
    order: 'relevance',
    videoDuration: 'medium',      // Filter out very short/long videos
    safeSearch: 'strict',
    key: API_KEYS.youtubeDataV3,
  });

  const result = await apiFetch(url);
  if (result.error) {
    return {
      fallback: true,
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + ' form tutorial')}`,
      results: [],
    };
  }

  const items = result.items || [];
  return {
    fallback: false,
    results: items.map(item => ({
      videoId: item.id?.videoId,
      title: item.snippet?.title || '',
      thumbnail: item.snippet?.thumbnails?.medium?.url || '',
      channelTitle: item.snippet?.channelTitle || '',
      url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
    })),
  };
}

/**
 * Batch validate all curated video links.
 * Returns a report of broken/private links.
 * Run this as a maintenance tool, not on every app load.
 * 
 * YouTube Data API quota: 10,000 units/day. 
 * videos.list costs 1 unit per call, and you can batch up to 50 IDs per call.
 */
export async function auditVideoLinks(videoUrlMap) {
  if (!API_KEYS.youtubeDataV3) return { error: 'No API key', results: [] };

  const entries = Object.entries(videoUrlMap);
  const allIds = entries.map(([exId, url]) => ({
    exerciseId: exId,
    videoId: extractVideoId(url),
  })).filter(e => e.videoId);

  const results = [];
  // Batch in groups of 50 (YouTube API max)
  for (let i = 0; i < allIds.length; i += 50) {
    const batch = allIds.slice(i, i + 50);
    const ids = batch.map(b => b.videoId).join(',');

    const url = `${API_URLS.youtubeDataV3}/videos?` + new URLSearchParams({
      part: 'status,snippet',
      id: ids,
      key: API_KEYS.youtubeDataV3,
    });

    const result = await apiFetch(url);
    if (result.error) continue;

    const foundIds = new Set((result.items || []).map(v => v.id));
    const statusMap = {};
    for (const item of (result.items || [])) {
      statusMap[item.id] = {
        title: item.snippet?.title,
        status: item.status?.privacyStatus,
      };
    }

    for (const entry of batch) {
      const found = foundIds.has(entry.videoId);
      results.push({
        exerciseId: entry.exerciseId,
        videoId: entry.videoId,
        valid: found && statusMap[entry.videoId]?.status === 'public',
        title: statusMap[entry.videoId]?.title || null,
        status: found ? statusMap[entry.videoId]?.status : 'not_found',
      });
    }
  }

  return {
    total: results.length,
    valid: results.filter(r => r.valid).length,
    broken: results.filter(r => !r.valid),
    results,
  };
}
```

### B.3.2 — UI Integration: Enhanced Video Button

For **curated exercises** (your 102): The existing Play button behavior stays the same — direct link to the curated YouTube URL. Optionally, run `auditVideoLinks` periodically (e.g., a "Check video links" button in Settings > Data) and flag broken links.

For **community exercises** (from ExerciseDB): When the user taps the Play button on a community exercise:

1. If YouTube API key is configured: call `searchExerciseVideo(exerciseName)` and show a small dropdown with 2-3 video results (title + channel name + thumbnail).
2. If no API key: open the fallback YouTube search URL directly.

This way, community exercises still get video guidance, but it's clearly search-based rather than hand-picked.

### B.3.3 — API Key Management in Settings

Add a section to SettingsTab (under a new "API & Integrations" group) that lets users:

- Toggle "Enable community exercises" (controls whether ExerciseDB section appears in swap panel)
- Optionally enter their own YouTube API key (stored in localStorage, never sent to any server except YouTube)
- See API usage status (calls remaining, cache hits)
- Run the video link audit (shows results inline)

This respects the freemium model: the app works fully without any API keys (all 102 curated exercises have hardcoded links). API features are bonus capabilities.

## B.4 — Environment Setup Summary

### Required .env.local variables:
```bash
# ExerciseDB — get a key from https://rapidapi.com/exercisedb or use the open API
VITE_EXERCISEDB_API_KEY=

# YouTube Data API v3 — get from https://console.cloud.google.com
# Enable "YouTube Data API v3" in your GCP project
VITE_YOUTUBE_API_KEY=
```

### Rate Limits to Respect:
| API | Free Tier Limit | Our Self-Imposed Limit |
|-----|----------------|----------------------|
| ExerciseDB (open) | Varies by host | 15 calls/min |
| YouTube Data v3 | 10,000 quota units/day | 20 calls/min, batch when possible |

### Dependencies to Add:
```bash
# No new npm dependencies needed!
# Both APIs use plain fetch() which is built into browsers.
# The apiFetch wrapper handles everything.
```

---

# Part C — Documentation, Testability & Roadmap (NOT STARTED)

## C.1 — README Overhaul

Replace the current README with a comprehensive version. Structure:

```markdown
# NeuroFit

A comprehensive fitness tracking PWA with intelligent exercise selection, 
rehab-aware programming, body composition analytics, and AI coaching.

## Features

### Exercise Programming Engine
- 102 curated exercises with detailed rehab phase notes, form cues, 
  common mistakes, and evidence-based rationale
- Phase-aware exercise selection (acute → subacute → maintenance)
- Location-aware filtering (gym / home / work)
- Training split auto-selection based on days/week and experience level 
  (full body, upper/lower, PPL)
- Exercise swap system with primary suggestions and alternatives, 
  respecting phase safety ratings

### Progressive Overload System
- Automatic weight/rep prescription based on training history
- Stall detection (3+ sessions at same weight/reps)
- Fatigue detection (RPE trending upward at constant load)
- Exercise progression/regression recommendations with specific 
  milestone criteria
- e1RM tracking via Brzycki formula

### PR Detection
- 4 PR categories: weight, volume, estimated 1RM, and rep PR 
  (at specific weight tiers)
- Real-time PR badges during workout logging

### Body Composition Tracking
- 3 weight smoothing algorithms: MacroFactor-style EWMA, 
  HappyScale bidirectional, Libra time-adaptive
- Body fat calibration with 4 methods: simple offset, linear regression, 
  rolling weighted (EWMA), Bayesian (prior + data)
- Adaptive TDEE estimation using weight trend + calorie intake data
- Calorie/protein target computation with goal-based adjustments
- Waist circumference tracking
- Sleep quality and HRV logging

### Volume Tracking
- Per-muscle-group weekly volume with zone classification 
  (Below MV → Maintaining → Optimal → High → Over MRV)
- Volume landmarks adjusted by experience level
- Subgroup pattern breakdown (e.g., core anti-extension vs anti-rotation)
- Muscle balance analysis: agonist/antagonist ratio monitoring

### Rehab & Mobility
- Daily rehab checklist with 5 foundational movements
- Phase-based exercise safety ratings (suitable / caution / avoid)
- Detailed phase transition criteria and clinical reasoning
- YouTube video links for all 102 exercises (verified)

### Cardio
- 4 cardio modality templates with HR zone targets
- Session duration and heart rate logging
- Weekly session target tracking

### AI Coach (optional)
- LLM-powered coaching with full training context
- Configurable API provider and model
- Context includes: current phase, recent workouts, body composition 
  trends, volume analysis, PR history

### Gamification
- XP system with 20 levels
- Streak tracking (workout, nutrition, combined)
- XP rewards for logging, consistency, and milestone achievements

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Inline styles with design token system (dark theme)
- **Storage**: localStorage with memory fallback
- **PWA**: Manifest + standalone display for Android home screen install
- **APIs**: ExerciseDB (exercise expansion), YouTube Data v3 (video links)
- **Deployment**: Vercel (auto-deploy from GitHub)

## Quick Start

[existing quick start content]

## Architecture

See ARCHITECTURE.md for detailed module documentation.

## API Setup (Optional)

The app is fully functional without API keys. For enhanced features:

1. Copy `.env.example` to `.env.local`
2. Add API keys (see .env.example for instructions)
3. Enable features in Settings > API & Integrations

## License

BSD-3-Clause — see LICENSE
```

## C.2 — ARCHITECTURE.md

Create a dedicated architecture document:

```markdown
# Architecture

## Module Map

### Data Layer (`src/data/`)
Static, curated data. These are the "knowledge base" of the app.

| Module | Contents | Size | Notes |
|--------|----------|------|-------|
| exercises.js | 102 exercise definitions | ~3,000 lines | Each exercise has: muscles (primary + secondary with activation %), equipment, location availability, rehab phase ratings with clinical notes, form cues, common mistakes with fixes, evidence rationale, progression/regression paths, SFR rating, rep ranges by goal |
| videoUrls.js | YouTube URL map | ~130 lines | 102 verified links. Audit with YouTube API. |
| volumeLandmarks.js | MV/MEV/MAV/MRV per muscle | ~50 lines | Based on Dr. Mike Israetel's volume landmarks |
| splitTemplates.js | Training split definitions | ~60 lines | Full body, upper/lower, PPL with muscle group assignments |
| defaults.js | All DEFAULT_* config objects | ~100 lines | Settings, nutrition, calibration, body log, streaks, coach |
| levels.js | XP/level table | ~30 lines | 20 levels with names and XP thresholds |

### Algorithm Layer (`src/lib/`)
Pure functions with no UI dependencies. Fully unit-testable.

| Module | Key Functions | Depends On |
|--------|--------------|------------|
| weightSmoothing.js | `smoothMacroFactor()`, `smoothHappyScale()`, `smoothLibra()`, `getSmoothedWeights()` | dateUtils |
| bodyFatCalibration.js | `recalcCalibration()`, `getCalibratedBodyFat()` | (none) |
| tdee.js | `updateExpenditure()`, `computeCalorieTarget()`, `linearRegressionSlope()` | dateUtils, storage |
| progressiveOverload.js | `prescribeNextSession()`, `estimate1RM()`, `detectStall()` | storage, exercises |
| prDetection.js | `detectPRs()`, `getPRData()`, `savePRData()` | storage |
| muscleBalance.js | `analyzeMuscleBalance()`, `computeWeightedMuscleVolume()` | exercises, storage |
| workoutGenerator.js | `generateWorkout()` | exercises, splitTemplates, volumeLandmarks, progressiveOverload |
| storage.js | `LS.get()`, `LS.set()`, `LS.keys()` | (none — leaf dependency) |

### API Layer (`src/api/`)
External service integrations. All calls go through `apiFetch()` 
with timeout, retry, and rate limiting.

| Module | External Service | Free Tier |
|--------|-----------------|-----------|
| exerciseDB.js | ExerciseDB API | Open / varies |
| youtube.js | YouTube Data API v3 | 10,000 units/day |

### Algorithms In Detail

#### Weight Smoothing (weightSmoothing.js)

Three implementations of exponential moving average for daily weigh-ins:

1. **MacroFactor (default)**: Forward-only EWMA with α=0.05 (~20-day window). 
   Gap-filling via linear interpolation. Stable, minimal overshoot.

2. **HappyScale**: Bidirectional EWMA. Forward pass (α=0.05) + backward 
   pass, blended 60/40. Reduces end-of-series lag. Better for recent 
   trend visibility.

3. **Libra**: Time-adaptive. Alpha varies by time gap between weigh-ins 
   using exponential decay formula: α = 1 - e^(-Δt / (smoothingDays × 86400000)). 
   Handles irregular weigh-in schedules gracefully.

All three use `interpolateMissing()` to fill date gaps before processing.

#### Adaptive TDEE (tdee.js)

MacroFactor-style energy expenditure estimation:
- Requires 7+ days of weight + calorie data
- Uses linear regression on smoothed weight trend to compute 
  weekly rate of change
- Converts weight change rate to caloric surplus/deficit 
  (3,500 kcal/lb approximation)
- EWMA on computed TDEE values for stability
- Confidence levels: low (<14 days), medium (14-30), high (30+)

#### Progressive Overload (progressiveOverload.js)

Decision tree for next-session prescription:
1. Retrieve last 3-5 sessions for this exercise
2. If no history → prescribe starting weight based on training goal
3. If all sets hit top of rep range at current weight → increase weight
4. If RPE trending up at same load for 3+ sessions → flag fatigue
5. If weight + reps unchanged for 3+ sessions → flag stall
6. If stalled AND regression exercises exist → suggest regression
7. If exceeded progression criteria → suggest exercise progression

Weight increments respect upper/lower body settings (default 5/10 lbs).
```

## C.3 — Testability

After the refactor, every `src/lib/` module is independently testable. Install Vitest (works natively with Vite):

```bash
npm install -D vitest
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### Example test files:

```js
// src/__tests__/weightSmoothing.test.js
import { describe, it, expect } from 'vitest';
import { smoothMacroFactor, smoothHappyScale, smoothLibra, interpolateMissing } from '../lib/weightSmoothing';

describe('interpolateMissing', () => {
  it('returns single entry unchanged', () => {
    const result = interpolateMissing([{ date: '2025-01-01', weight: 180 }]);
    expect(result).toHaveLength(1);
    expect(result[0].weight).toBe(180);
  });

  it('fills a 1-day gap with linear interpolation', () => {
    const logs = [
      { date: '2025-01-01', weight: 180 },
      { date: '2025-01-03', weight: 182 },
    ];
    const result = interpolateMissing(logs);
    expect(result).toHaveLength(3);
    expect(result[1].date).toBe('2025-01-02');
    expect(result[1].weight).toBe(181); // linear interpolation midpoint
  });

  it('handles no gaps', () => {
    const logs = [
      { date: '2025-01-01', weight: 180 },
      { date: '2025-01-02', weight: 181 },
    ];
    const result = interpolateMissing(logs);
    expect(result).toHaveLength(2);
  });
});

describe('smoothMacroFactor', () => {
  it('returns empty array for empty input', () => {
    expect(smoothMacroFactor([])).toEqual([]);
  });

  it('trend converges toward actual weight over time', () => {
    // 10 days at constant 180 lbs
    const logs = Array.from({ length: 10 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      weight: 180,
    }));
    const result = smoothMacroFactor(logs, 0.05);
    // After 10 days at constant weight, trend should be very close
    const lastTrend = result[result.length - 1].trend;
    expect(Math.abs(lastTrend - 180)).toBeLessThan(1);
  });

  it('smooths out daily fluctuations', () => {
    const logs = [
      { date: '2025-01-01', weight: 180 },
      { date: '2025-01-02', weight: 183 }, // +3 spike
      { date: '2025-01-03', weight: 180 },
    ];
    const result = smoothMacroFactor(logs, 0.05);
    // Trend should not spike to 183
    expect(result[1].trend).toBeLessThan(181);
  });
});

describe('smoothHappyScale', () => {
  it('bidirectional smoothing reduces end-lag vs forward-only', () => {
    // Steady decline
    const logs = Array.from({ length: 14 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      weight: 185 - i * 0.3,
    }));
    const forward = smoothMacroFactor(logs, 0.05);
    const bidir = smoothHappyScale(logs, 0.05);
    
    const lastIdx = logs.length - 1;
    const actualLast = logs[lastIdx].weight;
    // Bidirectional should be closer to actual at the end
    const forwardDiff = Math.abs(forward[lastIdx].trend - actualLast);
    const bidirDiff = Math.abs(bidir[lastIdx].trend - actualLast);
    expect(bidirDiff).toBeLessThanOrEqual(forwardDiff);
  });
});
```

```js
// src/__tests__/progressiveOverload.test.js
import { describe, it, expect } from 'vitest';
import { estimate1RM } from '../lib/progressiveOverload';

describe('estimate1RM', () => {
  it('returns 0 for invalid input', () => {
    expect(estimate1RM(0, 0)).toBe(0);
    expect(estimate1RM(null, 5)).toBe(0);
    expect(estimate1RM(100, -1)).toBe(0);
  });

  it('returns weight for 1 rep', () => {
    expect(estimate1RM(225, 1)).toBe(225);
  });

  it('estimates correctly for moderate reps (Brzycki)', () => {
    // 185 lbs × 8 reps → ~227 e1RM (Brzycki)
    const result = estimate1RM(185, 8);
    expect(result).toBeGreaterThan(220);
    expect(result).toBeLessThan(240);
  });

  it('uses Epley approximation for high reps (>12)', () => {
    const result = estimate1RM(100, 20);
    expect(result).toBeGreaterThan(100);
  });
});
```

```js
// src/__tests__/tdee.test.js
import { describe, it, expect } from 'vitest';
import { linearRegressionSlope } from '../lib/tdee';

describe('linearRegressionSlope', () => {
  it('returns 0 for fewer than 2 points', () => {
    expect(linearRegressionSlope([{ x: 1, y: 1 }])).toBe(0);
    expect(linearRegressionSlope([])).toBe(0);
  });

  it('calculates positive slope correctly', () => {
    const points = [
      { x: 0, y: 180 },
      { x: 7, y: 181 },
      { x: 14, y: 182 },
    ];
    const slope = linearRegressionSlope(points);
    expect(slope).toBeCloseTo(0.143, 1); // ~0.14 lbs/day
  });

  it('calculates negative slope for weight loss', () => {
    const points = [
      { x: 0, y: 185 },
      { x: 7, y: 184 },
      { x: 14, y: 183 },
    ];
    const slope = linearRegressionSlope(points);
    expect(slope).toBeLessThan(0);
  });
});
```

### Test coverage targets:

| Module | Priority | Key scenarios to test |
|--------|----------|----------------------|
| weightSmoothing.js | HIGH | Empty input, single entry, gap filling, constant weight convergence, spike damping, algorithm comparison |
| progressiveOverload.js | HIGH | First session (no history), rep range top → weight increase, stall detection, fatigue detection, deload trigger |
| prDetection.js | HIGH | First-ever set (always PR), weight PR, volume PR, e1RM PR, rep PR at weight tier, no false PRs on deload |
| tdee.js | MEDIUM | Insufficient data handling, stable weight → TDEE matches intake, deficit detection, surplus detection |
| muscleBalance.js | MEDIUM | Balanced pair, imbalanced pair, missing muscle data, undertrained singleton |
| workoutGenerator.js | MEDIUM | Generates correct number of exercises per split day, respects phase restrictions, respects location filter |
| bodyFatCalibration.js | LOW | Single calibration point, 2+ point regression, Bayesian update, method switching |

## C.4 — Roadmap

### Phase 1: Foundation (Current Sprint)
**Goal:** Solid architecture that supports everything below.

- [x] 102-exercise curated database with rehab phases
- [x] Progressive overload engine
- [x] PR detection (4 types)
- [x] Body composition tracking (3 smoothing methods)
- [x] Adaptive TDEE
- [x] Body fat calibration (4 methods)
- [x] AI Coach chat interface
- [x] PWA with Android home screen install
- [ ] **Refactor: Break up 9k-line monolith** (Part A of this guide)
- [ ] **Integrate ExerciseDB for exercise expansion** (Part B.2)
- [ ] **Integrate YouTube Data API v3** (Part B.3)
- [ ] **Add unit tests for all `lib/` modules** (Part C.3)
- [ ] **Create ARCHITECTURE.md** (Part C.2)
- [ ] **Overhaul README** (Part C.1)

### Phase 2: Nutrition Intelligence
**Goal:** Make nutrition logging fast and useful, powered by real food databases.

- [ ] **USDA FoodData Central API integration**
  - Food search by name with autocomplete
  - Macro/micronutrient retrieval per food item
  - Portion size selection with unit conversion
  - "Recent foods" cache for fast re-logging
  - The Branded Food Products Database updates monthly (satisfies capstone API frequency requirement)

- [ ] **Nutritionix API integration** (premium tier feature)
  - Natural language food logging ("2 eggs and a piece of toast")
  - Barcode scanning for packaged foods
  - Restaurant menu item lookup with geolocation
  - Meal photo estimation (if their API supports it)

- [ ] **Meal planning features**
  - Daily meal log view with running macro totals
  - Macro target visualization (protein/carbs/fat bars)
  - "Quick add" for common meals
  - Calorie remaining countdown

### Phase 3: Environment-Aware Training
**Goal:** Use real-world conditions to make smarter training recommendations.

- [ ] **OpenWeatherMap API integration**
  - Fetch current conditions + hourly forecast for user's location
  - Feed weather data into workout generation algorithm:
    - Hot/humid → reduce outdoor cardio intensity, add hydration reminders
    - Cold/rain → bias toward indoor modalities
    - Nice weather → suggest outdoor cardio options, walking
    - Air quality (if available) → respiratory condition warnings
  - Weather badge on Today tab header showing current conditions
  - "Best time to train outside" suggestion based on hourly forecast

- [ ] **Location-aware features**
  - Auto-detect gym vs. home vs. outdoor context
  - GPS-based cardio tracking for outdoor sessions (distance, pace, route)
  - Integration point for future Strava/Google Fit data

### Phase 4: Wearable & Health Platform Integration
**Goal:** Import real biometric data instead of manual entry.

- [ ] **Strava API integration**
  - OAuth2 flow for user authentication
  - Auto-import completed cardio activities (run, bike, swim, walk)
  - Pull actual heart rate data into cardio logs
  - Map GPS routes in a simple embedded view
  - Sync weekly cardio volume with app's cardio target tracking
  - Webhook support for real-time activity sync

- [ ] **Google Fit / Apple Health integration**
  - Read daily step counts → passive activity estimation for TDEE
  - Import heart rate data from wearables
  - Read sleep data (duration + quality) → feed into recovery recommendations
  - Sync body weight from smart scales
  - Write workout data back to health platforms
  - Note: Apple HealthKit requires native iOS app (React Native migration)
  - Note: Google Fit REST API works from web but is being deprecated in favor of Health Connect

- [ ] **Recovery estimation engine**
  - Combine: HRV data (from wearable), sleep quality, RPE trends, volume load, muscle group recovery windows
  - Output: daily readiness score (1-10)
  - Use readiness to modulate workout intensity prescription
  - "Recovery day" auto-suggestion when readiness is low

### Phase 5: AI Coaching Enhancement
**Goal:** Transform the coach from a chatbot into a contextual training partner.

- [ ] **Richer context injection for LLM calls**
  - Current context sent to coach: phase, recent workouts, basic stats
  - Enhanced context to add:
    - Full volume analysis (per muscle group, with zone classification)
    - PR history and recent milestones
    - Body composition trend (smoothed weight, TDEE trend, rate of change)
    - Stall/fatigue flags with specific exercises
    - Muscle balance analysis results
    - Sleep and recovery data (when available)
    - Nutrition adherence (% of days hitting protein target)
  - Structured context format (JSON) so the LLM can parse efficiently
  - Token budget management (summarize older history, keep recent detailed)

- [ ] **Proactive coaching triggers**
  - Instead of waiting for user to ask, generate insights automatically:
    - "You've been stalled on bench press for 4 sessions — consider dropping to floor press for 2 weeks"
    - "Your rear delts are undertrained relative to front delts (3.2:1 ratio). Adding face pulls would help."
    - "TDEE has dropped 150 kcal over 30 days — possible metabolic adaptation. Consider a diet break."
    - "Great consistency! 14-day combined streak. Volume is in optimal zone for all muscle groups."
  - Show as cards on the Today tab, not just in Coach tab

- [ ] **Weekly/monthly progress reports**
  - Auto-generated LLM summary of training period
  - Include: volume trends, PRs hit, body composition changes, adherence stats
  - Actionable recommendations for next period
  - Exportable as PDF or shareable image

- [ ] **Multi-provider LLM support**
  - Current: single provider configured in settings
  - Add: provider dropdown (Anthropic Claude, OpenAI, local Ollama, Groq)
  - Fallback chain: if primary provider fails, try secondary
  - Token usage tracking and estimated cost display

### Phase 6: State Management Migration
**Goal:** Replace scattered useState + localStorage with a proper state layer.

- [ ] **Evaluate and implement state solution**
  - **Option A: Zustand** (recommended for this app)
    - Minimal boilerplate, works great with React
    - Built-in persist middleware replaces manual LS.set/get in useEffect
    - Slices pattern keeps state organized by domain (workout, nutrition, profile)
    - DevTools support for debugging
    - Migration path: one slice at a time, coexisting with useState during transition
  
  - **Option B: useReducer + Context**
    - No additional dependency
    - Good if you want to demonstrate React fundamentals for capstone
    - More boilerplate than Zustand but more "standard React"
    - Can cause unnecessary re-renders without careful memoization
  
  - **Option C: Jotai**
    - Atomic state model — each piece of state is independent
    - Very fine-grained re-renders
    - Good fit if the app grows to have many independent data streams
    - Slightly steeper learning curve

- [ ] **Database migration** (longer term)
  - localStorage has a ~5-10 MB limit and no query capabilities
  - Options:
    - **IndexedDB** (via Dexie.js): Full client-side database, stays offline-first
    - **Supabase**: PostgreSQL backend, real-time sync, auth, free tier
    - **Firebase Firestore**: If you want Google ecosystem integration
  - Migration strategy: abstract storage behind an interface now (already partially done with LS object), swap implementation later

### Phase 7: Platform Expansion
**Goal:** Move beyond web PWA to native capabilities.

- [ ] **React Native migration assessment**
  - Needed for: Apple HealthKit, push notifications, background sync, App Store distribution
  - Strategy: Keep `src/lib/` and `src/data/` as-is (pure JS, platform-agnostic)
  - Only `src/components/` and `src/tabs/` need rewriting for React Native
  - This is why the refactor (Part A) matters so much — clean separation now saves months later

- [ ] **Offline-first architecture**
  - Service worker for full offline capability
  - Background sync for API calls when connection returns
  - Conflict resolution for multi-device usage

- [ ] **Social features** (if pursuing freemium)
  - Workout sharing (shareable workout card images)
  - Friends/accountability partners
  - Community exercise reviews and ratings
  - Leaderboards (optional, opt-in)

### Phase 8: Monetization Infrastructure
**Goal:** Build the plumbing for freemium without disrupting core experience.

- [ ] **Feature flag system**
  - Simple tier check: `const canAccess = (feature) => userTier >= FEATURE_TIERS[feature]`
  - Tiers: free, plus, pro
  - Free: full exercise database, basic tracking, 3 AI coach messages/day
  - Plus: unlimited AI coaching, ExerciseDB expansion, advanced charts, export
  - Pro: Strava sync, wearable integration, weekly AI reports, priority support

- [ ] **Payment integration**
  - RevenueCat (handles both iOS and Android subscriptions)
  - Stripe (for web-only billing)
  - Receipt validation server (minimal backend needed)

- [ ] **Ad integration** (free tier only)
  - Interstitial between workout completion and summary (not during workout)
  - Banner on Progress tab (not on Today tab — never interrupt training)
  - Remove all ads at Plus tier
  - Note: ads in fitness apps have historically poor UX — consider whether the conversion lift from ad-free Plus justifies the negative experience

### Additional Ideas Worth Exploring

- [ ] **Exercise form analysis via device camera** (TensorFlow.js + PoseNet)
  - Real-time rep counting
  - ROM measurement
  - Asymmetry detection (left vs right)
  - Very ambitious but extremely differentiating

- [ ] **Periodization engine**
  - Mesocycle programming (accumulation → intensification → deload)
  - Auto-deload scheduling based on fatigue accumulation
  - Block periodization templates

- [ ] **Injury prevention scoring**
  - Combine: volume ratios, exercise variety, recovery data, movement pattern balance
  - Output: per-joint injury risk score
  - Suggest corrective exercise additions when risk is elevated

- [ ] **Community exercise curation pipeline**
  - Let users submit form cues and rehab notes for ExerciseDB exercises
  - Review/approval system
  - Gradually "promote" community exercises to curated status
  - This is how the exercise database grows beyond your personal curation

---

## Appendix: Key Technical Decisions and Rationale

| Decision | Chosen | Why | Alternatives Considered |
|----------|--------|-----|------------------------|
| Styling | Inline styles + tokens | Zero build config, works in single-file and post-refactor | Tailwind (adds build complexity), CSS modules (fine but overkill for PWA) |
| Storage | localStorage + LS wrapper | Offline-first, zero backend, instant persistence | IndexedDB (future), Supabase (future) |
| Charts | Hand-rolled SVG | Zero dependencies, full control, small bundle | Recharts (heavy), D3 (overkill for these charts) |
| Weight smoothing | 3 algorithm options | Each has different strengths; user choice demonstrates algorithmic knowledge | Single algorithm (less interesting for capstone) |
| Exercise database | Hardcoded + ExerciseDB expansion | Curated quality for core exercises, API for breadth | API-only (loses rehab specificity), DB-only (no external API for capstone) |
| Body fat calibration | 4 methods including Bayesian | Demonstrates statistical knowledge, handles sparse calibration data well | Single offset (too simple), ML model (overkill) |
| PWA approach | Manifest + web install | Works today, no app store needed, instant deployment | React Native (needed eventually for HealthKit) |
| License | BSD-3-Clause | Open for learning project, name protection clause, clean for capstone | BSL (more protective but less familiar to evaluators), MIT (no name protection) |
```

## C.5 — CHANGELOG.md Template

Start maintaining a changelog from the refactor onward:

```markdown
# Changelog

All notable changes to NeuroFit will be documented in this file.

## [Unreleased]

### Architecture
- Refactored 8,927-line App.jsx into modular file structure
- Extracted 13 library modules, 7 data modules, 13 components, 6 tabs
- Added Vite path aliases (@/ for src/)

### Features
- ExerciseDB integration: community exercise expansion in swap panel
- YouTube Data API v3: video link audit tool, dynamic search for community exercises
- API configuration UI in Settings > API & Integrations

### Testing
- Added Vitest with unit tests for all lib/ modules
- Test coverage for weight smoothing, progressive overload, PR detection, TDEE

### Documentation
- Comprehensive README with feature inventory
- ARCHITECTURE.md with module map and algorithm documentation
- ROADMAP.md with 8-phase development plan
- .env.example for API key setup

## [1.0.0] - 2025-XX-XX
- Initial release: 102 curated exercises, progressive overload, 
  body composition tracking, AI coaching, PWA
```

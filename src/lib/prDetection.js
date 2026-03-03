import { LS } from '@/lib/storage';
import { estimate1RM, getExerciseHistory } from '@/lib/progressiveOverload';

// ============================================================
// PR DETECTION & STORAGE
// ============================================================

export function getPRData(exerciseId) {
  return LS.get(`pr:${exerciseId}`, { weightPR: null, volumePR: null, e1rmPR: null, repPRs: {} });
}

export function savePRData(exerciseId, prData) {
  LS.set(`pr:${exerciseId}`, prData);
}

export function detectPRs(exerciseId, currentSets) {
  // currentSets: array of { weight, reps, done } from the ACTIVE workout
  const completedSets = currentSets.filter(s => s.done && (parseFloat(s.weight) > 0 || parseInt(s.reps) > 0));
  if (completedSets.length === 0) return [];

  // Get ALL previous history (not including current session)
  const history = getExerciseHistory(exerciseId, 50);
  const prs = [];
  const today = new Date().toISOString().slice(0, 10);

  // Compute current session stats
  const currentWeights = completedSets.map(s => parseFloat(s.weight) || 0);
  const currentMaxWeight = Math.max(...currentWeights);
  const currentVolume = completedSets.reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0);
  const currentBestE1RM = Math.max(...completedSets
    .filter(s => parseFloat(s.weight) > 0 && parseInt(s.reps) > 0 && parseInt(s.reps) <= 12)
    .map(s => estimate1RM(parseFloat(s.weight), parseInt(s.reps))), 0);
  const isBodyweight = currentMaxWeight === 0;

  // Compute historical bests
  let historicalMaxWeight = 0;
  let historicalMaxVolume = 0;
  let historicalBestE1RM = 0;
  const historicalRepPRs = {}; // weight -> maxReps

  for (const session of history) {
    let sessionVolume = 0;
    for (const set of session.sets) {
      if (set.weight > historicalMaxWeight) historicalMaxWeight = set.weight;
      sessionVolume += set.weight * set.reps;
      if (set.weight > 0 && set.reps > 0 && set.reps <= 12) {
        const e1rm = estimate1RM(set.weight, set.reps);
        if (e1rm > historicalBestE1RM) historicalBestE1RM = e1rm;
      }
      // Track rep PRs per weight tier
      const wKey = String(set.weight);
      if (!historicalRepPRs[wKey] || set.reps > historicalRepPRs[wKey]) {
        historicalRepPRs[wKey] = set.reps;
      }
    }
    if (sessionVolume > historicalMaxVolume) historicalMaxVolume = sessionVolume;
  }

  // Only detect PRs if there's at least one previous session to compare against
  if (history.length === 0) return [];

  // 1. Weight PR (skip for bodyweight)
  if (!isBodyweight && currentMaxWeight > historicalMaxWeight) {
    prs.push({ type: 'weight', value: currentMaxWeight, previousBest: historicalMaxWeight, improvement: currentMaxWeight - historicalMaxWeight });
  }

  // 2. Volume PR
  if (currentVolume > historicalMaxVolume && currentVolume > 0) {
    prs.push({ type: 'volume', value: currentVolume, previousBest: historicalMaxVolume, improvement: currentVolume - historicalMaxVolume });
  }

  // 3. Estimated 1RM PR (skip for bodyweight)
  if (!isBodyweight && currentBestE1RM > historicalBestE1RM && currentBestE1RM > 0) {
    prs.push({ type: 'e1rm', value: Math.round(currentBestE1RM * 10) / 10, previousBest: Math.round(historicalBestE1RM * 10) / 10, improvement: Math.round((currentBestE1RM - historicalBestE1RM) * 10) / 10 });
  }

  // 4. Rep PRs (per weight tier — for bodyweight exercises: weight=0 tier)
  for (const set of completedSets) {
    const w = parseFloat(set.weight) || 0;
    const r = parseInt(set.reps) || 0;
    const wKey = String(w);
    const prevBest = historicalRepPRs[wKey] || 0;
    if (r > prevBest && r > 0) {
      // Only add one rep PR per weight tier (highest)
      if (!prs.find(p => p.type === 'reps' && p.weightTier === w)) {
        prs.push({ type: 'reps', value: r, previousBest: prevBest, improvement: r - prevBest, weightTier: w });
      }
    }
  }

  // Persist PR data
  if (prs.length > 0) {
    const prData = getPRData(exerciseId);
    for (const pr of prs) {
      if (pr.type === 'weight') prData.weightPR = { value: pr.value, date: today(), reps: completedSets.find(s => parseFloat(s.weight) === pr.value)?.reps };
      if (pr.type === 'volume') prData.volumePR = { value: pr.value, date: today() };
      if (pr.type === 'e1rm') prData.e1rmPR = { value: pr.value, date: today() };
      if (pr.type === 'reps') { if (!prData.repPRs) prData.repPRs = {}; prData.repPRs[String(pr.weightTier)] = { reps: pr.value, date: today() }; }
    }
    savePRData(exerciseId, prData);
  }

  return prs;
}

import { smoothEWMA } from '@/lib/weightSmoothing';

// --- Adaptive TDEE Algorithm (EWMA-based) ---

export function linearRegressionSlope(points) {
 // points: [{x, y}] — returns slope (y/x change per unit x)
 const n = points.length;
 if (n < 2) return 0;
 const sumX = points.reduce((a, p) => a + p.x, 0);
 const sumY = points.reduce((a, p) => a + p.y, 0);
 const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
 const sumX2 = points.reduce((a, p) => a + p.x * p.x, 0);
 const denom = n * sumX2 - sumX * sumX;
 return denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
}

export function updateExpenditure(bodyLogs, nutritionConfig) {
 const cfg = nutritionConfig || {};
 const alpha = cfg.expenditureAlpha || 0.05;
 const prevTDEE = cfg.estimatedTDEE || cfg.initialTDEE || 2500;

 // Need enough data
 const logsWithCals = bodyLogs.filter(l => l.weight && l.calories);
 if (logsWithCals.length < (cfg.minDaysForAdjustment || 7)) {
 return { tdee: prevTDEE, confidence: 'low' };
 }

 // Get smoothed trend weights
 const smoothed = smoothEWMA(logsWithCals);
 const recent = smoothed.slice(-14);
 if (recent.length < 7) return { tdee: prevTDEE, confidence: 'low' };

 // Rate of weight change (lbs/day) via linear regression on trend
 const trendPoints = recent.map((d, i) => ({ x: i, y: d.trend }));
 const weightChangePerDay = linearRegressionSlope(trendPoints);

 // Convert to daily calorie equivalent (3500 kcal/lb, 7700 kcal/kg)
 const isKg = (cfg.weightUnit || 'lbs') === 'kg';
 const calPerUnit = isKg ? 7700 : 3500;
 const dailyStorageChange = weightChangePerDay * calPerUnit;

 // Average intake over the window
 const recentLogs = logsWithCals.slice(-14);
 const avgIntake = recentLogs.reduce((a, l) => a + Number(l.calories), 0) / recentLogs.length;

 // Solve for expenditure
 const rawExpenditure = avgIntake - dailyStorageChange;

 // EWMA smoothing
 const smoothedTDEE = alpha * rawExpenditure + (1 - alpha) * prevTDEE;

 // Clamp: max 2% change per day
 const maxChange = prevTDEE * 0.02;
 const clampedTDEE = Math.round(Math.max(
 prevTDEE - maxChange,
 Math.min(prevTDEE + maxChange, smoothedTDEE)
 ));

 // Confidence based on data volume
 const totalDays = logsWithCals.length;
 const confidence = totalDays >= 30 ? 'high' : totalDays >= 14 ? 'medium' : 'low';

 return { tdee: clampedTDEE, confidence };
}

export function computeCalorieTarget(nutritionConfig, bodyWeightLbs) {
 const cfg = nutritionConfig || {};
 const tdee = cfg.estimatedTDEE || 2500;
 const goal = cfg.goal || 'maintain';
 const rate = cfg.weeklyRatePercent || 0.5;
 const weight = bodyWeightLbs || 185;
 // Weekly deficit/surplus in kcal
 const weeklyChange = (rate / 100) * weight * 3500;
 const dailyAdjustment = weeklyChange / 7;
 if (goal === 'lose') return Math.round(tdee - dailyAdjustment);
 if (goal === 'gain') return Math.round(tdee + dailyAdjustment);
 return Math.round(tdee);
}

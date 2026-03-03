// ============================================================
// APP SETTINGS DEFAULTS
// ============================================================

export const DEFAULT_SETTINGS = {
 // Units & Display
 weightUnit: 'lbs', // 'lbs' or 'kg'
 firstDayOfWeek: 0, // 0=Sun, 1=Mon, 6=Sat
 // Workout behavior
 defaultRestTimer: 90, // seconds
 autoStartTimer: true, // start rest timer on set complete
 timerVibrate: true, // subtle vibration when rest timer completes
 keepAwake: true, // prevent screen sleep during workout
 showRPE: true, // show RPE column in set logging
 weightIncrementUpper: 5, // lbs/kg increment for upper body
 weightIncrementLower: 10, // lbs/kg increment for lower body
 countWarmupInStats: false, // include warmup sets in volume stats
 // Recovery & Programming
 recoveryWindow: 48, // hours (default)
 cardioWeeklyTarget: 5, // sessions per week
 maxRPE: 9, // cap RPE (default)
 zone2HRMin: 120, // bpm
 zone2HRMax: 145, // bpm
 trainingTime: 'morning', // 'morning','afternoon','evening'
 // Programming — Stage 1+2
 daysPerWeek: 3, // 2-6, affects split selection
 experienceLevel: 'beginner', // beginner | intermediate | advanced
 trainingGoal: 'hypertrophy', // strength | hypertrophy | endurance
 enableProgressiveOverload: true,
 // AI Coach
 coachEnabled: true, // show/hide coach tab and features
 reportsEnabled: true, // generate weekly/monthly progress reports via LLM
 // Body measurements
 bodyWeight: '',
 bodyFatPct: '',
 bodyWeightHistory: [], // [{date,value}]
};

// ============================================================
// BODY TRACKING DEFAULTS
// ============================================================

export const DEFAULT_NUTRITION_CONFIG = {
 goal: 'lose', // 'lose' | 'maintain' | 'gain'
 weeklyRatePercent: 0.5, // % of body weight per week
 dailyCalorieTarget: 2200,
 dailyProteinTarget: 165,
 dayMultipliers: { mon:1.0, tue:1.0, wed:1.0, thu:1.0, fri:1.0, sat:1.0, sun:1.0 },
 estimatedTDEE: 2500,
 tdeeHistory: [],
 initialTDEE: 2500,
 tdeeConfidence: 'low',
 expenditureAlpha: 0.05,
 minDaysForAdjustment: 7,
 lastCheckInDate: null,
 calorieUnit: 'kcal',
 weightUnit: 'lbs',
 waistUnit: 'in',
 smoothingMethod: 'ewma', // 'ewma' | 'bidirectional' | 'timeadaptive'
 adaptiveSmoothingDays: 7,
};

export const DEFAULT_CALIBRATION = {
 method: 'simple_offset',
 points: [],
 offset: 0,
 slope: null,
 intercept: null,
 rSquared: null,
 ewmaOffset: null,
 ewmaAlpha: 0.6,
 prior: { mean: 3.0, precision: 0.5 },
 posterior: { mean: null, precision: null },
 deviceId: '',
 lastCalibrationDate: null,
 stalenessWarningDays: 180,
};

export const DEFAULT_BODY_LOG = {
 weight: '',
 calories: '',
 protein: '',
 bodyFat: { value: '', source: 'bia', device: '', calibratedValue: null },
 waistCircumference: '',
 sleep: { hours: '', quality: null, hrv: '' },
 notes: '',
};

export const DEFAULT_STREAKS = {
 weightLog: { current: 0, best: 0, lastDate: null },
 nutritionLog: { current: 0, best: 0, lastDate: null },
 combined: { current: 0, best: 0, lastDate: null },
};

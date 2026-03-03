export const UPPER_CATEGORIES = new Set(['chest', 'shoulders', 'back', 'triceps', 'biceps']);

// ============================================================
// VOLUME LANDMARKS (sets/week, intermediate defaults)
// Volume landmark concepts (MV, MEV, MAV, MRV) are based on
// the scientific volume framework developed by Renaissance
// Periodization. Values here are original estimates for this app.
// ============================================================

export const VOLUME_LANDMARKS = {
 chest: { mv: 3, mev: 5, mavLow: 6, mavHigh: 16, mrv: 22, freq: [1.5, 3], subgroups: null },
 back: { mv: 4, mev: 7, mavLow: 8, mavHigh: 20, mrv: 25, freq: [2, 4], subgroups: {
 horizontal_pull: { targetPct: 0.5 }, vertical_pull: { targetPct: 0.5 }
 }},
 quads: { mv: 5, mev: 7, mavLow: 8, mavHigh: 18, mrv: 23, freq: [1.5, 3], subgroups: null },
 hamstrings: { mv: 3, mev: 5, mavLow: 6, mavHigh: 14, mrv: 20, freq: [2, 3], subgroups: {
 hip_hinge: { targetPct: 0.5 }, isolation_lower: { targetPct: 0.5 }
 }},
 glutes: { mv: 0, mev: 1, mavLow: 2, mavHigh: 12, mrv: 16, freq: [2, 3], subgroups: null },
 side_delts: { mv: 4, mev: 7, mavLow: 8, mavHigh: 24, mrv: 30, freq: [2, 6], subgroups: null },
 rear_delts: { mv: 0, mev: 2, mavLow: 4, mavHigh: 12, mrv: 20, freq: [2, 6], subgroups: null },
 shoulders: { mv: 0, mev: 0, mavLow: 4, mavHigh: 8, mrv: 12, freq: [1, 2], subgroups: null },
 biceps: { mv: 3, mev: 5, mavLow: 8, mavHigh: 20, mrv: 26, freq: [2, 6], subgroups: null },
 triceps: { mv: 3, mev: 5, mavLow: 6, mavHigh: 14, mrv: 18, freq: [2, 4], subgroups: null },
 calves: { mv: 5, mev: 7, mavLow: 8, mavHigh: 16, mrv: 20, freq: [2, 4], subgroups: null },
 core: { mv: 0, mev: 1, mavLow: 4, mavHigh: 16, mrv: 25, freq: [3, 5], subgroups: {
 core_anti_extension: { targetPct: 0.4 }, core_anti_rotation: { targetPct: 0.3 }, core_flexion: { targetPct: 0.3 }
 }},
};

export function getAdjustedLandmarks(muscle, experienceLevel = 'intermediate') {
 const base = VOLUME_LANDMARKS[muscle];
 if (!base) return null;
 if (experienceLevel === 'intermediate') return base;
 const shift = experienceLevel === 'beginner'
 ? { mev: -3, mavLow: -2, mavHigh: -3, mrv: -5 }
 : { mev: 3, mavLow: 2, mavHigh: 3, mrv: 3 };
 return {
...base,
 mev: Math.max(base.mv, base.mev + shift.mev),
 mavLow: Math.max(base.mv + 1, base.mavLow + shift.mavLow),
 mavHigh: Math.max(base.mavLow, base.mavHigh + shift.mavHigh),
 mrv: Math.max(base.mavHigh, base.mrv + shift.mrv),
 };
}

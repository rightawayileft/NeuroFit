// ============================================================
// SPLIT SELECTION
// ============================================================

export const SPLIT_TEMPLATES = {
 full_body: {
 name: 'Full Body',
 days: [{ name: 'Full Body', slots: ['chest','back','shoulders','quads','hamstrings','glutes','core','calves','triceps','biceps','neck'] }],
 },
 upper_lower: {
 name: 'Upper / Lower',
 days: [
 { name: 'Upper', slots: ['chest','back','shoulders','triceps','biceps'] },
 { name: 'Lower', slots: ['quads','hamstrings','glutes','calves','core'] },
 ],
 },
 ppl: {
 name: 'Push / Pull / Legs',
 days: [
 { name: 'Push', slots: ['chest','shoulders','triceps','core'] },
 { name: 'Pull', slots: ['back','biceps','rear_delts','core'] },
 { name: 'Legs', slots: ['quads','hamstrings','glutes','calves','core'] },
 ],
 },
};

export function selectSplit(daysPerWeek, experienceLevel) {
 if (daysPerWeek >= 6) return 'ppl';
 if (daysPerWeek >= 5) return experienceLevel === 'beginner' ? 'upper_lower' : 'ppl';
 if (daysPerWeek >= 4) return 'upper_lower';
 return 'full_body'; // 2-3 days
}

export function getSplitDay(split, dayIndex) {
 const template = SPLIT_TEMPLATES[split];
 if (!template) return SPLIT_TEMPLATES.full_body.days[0];
 return template.days[dayIndex % template.days.length];
}

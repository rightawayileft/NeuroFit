export const today = () => new Date().toISOString().split('T')[0];
export const dayKey = (prefix) => `${prefix}:${today()}`;
export const subtractDays = (dateStr, n) => {
 const d = new Date(dateStr + 'T12:00:00');
 d.setDate(d.getDate() - n);
 return d.toISOString().split('T')[0];
};

export function getWeekId(date = new Date()) {
 const d = new Date(date);
 d.setHours(0,0,0,0);
 d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
 const week1 = new Date(d.getFullYear(), 0, 4);
 const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
 return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function getMonthId(date = new Date()) {
 return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export const today = () => new Date().toISOString().split('T')[0];
export const dayKey = (prefix) => `${prefix}:${today()}`;
export const subtractDays = (dateStr, n) => {
 const d = new Date(dateStr + 'T12:00:00');
 d.setDate(d.getDate() - n);
 return d.toISOString().split('T')[0];
};

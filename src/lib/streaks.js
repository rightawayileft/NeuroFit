import { subtractDays } from '@/lib/dateUtils';
import { DEFAULT_STREAKS } from '@/data/defaults';

// --- Streak System ---

export function updateStreaks(streaks, logType, dateStr) {
 const s = { ...(streaks || DEFAULT_STREAKS) };
 const streak = { ...(s[logType] || { current: 0, best: 0, lastDate: null }) };
 const yesterday = subtractDays(dateStr, 1);

 if (streak.lastDate === dateStr) return s; // already logged today()

 if (streak.lastDate === yesterday || streak.lastDate === null) {
 streak.current += 1;
 } else {
 streak.current = 1;
 }
 streak.best = Math.max(streak.best, streak.current);
 streak.lastDate = dateStr;
 s[logType] = streak;
 return s;
}

export function checkCombinedStreak(streaks, dateStr) {
 const s = { ...streaks };
 if (s.weightLog?.lastDate === dateStr && s.nutritionLog?.lastDate === dateStr) {
 const combined = { ...(s.combined || { current: 0, best: 0, lastDate: null }) };
 const yesterday = subtractDays(dateStr, 1);
 if (combined.lastDate === dateStr) return s;
 if (combined.lastDate === yesterday || combined.lastDate === null) {
 combined.current += 1;
 } else {
 combined.current = 1;
 }
 combined.best = Math.max(combined.best, combined.current);
 combined.lastDate = dateStr;
 s.combined = combined;
 }
 return s;
}

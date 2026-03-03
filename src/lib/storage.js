// ============================================================
// STORAGE HELPERS
// ============================================================

const _memoryStore = {};
const _lsAvailable = (() => {
 try { localStorage.setItem('__test__', '1'); localStorage.removeItem('__test__'); return true; }
 catch { return false; }
})();

export const LS = {
 get(key, fallback) {
 try {
 if (_lsAvailable) {
 const v = localStorage.getItem(key);
 return v ? JSON.parse(v) : fallback;
 }
 return key in _memoryStore ? JSON.parse(_memoryStore[key]) : fallback;
 } catch { return fallback; }
 },
 set(key, value) {
 try {
 const json = JSON.stringify(value);
 if (_lsAvailable) localStorage.setItem(key, json);
 else _memoryStore[key] = json;
 return true;
 } catch(e) {
 console.error('Storage error:', e);
 // Surface quota errors so the app can warn the user
 if (e.name === 'QuotaExceededError' || e.code === 22) {
 LS._quotaExceeded = true;
 }
 return false;
 }
 },
 _quotaExceeded: false,
 getUsageKB() {
 try {
 if (_lsAvailable) {
 let t = 0;
 for (let i = 0; i < localStorage.length; i++) {
 t += (localStorage.getItem(localStorage.key(i)) || '').length;
 }
 return Math.round(t / 1024);
 }
 let t = 0;
 for (const v of Object.values(_memoryStore)) t += (v || '').length;
 return Math.round(t / 1024);
 } catch { return 0; }
 },
 keys(prefix='') {
 const out = [];
 if (_lsAvailable) {
 for (let i = 0; i < localStorage.length; i++) {
 const k = localStorage.key(i);
 if (k.startsWith(prefix)) out.push(k);
 }
 } else {
 for (const k of Object.keys(_memoryStore)) {
 if (k.startsWith(prefix)) out.push(k);
 }
 }
 return out;
 }
};

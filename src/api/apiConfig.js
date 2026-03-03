import { LS } from '@/lib/storage';

export const API_STORAGE_KEY = 'apiCfg';

export const API_KEYS = {
 exerciseDB: import.meta.env.VITE_EXERCISEDB_API_KEY || '',
 youtubeDataV3: import.meta.env.VITE_YOUTUBE_API_KEY || '',
};

export const API_URLS = {
 exerciseDB: 'https://exercisedb-api.vercel.app/api/v1',
 youtubeDataV3: 'https://www.googleapis.com/youtube/v3',
};

export const API_LIMITS = {
 exerciseDB: 15,
 youtube: 20,
};

const callLog = {};
const usageStats = {};

function ensureUsage(apiName) {
 if (!usageStats[apiName]) {
 usageStats[apiName] = {
 calls: 0,
 cacheHits: 0,
 rateLimited: 0,
 failures: 0,
 lastCallAt: null,
 lastError: '',
 };
 }
 return usageStats[apiName];
}

function purgeCallLog(apiName, now = Date.now()) {
 if (!callLog[apiName]) callLog[apiName] = [];
 callLog[apiName] = callLog[apiName].filter((timestamp) => now - timestamp < 60000);
 return callLog[apiName];
}

export function getStoredApiConfig() {
 return LS.get(API_STORAGE_KEY, {
 enableCommunityExercises: false,
 keys: {
 exerciseDB: '',
 youtubeDataV3: '',
 },
 });
}

export function getApiKey(apiName) {
 const storedKey = getStoredApiConfig()?.keys?.[apiName] || '';
 return storedKey || API_KEYS[apiName] || '';
}

export function getApiKeySource(apiName) {
 const storedKey = getStoredApiConfig()?.keys?.[apiName] || '';
 if (storedKey) return 'local';
 if (API_KEYS[apiName]) return 'env';
 return 'none';
}

export function rateLimitOk(apiName, maxPerMinute = API_LIMITS[apiName] || 10) {
 const now = Date.now();
 const recentCalls = purgeCallLog(apiName, now);
 const usage = ensureUsage(apiName);

 if (recentCalls.length >= maxPerMinute) {
 usage.rateLimited += 1;
 return false;
 }

 recentCalls.push(now);
 return true;
}

export function trackCacheHit(apiName) {
 ensureUsage(apiName).cacheHits += 1;
}

export function getApiUsageSnapshot() {
 const snapshot = {};
 const allApis = new Set([
 ...Object.keys(API_LIMITS),
 ...Object.keys(usageStats),
 ...Object.keys(callLog),
 ]);

 for (const apiName of allApis) {
 const usage = ensureUsage(apiName);
 const recentCalls = purgeCallLog(apiName).length;
 snapshot[apiName] = {
 ...usage,
 recentCalls,
 remainingThisMinute: Math.max(0, (API_LIMITS[apiName] || 10) - recentCalls),
 };
 }

 return snapshot;
}

export async function apiFetch(url, options = {}) {
 const { timeout = 8000, retries = 1, apiName = 'unknown', ...fetchOpts } = options;

 for (let attempt = 0; attempt <= retries; attempt += 1) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const usage = ensureUsage(apiName);

  try {
   usage.calls += 1;
   usage.lastCallAt = Date.now();

   const response = await fetch(url, {
    ...fetchOpts,
    signal: controller.signal,
   });

   if (!response.ok) {
    throw new Error(`API ${response.status}: ${response.statusText}`);
   }

   usage.lastError = '';
   const contentType = response.headers.get('content-type') || '';
   if (contentType.includes('application/json')) {
    return await response.json();
   }

   return await response.text();
  } catch (err) {
   if (attempt === retries) {
    usage.failures += 1;
    usage.lastError = err.message;
    console.error(`API call failed after ${retries + 1} attempts:`, err.message);
    return { error: true, message: err.message, data: null };
   }

   await new Promise((resolve) => setTimeout(resolve, 1000));
  } finally {
   clearTimeout(timer);
  }
 }

 return { error: true, message: 'Unknown API failure', data: null };
}

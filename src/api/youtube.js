import { API_URLS, apiFetch, getApiKey, rateLimitOk, trackCacheHit } from './apiConfig';

const searchCache = new Map();

export function extractVideoId(url) {
 if (!url) return null;
 const patterns = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
 ];

 for (const pattern of patterns) {
  const match = url.match(pattern);
  if (match) return match[1];
 }

 return null;
}

export async function validateVideoId(videoId) {
 const apiKey = getApiKey('youtubeDataV3');
 if (!apiKey) return { valid: null, reason: 'No API key configured' };
 if (!rateLimitOk('youtube')) return { valid: null, reason: 'Rate limited' };

 const url = `${API_URLS.youtubeDataV3}/videos?${new URLSearchParams({
  part: 'snippet,status',
  id: videoId,
  key: apiKey,
 })}`;

 const result = await apiFetch(url, { apiName: 'youtube' });
 if (result?.error) return { valid: null, reason: result.message };

 const items = result.items || [];
 if (items.length === 0) return { valid: false, reason: 'Video not found or private' };

 const video = items[0];
 const isPublic = video.status?.privacyStatus === 'public';
 return {
  valid: isPublic,
  embeddable: video.status?.embeddable !== false,
  title: video.snippet?.title || '',
  channelTitle: video.snippet?.channelTitle || '',
  thumbnail: video.snippet?.thumbnails?.medium?.url || '',
  reason: isPublic ? 'OK' : `Status: ${video.status?.privacyStatus || 'unknown'}`,
 };
}

export async function searchExerciseVideo(exerciseName, maxResults = 3) {
 const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exerciseName} form tutorial`)}`;
 const apiKey = getApiKey('youtubeDataV3');

 if (!apiKey) {
  return { fallback: true, searchUrl, results: [] };
 }

 if (!rateLimitOk('youtube')) {
  return { fallback: true, searchUrl, results: [] };
 }

 const cacheKey = `${exerciseName}|${maxResults}`;
 if (searchCache.has(cacheKey)) {
  trackCacheHit('youtube');
  return searchCache.get(cacheKey);
 }

 const url = `${API_URLS.youtubeDataV3}/search?${new URLSearchParams({
  part: 'snippet',
  q: `${exerciseName} exercise form tutorial how to`,
  type: 'video',
  maxResults: String(maxResults),
  order: 'relevance',
  videoDuration: 'medium',
  safeSearch: 'strict',
  key: apiKey,
 })}`;

 const result = await apiFetch(url, { apiName: 'youtube' });
 if (result?.error) {
  return { fallback: true, searchUrl, results: [] };
 }

 const payload = {
  fallback: false,
  searchUrl,
  results: (result.items || [])
   .filter((item) => item.id?.videoId)
   .map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet?.title || '',
    thumbnail: item.snippet?.thumbnails?.medium?.url || '',
    channelTitle: item.snippet?.channelTitle || '',
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
   })),
 };

 searchCache.set(cacheKey, payload);
 return payload;
}

export async function auditVideoLinks(videoUrlMap) {
 const apiKey = getApiKey('youtubeDataV3');
 if (!apiKey) return { error: 'No API key configured', results: [] };

 const entries = Object.entries(videoUrlMap || {});
 const allIds = entries
  .map(([exerciseId, url]) => ({ exerciseId, videoId: extractVideoId(url) }))
  .filter((entry) => entry.videoId);

 const results = [];

 for (let i = 0; i < allIds.length; i += 50) {
  const batch = allIds.slice(i, i + 50);
  const url = `${API_URLS.youtubeDataV3}/videos?${new URLSearchParams({
   part: 'status,snippet',
   id: batch.map((entry) => entry.videoId).join(','),
   key: apiKey,
  })}`;

  const result = await apiFetch(url, { apiName: 'youtube' });
  if (result?.error) {
   return { error: result.message, results };
  }

  const foundIds = new Set((result.items || []).map((item) => item.id));
  const statusMap = {};
  for (const item of result.items || []) {
   statusMap[item.id] = {
    title: item.snippet?.title || '',
    status: item.status?.privacyStatus || 'unknown',
   };
  }

  for (const entry of batch) {
   const found = foundIds.has(entry.videoId);
   results.push({
    exerciseId: entry.exerciseId,
    videoId: entry.videoId,
    valid: found && statusMap[entry.videoId]?.status === 'public',
    title: statusMap[entry.videoId]?.title || null,
    status: found ? statusMap[entry.videoId]?.status : 'not_found',
   });
  }
 }

 return {
  total: results.length,
  valid: results.filter((entry) => entry.valid).length,
  broken: results.filter((entry) => !entry.valid),
  results,
 };
}

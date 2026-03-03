import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MessageCircle, Settings, Send } from 'lucide-react';
import { T } from '@/design/tokens';
import { DEFAULT_NUTRITION_CONFIG, DEFAULT_CALIBRATION, DEFAULT_STREAKS } from '@/data/defaults';
import { DAILY_REHAB } from '@/data/dailyRehab';
import { today, subtractDays } from '@/lib/dateUtils';
import { LS } from '@/lib/storage';
import { loadBodyLogs, loadAllBodyLogs, getSmoothedWeights } from '@/lib/weightSmoothing';
import { getCalibratedBodyFat } from '@/lib/bodyFatCalibration';
import { detectStall } from '@/lib/progressiveOverload';
import { computeWeightedMuscleVolume, analyzeMuscleBalance } from '@/lib/muscleBalance';

// ============================================================
// CONSTANTS & CONFIGURATION
// ============================================================

const DEFAULT_SYSTEM_PROMPT = `You are a fitness and mobility coach. Be concise (<120 words unless asked for detail). Reference clinical context when relevant. Never recommend exercises that conflict with any listed precautions.`;

const DEFAULT_PATIENT_PROFILE = `PATIENT: [Configure in settings]
DX: [Add diagnoses in settings]
GENETICS: [Add genetic markers in settings]
PRECAUTIONS: [Configure based on your conditions]
SUBS: [Configure based on your precautions]`;

// --- Provider / Model Registry ---

export const PROVIDERS = {
 anthropic: {
 name: 'Anthropic',
 models: [
 { id:'claude-haiku-4-5-20251001', label:'Haiku 4.5', cost:{in:0.80,out:4.00,cached:0.08} },
 { id:'claude-sonnet-4-5-20250929', label:'Sonnet 4.5', cost:{in:3.00,out:15.00,cached:0.30} },
 { id:'claude-opus-4-6', label:'Opus 4.6', cost:{in:15.00,out:75.00,cached:1.50} },
 ],
 keyPlaceholder: 'sk-ant-...',
 },
 openrouter: {
 name: 'OpenRouter',
 models: [
 { id:'anthropic/claude-haiku-4-5-20251001', label:'Haiku 4.5', cost:{in:0.80,out:4.00,cached:0.08} },
 { id:'anthropic/claude-sonnet-4-5-20250929', label:'Sonnet 4.5', cost:{in:3.00,out:15.00,cached:0.30} },
 { id:'anthropic/claude-opus-4-6', label:'Opus 4.6', cost:{in:15.00,out:75.00,cached:1.50} },
 { id:'google/gemini-2.5-flash-preview', label:'Gemini 2.5 Flash', cost:{in:0.15,out:0.60,cached:0.04} },
 { id:'google/gemini-2.5-pro-preview', label:'Gemini 2.5 Pro', cost:{in:1.25,out:10.00,cached:0.31} },
 { id:'deepseek/deepseek-chat-v3-0324', label:'DeepSeek V3', cost:{in:0.27,out:1.10,cached:0.07} },
 { id:'meta-llama/llama-4-maverick', label:'Llama 4 Maverick', cost:{in:0.20,out:0.60,cached:0.05} },
 { id:'__custom__', label:'Other', cost:{in:0,out:0,cached:0} },
 ],
 keyPlaceholder: 'sk-or-...',
 },
 gemini: {
 name: 'Google Gemini',
 models: [
 { id:'gemini-2.5-flash-preview-05-20', label:'Gemini 2.5 Flash', cost:{in:0.15,out:0.60,cached:0.04} },
 { id:'gemini-2.5-pro-preview-05-06', label:'Gemini 2.5 Pro', cost:{in:1.25,out:10.00,cached:0.31} },
 ],
 keyPlaceholder: 'AIza...',
 },
};

export const DEFAULT_COACH_CONFIG = {
 provider: 'anthropic',
 model: 'claude-haiku-4-5-20251001',
 customModel: '', // for OpenRouter "Other" option
 keys: { anthropic:'', openrouter:'', gemini:'' },
 maxHistory: 4,
 maxTokens: 250,
 temperature: 0.7,
 systemPrompt: DEFAULT_SYSTEM_PROMPT,
 patientProfile: DEFAULT_PATIENT_PROFILE,
 includePatientProfile: true,
 includeSessionContext: true,
 includeCurrentWorkout: true,
 includeRecentActivity: true,
 includeBodyMetrics: true,
};

// --- Token helpers ---

export const estimateTokens = (text) => Math.ceil((text || '').length / 4);

export function estimateCost(usage, modelInfo) {
 if (!usage || !modelInfo?.cost) return null;
 const r = modelInfo.cost; // rates per 1M tokens
 const cached = usage.cached || 0;
 const uncached = (usage.input || 0) - cached;
 const cost = (uncached * r.in / 1e6) + (cached * r.cached / 1e6) + ((usage.output || 0) * r.out / 1e6);
 return { cost: cost < 0.0001 ? '<$0.0001' : `$${cost.toFixed(4)}`, ...usage,
 pctCached: usage.input > 0 ? Math.round((cached / usage.input) * 100) : 0 };
}

// --- Context builders ---

export function buildSessionContext(profile, workout, rehabStatus, cardioLog, history, cfg) {
 const parts = [];

 if (cfg.includeSessionContext) {
 parts.push(`Phase:${profile.phase} Loc:${profile.location} XP:${profile.xp} Streak:${profile.streak}d`);
 }

 if (cfg.includeCurrentWorkout) {
 const wExercises = workout?.exercises || (Array.isArray(workout) ? workout : []);
 if (wExercises.length > 0) {
 const splitDay = workout?.splitDay || 'full_body';
 const summary = wExercises.map(e => {
 const sets = e.logSets || [];
 const done = sets.filter(s => s.done);
 if (done.length === 0) return e.name;
 const logged = done.map(s => `${s.weight||'?'}\u00D7${s.reps||'?'}`).join(',');
 return `${e.name}(${logged})`;
 });
 const doneCount = wExercises.filter(e => e.logSets?.every(s => s.done)).length;
 parts.push(`Today[${splitDay}][${doneCount}/${wExercises.length}]: ${summary.join('; ')}`);
 const prescriptions = wExercises.filter(e => e.prescription?.action).map(e => `${e.name.split(' ')[0]}:${e.prescription.action}`).slice(0, 5);
 if (prescriptions.length > 0) parts.push(`Rx: ${prescriptions.join(',')}`);
 const stallWarnings = wExercises.map(e => { const s = detectStall(e.id); if (s.stalled) return `${e.name.split(' ')[0]}:stalled`; if (s.fatigued) return `${e.name.split(' ')[0]}:fatigued`; return null; }).filter(Boolean);
 if (stallWarnings.length > 0) parts.push(`Alerts: ${stallWarnings.join(',')}`);
 if (workout.sessionRPE) parts.push(`SessionRPE:${workout.sessionRPE}`);
 }
 }

 if (cfg.includeSessionContext && rehabStatus && Object.keys(rehabStatus).length > 0) {
 const done = DAILY_REHAB.filter(r => rehabStatus[r.id]).map(r => r.name.split(' ')[0]);
 if (done.length > 0) parts.push(`Rehab: ${done.join(',')}`);
 }

 if (cfg.includeSessionContext && cardioLog?.length > 0) {
 const l = cardioLog[cardioLog.length - 1];
 parts.push(`Cardio: ${l.name} ${l.duration}m${l.hr ? ' HR'+l.hr : ''}`);
 }

 if (cfg.includeRecentActivity) {
 const last7 = Object.entries(history || {}).filter(([d]) =>
 (Date.now() - new Date(d).getTime()) / 864e5 < 7
 );
 if (last7.length > 0) {
 const wk = last7.filter(([,a]) => a.includes('workout')).length;
 const rh = last7.filter(([,a]) => a.includes('rehab')).length;
 const cd = last7.filter(([,a]) => a.includes('cardio')).length;
 parts.push(`7d: ${wk}W ${rh}R ${cd}C`);
 }
 }

 // Muscle balance summary (compact)
 try {
 const wv = computeWeightedMuscleVolume(null);
 const bal = analyzeMuscleBalance(wv);
 const balParts = bal.pairs.filter(p => p.valA > 0 || p.valB > 0)
 .map(p => `${p.labelA}:${p.valA}/${p.labelB}:${p.valB}(${p.balanced ? 'OK' : 'IMBAL'})`);
 if (balParts.length > 0) parts.push(`MuscBal: ${balParts.join(', ')}`);
 } catch(e) { /* skip on error */ }

 return parts.length > 0 ? parts.join(' | ') : '';
}

export function buildFullSystemPrompt(cfg) {
 let sys = cfg.systemPrompt || '';
 if (cfg.includePatientProfile && cfg.patientProfile) {
 sys += '\n\n' + cfg.patientProfile;
 }
 if (cfg.includeBodyMetrics) {
 try {
 const parts = [];
 const logs = loadBodyLogs();
 const allLogs = loadAllBodyLogs();
 const nCfg = LS.get('nutritionConfig', DEFAULT_NUTRITION_CONFIG);
 const cal = LS.get('bfCalibration', DEFAULT_CALIBRATION);
 const profile = LS.get('profile', {});
 // Weight trend (7d)
 if (logs.length >= 2) {
 const smoothed = getSmoothedWeights(logs, nCfg);
 const latest = smoothed[smoothed.length - 1];
 const cutoff7 = subtractDays(today(), 7);
 const past7 = smoothed.find(s => s.date >= cutoff7);
 const wUnit = nCfg.weightUnit || 'lbs';
 if (latest && past7) {
 const delta = Math.round((latest.trend - past7.trend) * 10) / 10;
 parts.push(`Weight trend: ${past7.trend}\u2192${latest.trend} (7d, ${delta > 0 ? '+' : ''}${delta} ${wUnit})`);
 } else if (latest) {
 parts.push(`Weight: ${latest.trend} ${wUnit}`);
 }
 }
 // TDEE
 if (nCfg.estimatedTDEE) {
 parts.push(`TDEE est: ${nCfg.estimatedTDEE} kcal (${nCfg.tdeeConfidence || 'low'} conf)`);
 }
 // Avg intake 7d
 const recentNutrition = allLogs.filter(l => l.calories && l.date >= subtractDays(today(), 7));
 if (recentNutrition.length > 0) {
 const avgCal = Math.round(recentNutrition.reduce((s, l) => s + Number(l.calories), 0) / recentNutrition.length);
 const protLogs = recentNutrition.filter(l => l.protein);
 const avgProt = protLogs.length > 0 ? Math.round(protLogs.reduce((s, l) => s + Number(l.protein), 0) / protLogs.length) : null;
 parts.push(`Avg intake 7d: ${avgCal} kcal${avgProt ? ', ' + avgProt + 'g protein' : ''}`);
 }
 // Body fat
 const bfLogs = allLogs.filter(l => l.bodyFat?.value);
 if (bfLogs.length > 0) {
 const latest = bfLogs[bfLogs.length - 1];
 const rawBF = Number(latest.bodyFat.value);
 const calibrated = getCalibratedBodyFat(rawBF, cal);
 const methodLabel = cal.method === 'simple_offset' ? `simple offset +${cal.offset}%` : cal.method?.replace(/_/g, ' ');
 parts.push(`BF: ${calibrated.value}% ${calibrated.calibrated ? 'calibrated (' + methodLabel + ')' : 'uncalibrated'}`);
 }
 // Streak
 const streaks = profile.streaks || DEFAULT_STREAKS;
 if (streaks.combined?.current > 0) {
 parts.push(`Logging streak: ${streaks.combined.current}d`);
 }
 if (parts.length > 0) {
 sys += '\n\nBODY: ' + parts.join(' | ');
 }
 } catch (e) { /* skip body metrics on error */ }
 }
 return sys;
}

function trimHistory(messages, maxExchanges) {
 const api = messages.filter(m => !m.local);
 if (api.length <= maxExchanges * 2) return api;
 const keep = api.slice(-(maxExchanges * 2));
 const dropped = api.slice(0, -(maxExchanges * 2));
 const topics = dropped.filter(m => m.role === 'user').map(m => m.content.slice(0, 40)).join('; ');
 return [
 { role:'user', content:`[Prior topics: ${topics}]` },
 { role:'assistant', content:'Understood, continuing from here.' },
 ...keep,
 ];
}

// --- Provider API dispatchers ---

// Helper: resolve actual model ID (handles __custom__)
const resolveModel = (cfg) => cfg.model === '__custom__' ? (cfg.customModel || cfg.model) : cfg.model;

async function callAnthropic(cfg, systemPrompt, apiMessages) {
 const key = cfg.keys.anthropic;
 if (!key) throw new Error('No Anthropic API key set');
 const res = await fetch('https://api.anthropic.com/v1/messages', {
 method:'POST',
 headers:{ 'Content-Type':'application/json', 'x-api-key':key, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
 body:JSON.stringify({ model:resolveModel(cfg), max_tokens:cfg.maxTokens, temperature:cfg.temperature, system:systemPrompt, messages:apiMessages }),
 });
 const data = await res.json();
 if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
 return {
 text: data.content?.[0]?.text || '',
 usage: { input:data.usage?.input_tokens||0, output:data.usage?.output_tokens||0, cached:data.usage?.cache_read_input_tokens||0 },
 };
}

async function callOpenRouter(cfg, systemPrompt, apiMessages) {
 const key = cfg.keys.openrouter;
 if (!key) throw new Error('No OpenRouter API key set');
 const msgs = [{ role:'system', content:systemPrompt }, ...apiMessages];
 const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
 method:'POST',
 headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${key}`, 'HTTP-Referer':'https://neurorehab.app', 'X-Title':'NeuroRehab Coach' },
 body:JSON.stringify({ model:resolveModel(cfg), max_tokens:cfg.maxTokens, temperature:cfg.temperature, messages:msgs }),
 });
 const data = await res.json();
 if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
 return {
 text: data.choices?.[0]?.message?.content || '',
 usage: { input:data.usage?.prompt_tokens||0, output:data.usage?.completion_tokens||0, cached:0 },
 };
}

async function callGemini(cfg, systemPrompt, apiMessages) {
 const key = cfg.keys.gemini;
 if (!key) throw new Error('No Gemini API key set');
 const contents = apiMessages.map(m => ({
 role: m.role === 'assistant' ? 'model' : 'user',
 parts:[{ text:m.content }],
 }));
 const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${resolveModel(cfg)}:generateContent?key=${key}`, {
 method:'POST',
 headers:{ 'Content-Type':'application/json' },
 body:JSON.stringify({
 system_instruction:{ parts:[{ text:systemPrompt }] },
 contents,
 generationConfig:{ maxOutputTokens:cfg.maxTokens, temperature:cfg.temperature },
 }),
 });
 const data = await res.json();
 if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
 const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
 const u = data.usageMetadata || {};
 return {
 text,
 usage: { input:u.promptTokenCount||0, output:u.candidatesTokenCount||0, cached:u.cachedContentTokenCount||0 },
 };
}

export const DISPATCH = { anthropic:callAnthropic, openrouter:callOpenRouter, gemini:callGemini };

// ============================================================
// TAB: COACH
// ============================================================

function CoachTab({ profile, workout, rehabStatus, cardioLog, history, coachCfg, goToSettings }) {
 const [messages, setMessages] = useState([
 { role:'assistant', content:"Hey! I'm your AI coach. Ask me about exercises, form, programming, or recovery. Tap \u2699 to configure provider and model in Settings.", local:true }
 ]);
 const [input, setInput] = useState('');
 const [loading, setLoading] = useState(false);
 const [lastUsage, setLastUsage] = useState(null);
 const chatRef = useRef(null);

 const cfg = coachCfg;
 const provider = PROVIDERS[cfg.provider] || PROVIDERS.anthropic;
 const currentModel = cfg.model === '__custom__'
 ? { id:'__custom__', label: cfg.customModel || 'Custom', cost:{in:0,out:0,cached:0} }
 : (provider.models.find(m => m.id === cfg.model) || provider.models[0]);
 const hasKey = !!(cfg.keys[cfg.provider]);

 const scrollToBottom = () => {
 setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior:'smooth' }), 100);
 };

 const sendMessage = async () => {
 if (!input.trim() || !hasKey || loading) return;
 const userMsg = { role:'user', content: input.trim() };
 const newMsgs = [...messages, userMsg];
 setMessages(newMsgs);
 setInput('');
 setLoading(true);
 scrollToBottom();

 try {
 const systemPrompt = buildFullSystemPrompt(cfg);
 const ctx = buildSessionContext(profile, workout, rehabStatus, cardioLog, history, cfg);
 const trimmed = trimHistory(newMsgs, cfg.maxHistory);

 // Inject dynamic context into last user message
 const apiMessages = trimmed.map((m, i) => {
 if (i === trimmed.length - 1 && m.role === 'user') {
 const prefix = ctx ? `[CTX: ${ctx}]\n` : '';
 return { role:'user', content: prefix + m.content };
 }
 return { role:m.role, content:m.content };
 });

 const dispatcher = DISPATCH[cfg.provider];
 if (!dispatcher) throw new Error(`Unknown provider: ${cfg.provider}`);

 const result = await dispatcher(cfg, systemPrompt, apiMessages);
 setLastUsage(result.usage);
 setMessages(prev => [...prev, { role:'assistant', content: result.text || 'Empty response.' }]);
 } catch(e) {
 setMessages(prev => [...prev, { role:'assistant', content: `Error: ${e.message}`, local:true }]);
 }
 setLoading(false);
 scrollToBottom();
 };

 const costInfo = useMemo(() => estimateCost(lastUsage, currentModel), [lastUsage, currentModel]);

 // --- No key: show setup prompt ---
 if (!hasKey) {
 return (
 <div style={{ animation:'fadeIn 0.3s ease-out', paddingTop:'40px', textAlign:'center' }}>
 <div style={{ width:64, height:64, borderRadius:'20px', background:T.tealGlow,
 display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
 <MessageCircle size={28} color={T.teal} />
 </div>
 <h2 style={{ fontSize:'20px', fontWeight:700, marginBottom:'8px' }}>AI Coach</h2>
 <p style={{ fontSize:'13px', color:T.text2, marginBottom:'24px', lineHeight:1.5 }}>
 Get personalized advice about exercises,<br/>form, recovery, and programming.
 </p>
 <button onClick={() => goToSettings?.('coach')}
 style={{ padding:'14px 32px', background:T.teal, border:'none', borderRadius:'12px',
 color:'#07070E', fontWeight:600, fontSize:'14px', cursor:'pointer' }}>
 Configure Provider &amp; API Key
 </button>
 </div>
 );
 }

 // --- Chat view ---
 return (
 <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 140px)', animation:'fadeIn 0.3s ease-out' }}>
 {/* Header */}
 <div style={{ marginBottom:'8px' }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
 <h2 style={{ fontSize:'20px', fontWeight:700 }}>AI Coach</h2>
 <button onClick={() => goToSettings?.('coach')}
 style={{ background:'none', border:'none', color:T.text3, cursor:'pointer', padding:'8px', display:'flex', alignItems:'center', gap:'4px' }}>
 <Settings size={16} />
 </button>
 </div>

 {/* Model pill + cost */}
 <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
 <span style={{ fontSize:'11px', fontWeight:600, color:T.teal, background:T.tealGlow,
 padding:'3px 8px', borderRadius:'6px' }}>
 {provider.name} &middot; {currentModel.label}
 </span>
 {costInfo && (
 <span style={{ fontSize:'10px', color:T.text3, fontFamily:T.mono }}>
 {costInfo.cost} &middot; {costInfo.input}in/{costInfo.output}out
 {costInfo.pctCached > 0 && <span style={{ color:T.teal }}> &middot; {costInfo.pctCached}%cached</span>}
 </span>
 )}
 </div>
 </div>

 {/* Messages */}
 <div ref={chatRef} role="log" aria-live="polite" aria-label="Chat messages" style={{ flex:1, overflowY:'auto', marginBottom:'12px', paddingRight:'4px' }}>
 {messages.map((msg, i) => (
 <div key={i} style={{
 display:'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
 marginBottom:'10px', animation:'fadeUp 0.2s ease-out',
 }}>
 <div style={{
 maxWidth:'85%', padding:'12px 16px', borderRadius:'16px',
 background: msg.role === 'user' ? T.accent : T.bgCard,
 border: msg.role === 'user' ? 'none' : `1px solid ${T.border}`,
 color: msg.role === 'user' ? '#fff' : T.text,
 fontSize:'14px', lineHeight:1.5, whiteSpace:'pre-wrap',
 }}>
 {msg.content}
 </div>
 </div>
 ))}
 {loading && (
 <div style={{ display:'flex', justifyContent:'flex-start', marginBottom:'10px' }}>
 <div style={{ padding:'12px 16px', borderRadius:'16px', background:T.bgCard,
 border:`1px solid ${T.border}`, fontSize:'14px', color:T.text3 }}>
 Thinking...
 </div>
 </div>
 )}
 </div>

 {/* Input */}
 <div style={{ display:'flex', gap:'8px' }}>
 <input value={input} onChange={e => setInput(e.target.value)}
 onKeyDown={e => e.key === 'Enter' && sendMessage()}
 placeholder="Ask about exercises, form, recovery..."
 aria-label="Message to AI coach"
 style={{ flex:1, padding:'14px 16px', background:T.bgCard, border:`1px solid ${T.border}`,
 borderRadius:'14px', color:T.text, fontSize:'14px', outline:'none' }} />
 <button onClick={sendMessage} disabled={loading || !input.trim()} aria-label="Send message"
 style={{ width:48, height:48, borderRadius:'14px', border:'none',
 background: input.trim() ? T.teal : 'rgba(255,255,255,0.04)',
 display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
 transition:'all 0.2s', opacity: input.trim() ? 1 : 0.5 }}>
 <Send size={18} color={input.trim() ? '#07070E' : T.text3} />
 </button>
 </div>
 </div>
 );
}

export default CoachTab;

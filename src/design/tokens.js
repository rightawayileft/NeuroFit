// ============================================================
// DESIGN SYSTEM
// ============================================================

export const T = {
 bg: '#07070E',
 bgCard: 'rgba(255,255,255,0.035)',
 bgCardHover: 'rgba(255,255,255,0.055)',
 bgGlass: 'rgba(12,12,24,0.85)',
 border: 'rgba(255,255,255,0.06)',
 borderLight: 'rgba(255,255,255,0.1)',
 accent: '#FF6B35',
 accentGlow: 'rgba(255,107,53,0.25)',
 accentSoft: 'rgba(255,107,53,0.12)',
 teal: '#4ECDC4',
 tealGlow: 'rgba(78,205,196,0.2)',
 success: '#00E676',
 successSoft: 'rgba(0,230,118,0.1)',
 warn: '#FFB74D',
 warnSoft: 'rgba(255,183,77,0.1)',
 danger: '#FF5252',
 text: 'rgba(255,255,255,0.92)',
 text2: 'rgba(255,255,255,0.75)',
 text3: 'rgba(255,255,255,0.65)',
 font: "'SF Pro Display', 'Inter', system-ui, -apple-system, sans-serif",
 mono: "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace",
 radius: '14px',
 radiusSm: '10px',
 radiusXl: '20px',
};

export const css = `
 @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
 @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
 @keyframes pulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.05) } }
 @keyframes slideDown { from { opacity:0; transform:translateY(-20px) } to { opacity:1; transform:translateY(0) } }
 @keyframes shimmer { 0% { background-position:-200% 0 } 100% { background-position:200% 0 } }
 @keyframes glow { 0%,100% { box-shadow:0 0 8px ${T.accentGlow} } 50% { box-shadow:0 0 20px ${T.accentGlow}, 0 0 40px rgba(255,107,53,0.1) } }
 @keyframes toast { 0% { transform:translateY(100%) scale(0.9); opacity:0 } 15% { transform:translateY(0) scale(1); opacity:1 } 85% { transform:translateY(0) scale(1); opacity:1 } 100% { transform:translateY(-20px); opacity:0 } }
 @keyframes chartFade { from { opacity:0.3 } to { opacity:1 } }
 @keyframes timerPulse { 0%,100% { box-shadow:0 0 0 rgba(0,230,118,0) } 50% { box-shadow:0 0 12px rgba(0,230,118,0.25), inset 0 0 8px rgba(0,230,118,0.05) } }
.chart-svg path,.chart-svg rect:not(:first-child) { transition: opacity 0.2s ease-out; }
.chart-svg { animation: chartFade 0.25s ease-out; }
 * { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
 html, body, #root { height:100%; background:${T.bg}; color:${T.text}; font-family:${T.font}; overflow-x:hidden; -webkit-overflow-scrolling:touch; }
 input, textarea, select { font-size:16px !important; }
 input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
 input[type="number"] { -moz-appearance:textfield; }
 button { font-family:${T.font}; }
 ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:${T.text3}; border-radius:4px; }
`;

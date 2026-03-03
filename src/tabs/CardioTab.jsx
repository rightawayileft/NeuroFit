import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { T } from '@/design/tokens';
import { CARDIO_OPTIONS } from '@/data/cardioOptions';
import GlassCard from '@/components/GlassCard';

function CardioTab({ cardioLog, onLogCardio, settings, goToSettings }) {
 const [duration, setDuration] = useState(30);
 const [hr, setHr] = useState('');
 const hrMin = settings?.zone2HRMin || 120;
 const hrMax = settings?.zone2HRMax || 145;
 const weeklyTarget = settings?.cardioWeeklyTarget || 5;
 const weekLogs = cardioLog.filter(l => {
 const d = new Date(l.date);
 const now = new Date();
 const diff = (now - d) / (1000*60*60*24);
 return diff < 7;
 });

 return (
 <div style={{ animation:'fadeIn 0.3s ease-out' }}>
 <div style={{ marginBottom:'20px' }}>
 <h2 style={{ fontSize:'20px', fontWeight:700 }}>Cardio</h2>
 <p style={{ fontSize:'13px', color:T.text2, marginTop:'4px' }}>
 Zone 2 &middot; <button onClick={() => goToSettings?.('recovery')} style={{ background:'none', border:'none',
 color:T.text2, cursor:'pointer', fontSize:'13px', padding:0, textDecoration:'underline',
 textDecorationStyle:'dotted', textUnderlineOffset:'3px' }}>{hrMin}-{hrMax} bpm</button> &middot; <button
 onClick={() => goToSettings?.('recovery')} style={{ background:'none', border:'none', color:T.text2,
 cursor:'pointer', fontSize:'13px', padding:0, textDecoration:'underline', textDecorationStyle:'dotted',
 textUnderlineOffset:'3px' }}>{weeklyTarget}&times;/week</button>
 </p>
 </div>

 {/* Weekly progress */}
 <GlassCard animate={false} style={{ marginBottom:'16px', textAlign:'center' }}>
 <div style={{ fontSize:'12px', color:T.text3, marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
 This Week
 </div>
 <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginBottom:'8px' }}>
 {Array.from({length: weeklyTarget}, (_, i) => (
 <div key={i} style={{
 width:32, height:32, borderRadius:'50%',
 background: i < weekLogs.length ? T.teal : 'rgba(255,255,255,0.04)',
 border: `2px solid ${i < weekLogs.length ? T.teal : T.border}`,
 display:'flex', alignItems:'center', justifyContent:'center',
 fontSize:'12px', fontWeight:600, color: i < weekLogs.length ? '#07070E' : T.text3,
 transition:'all 0.3s',
 }}>
 {i < weekLogs.length ? '\u2713' : i+1}
 </div>
 ))}
 </div>
 <div style={{ fontSize:'13px', color: weekLogs.length >= weeklyTarget ? T.success : T.text2 }}>
 {weekLogs.length}/{weeklyTarget} sessions
 </div>
 </GlassCard>

 {/* Duration / HR inputs */}
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
 <GlassCard animate={false} style={{ padding:'12px' }}>
 <div style={{ fontSize:'10px', color:T.text3, textTransform:'uppercase', marginBottom:'6px' }}>Duration</div>
 <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
 <button onClick={() => setDuration(d => Math.max(10, d-5))} aria-label="Decrease duration by 5 minutes" style={{ background:'none', border:'none', color:T.text2, cursor:'pointer', padding:'10px', minWidth:'44px', minHeight:'44px', display:'flex', alignItems:'center', justifyContent:'center' }}><Minus size={18} /></button>
 <span style={{ fontSize:'20px', fontWeight:700, fontFamily:T.mono, flex:1, textAlign:'center' }} aria-live="polite">{duration}</span>
 <button onClick={() => setDuration(d => Math.min(90, d+5))} aria-label="Increase duration by 5 minutes" style={{ background:'none', border:'none', color:T.text2, cursor:'pointer', padding:'10px', minWidth:'44px', minHeight:'44px', display:'flex', alignItems:'center', justifyContent:'center' }}><Plus size={18} /></button>
 </div>
 <div style={{ fontSize:'10px', color:T.text3, textAlign:'center' }}>minutes</div>
 </GlassCard>
 <GlassCard animate={false} style={{ padding:'12px' }}>
 <div style={{ fontSize:'10px', color:T.text3, textTransform:'uppercase', marginBottom:'6px' }}>Avg HR</div>
 <input type="number" inputMode="numeric" placeholder="bpm" value={hr}
 onChange={e => setHr(e.target.value)} aria-label="Average heart rate (BPM)"
 style={{ width:'100%', background:'transparent', border:'none', textAlign:'center',
 fontSize:'20px', fontWeight:700, fontFamily:T.mono, color:T.text, outline:'none' }} />
 <div style={{ fontSize:'10px', color:T.text3, textAlign:'center' }}>
 {hr && hr >= hrMin && hr <= hrMax ? '\u2713 Zone 2' : hr ? '\u26A0 Check zone' : 'bpm'}
 </div>
 </GlassCard>
 </div>

 {/* Cardio options */}
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
 {CARDIO_OPTIONS.map((c, i) => (
 <button key={c.id} onClick={() => onLogCardio(c, duration, hr)}
 style={{
 background: T.bgCard, border:`1px solid ${T.border}`, borderRadius:T.radius,
 padding:'16px 12px', textAlign:'left', cursor:'pointer', transition:'all 0.2s',
 animation: `fadeUp 0.3s ease-out ${i * 0.06}s both`,
 }}
 onMouseDown={e => e.currentTarget.style.transform='scale(0.97)'}
 onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
 onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
 >
 <div style={{ fontSize:'20px', marginBottom:'6px' }}>{c.icon}</div>
 <div style={{ fontSize:'13px', fontWeight:600, color:T.text, marginBottom:'2px' }}>{c.name}</div>
 <div style={{ fontSize:'11px', color:T.text3 }}>{c.settings}</div>
 </button>
 ))}
 </div>
 </div>
 );
}

export default CardioTab;

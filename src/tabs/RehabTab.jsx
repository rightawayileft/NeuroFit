import React from 'react';
import { Check } from 'lucide-react';
import { T } from '@/design/tokens';
import { XP_REWARDS } from '@/data/levels';
import { DAILY_REHAB } from '@/data/dailyRehab';
import GlassCard from '@/components/GlassCard';
import { CircularTimer } from '@/components/RestTimerBar';

function RehabTab({ rehabStatus, onToggle }) {
 const completed = DAILY_REHAB.filter(r => rehabStatus[r.id]).length;
 const total = DAILY_REHAB.length;
 const allDone = completed === total;

 return (
 <div style={{ animation:'fadeIn 0.3s ease-out' }}>
 <div style={{ marginBottom:'20px' }}>
 <h2 style={{ fontSize:'20px', fontWeight:700, letterSpacing:'-0.02em' }}>Daily Rehab Protocol</h2>
 <p style={{ fontSize:'13px', color:T.text2, marginTop:'4px' }}>
 Do these every day. Consistency is the medicine.
 </p>
 <p style={{ fontSize:'11px', color:T.text3, marginTop:'4px', fontStyle:'italic' }}>
 These are separate from the rehab exercises in your workout. This checklist covers daily mobility and corrective work.
 </p>
 </div>

 {/* Progress ring */}
 <GlassCard animate={false} style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'16px' }}>
 <div style={{ position:'relative', width:52, height:52 }}>
 <CircularTimer duration={total} timeLeft={total-completed} size={52} strokeWidth={4} />
 <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
 fontSize:'14px', fontWeight:700, color: allDone ? T.success : T.text }}>
 {completed}/{total}
 </span>
 </div>
 <div>
 <div style={{ fontSize:'14px', fontWeight:600, color: allDone ? T.success : T.text }}>
 {allDone ? 'All done! \u2713' : `${total - completed} remaining`}
 </div>
 <div style={{ fontSize:'12px', color:T.text3 }}>+{XP_REWARDS.rehab} XP when complete</div>
 </div>
 </GlassCard>

 {DAILY_REHAB.map((item, i) => {
 const done = rehabStatus[item.id];
 return (
 <div key={item.id} onClick={() => onToggle(item.id)}
 role="checkbox" aria-checked={done} tabIndex={0}
 aria-label={`${item.name}: ${done ? 'completed' : 'not completed'}`}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(item.id); } }}
 style={{
 background: done ? T.successSoft : T.bgCard, border: `1px solid ${done ? 'rgba(0,230,118,0.15)' : T.border}`,
 borderRadius: T.radius, padding:'16px', marginBottom:'10px', cursor:'pointer',
 display:'flex', alignItems:'center', gap:'14px', transition:'all 0.2s',
 animation: `fadeUp 0.3s ease-out ${i * 0.06}s both`,
 }}>
 <div style={{
 width:28, height:28, borderRadius:'50%',
 border:`2px solid ${done ? T.success : T.text3}`,
 background: done ? T.success : 'transparent',
 display:'flex', alignItems:'center', justifyContent:'center',
 transition:'all 0.2s', flexShrink:0,
 }}>
 {done && <Check size={14} color="#07070E" strokeWidth={3} />}
 </div>
 <div style={{ flex:1 }}>
 <div style={{ fontSize:'14px', fontWeight:600, color: done ? T.success : T.text }}>{item.name}</div>
 <div style={{ fontSize:'12px', color:T.text3, marginTop:'2px' }}>{item.detail}</div>
 </div>
 </div>
 );
 })}
 </div>
 );
}

export default RehabTab;

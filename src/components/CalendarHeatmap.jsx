import React, { useState } from 'react';
import { T } from '@/design/tokens';
import { today } from '@/lib/dateUtils';
import GlassCard from '@/components/GlassCard';

function CalendarHeatmap({ history, onDayClick }) {
 const now = new Date;
 const [monthOffset, setMonthOffset] = useState(0);
 const viewDate = new Date(now.getFullYear, now.getMonth + monthOffset, 1);
 const daysInMonth = new Date(viewDate.getFullYear, viewDate.getMonth + 1, 0).getDate;
 const startDay = viewDate.getDay;
 const monthStr = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
 const yymm = `${viewDate.getFullYear}-${String(viewDate.getMonth+1).padStart(2,'0')}`;

 return (
 <GlassCard animate={false} style={{ padding:'16px' }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
 <button onClick={ => setMonthOffset(m => m-1)} aria-label="Previous month" style={{ background:'none', border:'none', color:T.text2, cursor:'pointer', padding:'8px' }}>‹</button>
 <span style={{ fontSize:'14px', fontWeight:600 }}>{monthStr}</span>
 <button onClick={ => setMonthOffset(m => Math.min(m+1, 0))} aria-label="Next month" style={{ background:'none', border:'none', color:T.text2, cursor:'pointer', padding:'8px' }}>›</button>
 </div>
 <div role="grid" aria-label={`Activity calendar for ${monthStr}`} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px', textAlign:'center' }}>
 {['S','M','T','W','T','F','S'].map((d,i) => (
 <div key={i} style={{ fontSize:'10px', color:T.text3, padding:'4px 0', fontWeight:600 }}>{d}</div>
 ))}
 {Array(startDay).fill(null).map((_,i) => <div key={`p${i}`} />)}
 {Array.from({length:daysInMonth}, (_,i) => {
 const d = i+1;
 const dateStr = `${yymm}-${String(d).padStart(2,'0')}`;
 const acts = history[dateStr] || [];
 const hasWorkout = acts.includes('workout');
 const hasRehab = acts.includes('rehab');
 const hasCardio = acts.includes('cardio');
 const hasAny = acts.length > 0;
 const isToday = dateStr === today;

 let bg = 'rgba(255,255,255,0.03)';
 if (hasWorkout) bg = T.accent;
 else if (hasRehab || hasCardio) bg = T.teal;

 const activityDesc = [hasWorkout && 'workout', hasRehab && 'rehab', hasCardio && 'cardio'].filter(Boolean).join(', ') || 'no activity';
 const fullDate = new Date(viewDate.getFullYear, viewDate.getMonth, d).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

 return (
 <div key={d} role="gridcell"
 aria-label={`${fullDate}${isToday ? ' (today)' : ''}, ${activityDesc}`}
 tabIndex={hasAny ? 0 : -1}
 onClick={ => hasAny && onDayClick?.(dateStr)}
 onKeyDown={(e) => { if (hasAny && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault; onDayClick?.(dateStr); } }}
 style={{
 aspectRatio:'1', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center',
 fontSize:'12px', fontWeight: hasAny ? 600 : 400,
 color: hasAny ? '#fff' : T.text3, background:bg,
 border: isToday ? `2px solid ${T.accent}` : '1px solid transparent',
 transition:'all 0.2s', cursor: hasAny ? 'pointer' : 'default',
 }}>{d}</div>
 );
 })}
 </div>
 <div style={{ display:'flex', gap:'16px', justifyContent:'center', marginTop:'12px', fontSize:'10px', color:T.text3 }}>
 <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <div style={{ width:8, height:8, borderRadius:'3px', background:T.accent }} /> Workout
 </div>
 <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
 <div style={{ width:8, height:8, borderRadius:'3px', background:T.teal }} /> Rehab/Cardio
 </div>
 </div>
 </GlassCard>
 );
}

export default CalendarHeatmap;

import React from 'react';
import { T } from '@/design/tokens';

export default function MuscleMap({ recentMuscles }) {
 // Simplified front/back body SVG with muscle group regions
 const muscles = {
 chest: { x:45, y:22, w:10, label:'Chest' },
 shoulders: { x:33, y:18, w:8, label:'Shoulders' },
 back: { x:45, y:25, w:10, label:'Back' },
 biceps: { x:30, y:30, w:6, label:'Biceps' },
 triceps: { x:60, y:30, w:6, label:'Triceps' },
 core: { x:45, y:35, w:8, label:'Core' },
 quads: { x:40, y:52, w:8, label:'Quads' },
 hamstrings: { x:50, y:52, w:8, label:'Hamstrings' },
 glutes: { x:45, y:45, w:8, label:'Glutes' },
 calves: { x:45, y:68, w:6, label:'Calves' },
 };

 const getColor = (cat) => {
 // Merge sub-muscle-group hours into display groups
 let hours = recentMuscles?.[cat];
 if (cat === 'shoulders') {
 const variants = ['shoulders', 'side_delts', 'rear_delts', 'front_delts'];
 const found = variants.map(k => recentMuscles?.[k]).filter(v => v !== undefined);
 if (found.length > 0) hours = Math.min(.found);
 }
 if (!hours && hours !== 0) return 'rgba(255,255,255,0.06)';
 if (hours < 48) return T.success;
 if (hours < 96) return T.warn;
 return T.danger;
 };

 return (
 <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'6px' }}>
 {Object.entries(muscles).map(([key, m]) => (
 <div key={key} style={{
 background: getColor(key), borderRadius:'8px', padding:'10px 4px',
 textAlign:'center', fontSize:'10px', color:T.text, fontWeight:500,
 transition:'all 0.3s', border:`1px solid ${T.border}`,
 }}>
 {m.label}
 </div>
 ))}
 </div>
 );
}

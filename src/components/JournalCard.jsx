import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, Send, X } from 'lucide-react';
import { T } from '@/design/tokens';
import { today, subtractDays } from '@/lib/dateUtils';
import { LS } from '@/lib/storage';
import GlassCard from '@/components/GlassCard';

function JournalCard({ workout }) {
 const [isOpen, setIsOpen] = useState(false);
 const [newEntry, setNewEntry] = useState('');
 const [recentEntries, setRecentEntries] = useState([]);
 const [showAll, setShowAll] = useState(false);

 // Load recent entries on mount/open
 useEffect( => {
 if (!isOpen) return;
 const entries = [];
 const keys = LS.keys('journal:');
 const sortedKeys = keys.sort((a, b) => b.localeCompare(a)).slice(0, 14); // Last 2 weeks
 for (const key of sortedKeys) {
 const dayEntries = LS.get(key, []);
 if (Array.isArray(dayEntries)) {
 entries.push(.dayEntries.map(e => ({.e, _date: key.replace('journal:', '') })));
 }
 }
 entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
 setRecentEntries(entries);
 }, [isOpen, newEntry]); // re-load after adding

 const getCurrentContext = => {
 const ctx = { phase: null, splitDay: null, exerciseName: null, exerciseId: null };
 if (workout?.exercises) {
 ctx.splitDay = workout.splitDay?.replace(/_/g, ' ') || null;
 // Find the last exercise that has any completed sets (current exercise being worked on)
 const inProgress = workout.exercises.find(ex => {
 const done = ex.logSets?.filter(s => s.done).length || 0;
 const total = ex.logSets?.length || 0;
 return done > 0 && done < total;
 });
 const lastDone = [.(workout.exercises || [])].reverse.find(ex =>
 ex.logSets?.some(s => s.done)
 );
 const current = inProgress || lastDone;
 if (current) {
 ctx.exerciseName = current.name;
 ctx.exerciseId = current.id;
 }
 }
 return ctx;
 };

 const handleAdd = => {
 if (!newEntry.trim) return;
 const todayStr = today;
 const ctx = getCurrentContext;
 const entry = {
 id: `j_${Date.now}`,
 timestamp: Date.now,
 text: newEntry.trim,
 tags: {
 splitDay: ctx.splitDay || null,
 exerciseName: ctx.exerciseName || null,
 exerciseId: ctx.exerciseId || null,
 time: new Date.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' }),
 },
 };
 const existing = LS.get(`journal:${todayStr}`, []);
 const updated = Array.isArray(existing) ? [.existing, entry] : [entry];
 LS.set(`journal:${todayStr}`, updated);
 setNewEntry('');
 };

 const handleDelete = (entryId, dateStr) => {
 const dayEntries = LS.get(`journal:${dateStr}`, []);
 const filtered = dayEntries.filter(e => e.id !== entryId);
 if (filtered.length > 0) {
 LS.set(`journal:${dateStr}`, filtered);
 } else {
 localStorage.removeItem(`journal:${dateStr}`);
 }
 setRecentEntries(prev => prev.filter(e => e.id !== entryId));
 };

 const ctx = getCurrentContext;
 const displayEntries = showAll ? recentEntries : recentEntries.slice(0, 4);

 return (
 <GlassCard style={{ marginBottom:'16px', padding: isOpen ? '16px' : '0', overflow:'hidden' }}>
 <button onClick={ => setIsOpen(!isOpen)} style={{
 width:'100%', padding: isOpen ? '0 0 12px' : '14px 16px', background:'none', border:'none',
 display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', color:T.text,
 }}>
 <BookOpen size={18} color={T.teal} />
 <span style={{ fontSize:'15px', fontWeight:600, flex:1, textAlign:'left' }}>Journal</span>
 {recentEntries.length > 0 && isOpen && (
 <span style={{ fontSize:'11px', color:T.text3, fontFamily:T.mono }}>{recentEntries.length}</span>
 )}
 <ChevronDown size={16} color={T.text3} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition:'0.2s' }} />
 </button>

 {isOpen && (
 <div style={{ animation:'fadeUp 0.2s ease-out' }}>
 {/* Auto-tag context */}
 {ctx.exerciseName && (
 <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'8px' }}>
 {ctx.splitDay && (
 <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'6px', background:T.accentSoft, color:T.accent, fontWeight:600 }}>
 {ctx.splitDay}
 </span>
 )}
 <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'6px', background:T.tealGlow, color:T.teal, fontWeight:600 }}>
 {ctx.exerciseName}
 </span>
 </div>
 )}

 {/* New entry input */}
 <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
 <textarea
 placeholder="How's the session going? Note form cues, pain, energy."
 value={newEntry} onChange={e => setNewEntry(e.target.value)}
 onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault; handleAdd; } }}
 rows={2} aria-label="Workout journal entry"
 style={{
 flex:1, background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`,
 borderRadius:'10px', padding:'10px 12px', color:T.text, fontSize:'13px',
 fontFamily:T.font, outline:'none', resize:'none', lineHeight:1.4,
 }}
 />
 <button onClick={handleAdd} disabled={!newEntry.trim}
 style={{
 width:'40px', borderRadius:'10px', border:'none', cursor: newEntry.trim ? 'pointer' : 'default',
 background: newEntry.trim ? T.tealGlow : 'rgba(255,255,255,0.02)',
 color: newEntry.trim ? T.teal : T.text3,
 display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', flexShrink:0,
 }}>
 <Send size={16} />
 </button>
 </div>

 {/* Recent entries */}
 {displayEntries.length > 0 && (
 <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:'10px' }}>
 <div style={{ fontSize:'10px', fontWeight:600, color:T.text3, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>
 Recent Entries
 </div>
 {displayEntries.map((entry, i) => {
 const entryDate = new Date(entry.timestamp);
 const isEntryToday = entry._date === today;
 const dateLabel = isEntryToday ? 'Today' :
 entry._date === subtractDays(today, 1) ? 'Yesterday' :
 entryDate.toLocaleDateString('en-US', { month:'short', day:'numeric' });

 return (
 <div key={entry.id || i} style={{
 padding:'8px 0', borderBottom: i < displayEntries.length - 1 ? `1px solid ${T.border}` : 'none',
 display:'flex', gap:'8px', alignItems:'flex-start',
 }}>
 <div style={{ flex:1 }}>
 <div style={{ fontSize:'13px', color:T.text, lineHeight:1.4, marginBottom:'4px' }}>
 {entry.text}
 </div>
 <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center' }}>
 <span style={{ fontSize:'10px', color:T.text3, fontFamily:T.mono }}>
 {dateLabel} {entry.tags?.time || ''}
 </span>
 {entry.tags?.splitDay && (
 <span style={{ fontSize:'10px', padding:'2px 6px', borderRadius:'4px', background:'rgba(255,107,53,0.08)', color:T.accent }}>
 {entry.tags.splitDay}
 </span>
 )}
 {entry.tags?.exerciseName && (
 <span style={{ fontSize:'10px', padding:'2px 6px', borderRadius:'4px', background:'rgba(78,205,196,0.08)', color:T.teal }}>
 {entry.tags.exerciseName}
 </span>
 )}
 </div>
 </div>
 <button onClick={ => handleDelete(entry.id, entry._date)} style={{
 background:'none', border:'none', cursor:'pointer', padding:'10px',
 color:T.text3, opacity:0.5, flexShrink:0, minWidth:'44px', minHeight:'44px',
 display:'flex', alignItems:'center', justifyContent:'center',
 }}>
 <X size={14} />
 </button>
 </div>
 );
 })}
 {recentEntries.length > 4 && (
 <button onClick={ => setShowAll(!showAll)} style={{
 background:'none', border:'none', color:T.teal, fontSize:'12px', cursor:'pointer',
 padding:'12px 0', width:'100%', textAlign:'center', minHeight:'44px',
 }}>
 {showAll ? 'Show less' : `Show all ${recentEntries.length} entries`}
 </button>
 )}
 </div>
 )}

 {displayEntries.length === 0 && (
 <div style={{ textAlign:'center', padding:'12px 0', color:T.text3, fontSize:'12px' }}>
 No entries yet. Journal during your workout — entries are auto-tagged with your current exercise.
 </div>
 )}
 </div>
 )}
 </GlassCard>
 );
}

export default JournalCard;

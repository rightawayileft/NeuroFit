import React from 'react';
import { Zap } from 'lucide-react';

export default function Toast({ message, xp }) {
 return (
 <div role="alert" aria-live="assertive" style={{
 position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
 background: 'rgba(255,107,53,0.95)', color: 'white', padding: '10px 20px',
 borderRadius: '24px', fontSize: '14px', fontWeight: 600, zIndex: 1000,
 animation: 'toast 2.5s ease-out forwards', display: 'flex', alignItems: 'center', gap: '8px',
 boxShadow: '0 8px 32px rgba(255,107,53,0.3)',
 }}>
 <Zap size={16} /> {message} {xp && <span style={{opacity:0.8}}>+{xp} XP</span>}
 </div>
 );
}

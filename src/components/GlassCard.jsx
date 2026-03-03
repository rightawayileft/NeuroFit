import React from 'react';
import { T } from '@/design/tokens';

export default function GlassCard({ children, style, onClick, animate = true, className = '' }) {
 return (
 <div onClick={onClick} className={className} style={{
 background: T.bgCard,
 backdropFilter: 'blur(20px)',
 WebkitBackdropFilter: 'blur(20px)',
 border: `1px solid ${T.border}`,
 borderRadius: T.radius,
 padding: '16px',
 animation: animate ? 'fadeUp 0.4s ease-out both' : 'none',
 transition: 'background 0.2s, transform 0.15s',
 cursor: onClick ? 'pointer' : 'default',
...style
 }}>
 {children}
 </div>
 );
}

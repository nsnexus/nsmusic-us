'use client';

import { ShieldCheck, Star, Zap, Lock } from 'lucide-react';

export default function MobileTrustBadges({ t }) {
  const items = [
    {
      icon: ShieldCheck,
      color: '#059669',
      bg: '#ecfdf5',
      title: t[0][0],
      desc: t[0][1],
    },
    {
      icon: Star,
      color: '#f59e0b',
      bg: '#fef3c7',
      title: t[1][0],
      desc: t[1][1],
    },
    {
      icon: Zap,
      color: '#4f46e5',
      bg: '#eef2ff',
      title: t[2][0],
      desc: t[2][1],
    },
  ];

  return (
    <div
      style={{
        margin: '18px 0 16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '10px',
      }}
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '12px 14px',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                backgroundColor: item.bg,
                color: item.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '1px',
              }}
            >
              <Icon size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#1e293b', display: 'block', lineHeight: 1.25, marginBottom: '2px' }}>
                {item.title}
              </strong>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, lineHeight: 1.35 }}>
                {item.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}


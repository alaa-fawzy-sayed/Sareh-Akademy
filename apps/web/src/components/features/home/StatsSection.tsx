'use client';

import { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, Star } from 'lucide-react';
import { fetchPlatformStats } from '@/lib/api/services';
import styles from './StatsSection.module.css';

const DEFAULT_STATS = [
  { icon: Users,          key: 'users',        label: 'طالب مسجل',       suffix: '+', color: '#6C63FF', fallback: '15,000' },
  { icon: BookOpen,       key: 'subjects',      label: 'مادة دراسية',     suffix: '+', color: '#F59E0B', fallback: '500' },
  { icon: GraduationCap,  key: 'universities',  label: 'جامعة مشتركة',    suffix: '',  color: '#10B981', fallback: '12' },
  { icon: Star,           key: 'rating',        label: 'تقييم المنصة',    suffix: '',  color: '#EF4444', fallback: '4.9' },
];

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}م`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}ألف`;
  return n.toLocaleString('ar-EG');
}

export function StatsSection() {
  const [stats, setStats] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPlatformStats().then((data) => {
      if (!data) return;
      setStats({
        users:        data.users       ? fmt(data.users)       : '',
        subjects:     data.subjects    ? fmt(data.subjects)    : '',
        universities: data.universities ? String(data.universities) : '',
      });
    }).catch(() => {/* use fallbacks */});
  }, []);

  return (
    <section className={styles.section} id="stats-section">
      <div className="container">
        <div className={styles.grid}>
          {DEFAULT_STATS.map((stat, i) => {
            const Icon = stat.icon;
            const val = stats[stat.key];
            const display = val ? `${val}${stat.suffix}` : `${stat.fallback}${stat.suffix}`;
            return (
              <div key={i} className={styles.card} id={`stat-card-${i}`}>
                <div className={styles.iconWrap} style={{ '--icon-color': stat.color } as React.CSSProperties}>
                  <Icon size={24} />
                </div>
                <div className={styles.value}>{display}</div>
                <div className={styles.label}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

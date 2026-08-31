import { Users, BookOpen, GraduationCap, Star } from 'lucide-react';
import styles from './StatsSection.module.css';

const stats = [
  { icon: Users, value: '15,000+', label: 'طالب مسجل', color: '#6C63FF' },
  { icon: BookOpen, value: '500+', label: 'مادة دراسية', color: '#F59E0B' },
  { icon: GraduationCap, value: '12', label: 'جامعة مشتركة', color: '#10B981' },
  { icon: Star, value: '4.9', label: 'تقييم المنصة', color: '#EF4444' },
];

export function StatsSection() {
  return (
    <section className={styles.section} id="stats-section">
      <div className="container">
        <div className={styles.grid}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.card} id={`stat-card-${i}`}>
              <div className={styles.iconWrap} style={{ '--icon-color': stat.color } as React.CSSProperties}>
                <stat.icon size={24} />
              </div>
              <div className={styles.value}>{stat.value}</div>
              <div className={styles.label}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

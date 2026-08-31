'use client';

import { BarChart3, TrendingUp, Users, BookOpen, DollarSign } from 'lucide-react';
import styles from '../admin.module.css';

const DAYS = ['السبت', 'الجمعة', 'الخميس', 'الأربعاء', 'الثلاثاء', 'الاثنين', 'الأحد'];
const DATA = [42, 68, 55, 89, 73, 94, 61];
const MAX = Math.max(...DATA);

export default function AdminAnalyticsPage() {
  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>التحليلات والإحصاءات</h1>
          <p className={styles.pageSub}>أداء المنصة خلال الفترة الماضية</p>
        </div>
      </div>

      {/* Mini stats */}
      <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { icon: Users, label: 'مستخدمون نشطون اليوم', value: '412', color: '#6C63FF', bg: 'rgba(108,99,255,0.12)' },
          { icon: BookOpen, label: 'محتوى استُهلك اليوم', value: '1,284', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
          { icon: DollarSign, label: 'إيرادات اليوم', value: '3,820 ج', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
          { icon: TrendingUp, label: 'معدل التحويل', value: '14.3%', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={styles.statCard} style={{ '--s-color': s.color, '--s-bg': s.bg } as React.CSSProperties}>
              <div className={styles.statIconWrap}><Icon size={20} /></div>
              <div className={styles.statBody}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart card */}
      <div className={styles.card} id="analytics-chart-card">
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}><BarChart3 size={17} /> نشاط المستخدمين (آخر 7 أيام)</div>
        </div>
        <div style={{ padding: '24px 28px 20px' }}>
          {/* Bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 200 }}>
            {DATA.map((val, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{val}</span>
                <div
                  style={{
                    width: '100%',
                    height: `${(val / MAX) * 160}px`,
                    background: i === 3 ? 'var(--gradient-primary)' : 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '6px 6px 0 0',
                    boxShadow: i === 3 ? 'var(--shadow-primary)' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top content */}
      <div className={styles.grid2} style={{ marginTop: 20 }}>
        <div className={styles.card}>
          <div className={styles.cardHeader}><div className={styles.cardTitle}>المواد الأكثر مشاهدة</div></div>
          <div style={{ padding: '12px 0' }}>
            {[
              { name: 'الكيمياء العضوية', views: 1842, pct: 100 },
              { name: 'الفيزياء العامة', views: 1423, pct: 77 },
              { name: 'الأحياء الجزيئية', views: 982, pct: 53 },
              { name: 'الكيمياء التحليلية', views: 741, pct: 40 },
              { name: 'الميكروبيولوجي', views: 512, pct: 28 },
            ].map((item, i) => (
              <div key={i} style={{ padding: '10px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{item.views.toLocaleString('ar-EG')} مشاهدة</span>
                </div>
                <div style={{ height: 6, background: 'var(--glass-bg)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, background: 'var(--gradient-primary)', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}><div className={styles.cardTitle}>الجامعات الأكثر نشاطاً</div></div>
          <div style={{ padding: '12px 0' }}>
            {[
              { name: 'جامعة القاهرة', students: 842, pct: 100 },
              { name: 'جامعة الإسكندرية', students: 615, pct: 73 },
              { name: 'جامعة عين شمس', students: 529, pct: 63 },
              { name: 'جامعة المنصورة', students: 387, pct: 46 },
              { name: 'جامعة طنطا', students: 254, pct: 30 },
            ].map((item, i) => (
              <div key={i} style={{ padding: '10px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{item.students} طالب</span>
                </div>
                <div style={{ height: 6, background: 'var(--glass-bg)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, background: 'linear-gradient(135deg, #F59E0B, #D97706)', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

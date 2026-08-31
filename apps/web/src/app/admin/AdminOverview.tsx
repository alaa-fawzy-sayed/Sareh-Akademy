'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  University,
  BookOpen,
  CreditCard,
  CheckCircle,
  Clock,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import styles from './admin.module.css';

interface DashboardStats {
  stats: {
    users: number;
    universities: number;
    subjects: number;
    revenue: number;
  };
  recentUsers: {
    name: string;
    email: string;
    createdAt: string;
  }[];
  recentPayments: {
    user: string;
    amount: number;
    status: string;
    createdAt: string;
  }[];
}

export default function AdminOverview() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/stats');
      if (res.data) {
        setData(res.data);
      }
    } catch {
      setError('تعذر تحميل إحصائيات لوحة التحكم. تأكد من اتصالك بالسيرفر.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statsList = data
    ? [
        {
          icon: Users,
          value: data.stats.users.toLocaleString(),
          label: 'إجمالي المستخدمين',
          color: '#6C63FF',
          bg: 'rgba(108,99,255,0.12)',
        },
        {
          icon: University,
          value: data.stats.universities.toLocaleString(),
          label: 'الجامعات المفعّلة',
          color: '#F59E0B',
          bg: 'rgba(245,158,11,0.12)',
        },
        {
          icon: BookOpen,
          value: data.stats.subjects.toLocaleString(),
          label: 'المواد الدراسية',
          color: '#10B981',
          bg: 'rgba(16,185,129,0.12)',
        },
        {
          icon: CreditCard,
          value: `${data.stats.revenue.toLocaleString()} ج`,
          label: 'إجمالي الإيرادات',
          color: '#EF4444',
          bg: 'rgba(239,68,68,0.12)',
        },
      ]
    : [];

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>لوحة التحكم 🎛️</h1>
          <p className={styles.pageSub}>
            نظرة عامة على أداء المنصة الحقيقي —{' '}
            {new Date().toLocaleDateString('ar-EG', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {error && <div className={styles.errorBanner} style={{ marginBottom: 20 }}>⚠️ {error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          جاري جلب إحصائيات المنصة الحية...
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className={styles.statsGrid} id="admin-stats-grid">
            {statsList.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className={styles.statCard}
                  id={`admin-stat-${i}`}
                  style={{ '--s-color': s.color, '--s-bg': s.bg } as React.CSSProperties}
                >
                  <div className={styles.statIconWrap}>
                    <Icon size={22} />
                  </div>
                  <div className={styles.statBody}>
                    <div className={styles.statValue}>{s.value}</div>
                    <div className={styles.statLabel}>{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main grid */}
          <div className={styles.grid2}>
            {/* Recent Users */}
            <div className={styles.card} id="admin-recent-users">
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <Users size={17} /> آخر المنضمين للمنصة
                </div>
                <Link href="/admin/users" className={`${styles.btn} ${styles.btnSecondary}`} style={{ padding: '5px 12px', fontSize: 13 }}>
                  إدارة المستخدمين <ArrowLeft size={13} />
                </Link>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>المستخدم</th>
                      <th>تاريخ الانضمام</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentUsers.length === 0 ? (
                      <tr>
                        <td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>لا توجد بيانات مستخدمين بعد</td>
                      </tr>
                    ) : (
                      data?.recentUsers.map((u, i) => (
                        <tr key={i} id={`admin-user-row-${i}`}>
                          <td>
                            <div className={styles.avatarCell}>
                              <div className={styles.tableAvatar}>{u.name[0]}</div>
                              <div className={styles.tableAvatarInfo}>
                                <span className={styles.tableAvatarName}>{u.name}</span>
                                <span className={styles.tableAvatarSub}>{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {new Date(u.createdAt).toLocaleDateString('ar-EG')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Payments */}
            <div className={styles.card} id="admin-recent-payments">
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <CreditCard size={17} /> آخر العمليات المالية
                </div>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>المشترك</th>
                      <th>المبلغ</th>
                      <th>الحالة</th>
                      <th>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentPayments.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>لا توجد عمليات دفع مسجلة بعد</td>
                      </tr>
                    ) : (
                      data?.recentPayments.map((p, i) => (
                        <tr key={i} id={`admin-payment-row-${i}`}>
                          <td>
                            <span className={styles.tableAvatarName}>{p.user}</span>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                            {p.amount} ج.م
                          </td>
                          <td>
                            <span className={`${styles.badge} ${p.status === 'VERIFIED' ? styles.badgeGreen : styles.badgeYellow}`}>
                              {p.status === 'VERIFIED' ? 'مقبول' : p.status}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {new Date(p.createdAt).toLocaleDateString('ar-EG')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

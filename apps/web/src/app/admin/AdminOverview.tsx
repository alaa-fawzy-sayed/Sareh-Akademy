'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  University,
  BookOpen,
  CreditCard,
  ArrowLeft,
  Loader2,
  Video,
  FileText,
  Award,
  Sparkles,
  Upload,
  PlayCircle,
  FolderOpen,
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
    videos?: number;
    quizzes?: number;
    files?: number;
    chapters?: number;
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
        const payload = res.data.data ?? res.data;
        setData(payload);
      }
    } catch {
      setError('تعذر تحميل إحصائيات لوحة التحكم. تأكد من تشغيل السيرفر.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const stats = data?.stats;
  const statsList = [
    {
      icon: Users,
      value: (stats?.users ?? 0).toLocaleString(),
      label: 'إجمالي المستخدمين',
      color: '#6C63FF',
      bg: 'rgba(108,99,255,0.12)',
    },
    {
      icon: Video,
      value: (stats?.videos ?? 0).toLocaleString(),
      label: 'محاضرات الفيديو',
      color: '#06b6d4',
      bg: 'rgba(6,182,212,0.12)',
    },
    {
      icon: Award,
      value: (stats?.quizzes ?? 0).toLocaleString(),
      label: 'اختبارات تفاعلية',
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.12)',
    },
    {
      icon: BookOpen,
      value: (stats?.subjects ?? 0).toLocaleString(),
      label: 'المواد الدراسية',
      color: '#10B981',
      bg: 'rgba(16,185,129,0.12)',
    },
    {
      icon: FileText,
      value: (stats?.files ?? 0).toLocaleString(),
      label: 'مذكرات وملفات PDF',
      color: '#ec4899',
      bg: 'rgba(236,72,153,0.12)',
    },
    {
      icon: CreditCard,
      value: `${(stats?.revenue ?? 0).toLocaleString()} ج`,
      label: 'إجمالي الإيرادات',
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.12)',
    },
  ];

  const recentUsers = data?.recentUsers || [];
  const recentPayments = data?.recentPayments || [];

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>لوحة التحكم وإدارة المحتوى 🎛️</h1>
          <p className={styles.pageSub}>
            نظرة عامة على أداء المنصة — تحكم كامل ومباشر في الفيديوهات والمناهج التعليمية
          </p>
        </div>

        {/* Quick Launch Button */}
        <Link
          href="/admin/content"
          className={styles.btnPrimary}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            color: '#fff',
            borderRadius: 10,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <Video size={18} />
          <span>استوديو رفع وإدارة الفيديوهات</span>
          <ArrowLeft size={16} />
        </Link>
      </div>

      {/* Content Management Master Hub Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 16,
          padding: '24px 28px',
          marginBottom: 24,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 20,
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              <Sparkles size={13} /> مركز التحكم المركزي
            </span>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>
              التحكم الأسهل في كل ما يراه الطالب
            </span>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', margin: '6px 0 12px' }}>
            إدارة ورفع الفيديوهات، المذكرات، والاختبارات التفاعلية
          </h2>

          <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, maxWidth: 780, margin: 0 }}>
            يمكنك الآن من مكان واحد رفع أي فيديو (MP4 أو رابط YouTube مباشر)، إضافة مذكرات PDF،
            التبديل بين (منشور / مسودة) بنقرة واحدة، وتحديد هل المحتوى (مجاني تجريبي أو يتطلب اشتراك).
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              marginTop: 18,
            }}
          >
            <Link
              href="/admin/content"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                background: '#6366f1',
                color: '#fff',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              <Upload size={16} /> رفع وإدارة المحتوى الآن
            </Link>

            <Link
              href="/admin/subjects"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#e2e8f0',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <BookOpen size={16} /> استعراض قائمة المواد ({stats?.subjects ?? 0})
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner} style={{ marginBottom: 20 }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <Loader2 className="animate-spin" size={24} style={{ color: 'var(--primary)' }} />
          <span>جاري جلب إحصائيات المنصة الحية...</span>
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
                <Link
                  href="/admin/users"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  style={{ padding: '5px 12px', fontSize: 13 }}
                >
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
                    {recentUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={2}
                          style={{
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            padding: '16px',
                          }}
                        >
                          لا توجد بيانات مستخدمين بعد
                        </td>
                      </tr>
                    ) : (
                      recentUsers.map((u, i) => (
                        <tr key={i} id={`admin-user-row-${i}`}>
                          <td>
                            <div className={styles.avatarCell}>
                              <div className={styles.tableAvatar}>{u.name?.[0] || 'U'}</div>
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
                    {recentPayments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            padding: '16px',
                          }}
                        >
                          لا توجد عمليات دفع مسجلة بعد
                        </td>
                      </tr>
                    ) : (
                      recentPayments.map((p, i) => (
                        <tr key={i} id={`admin-payment-row-${i}`}>
                          <td>
                            <span className={styles.tableAvatarName}>{p.user}</span>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                            {p.amount} ج.م
                          </td>
                          <td>
                            <span
                              className={`${styles.badge} ${
                                p.status === 'VERIFIED'
                                  ? styles.badgeGreen
                                  : styles.badgeYellow
                              }`}
                            >
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

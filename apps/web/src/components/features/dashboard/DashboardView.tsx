'use client';

import { BookOpen, Clock, Trophy, TrendingUp, Play, FileText, ChevronLeft, HelpCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import styles from './DashboardView.module.css';

const SUBJECT_COLORS = [
  '#6C63FF', '#F59E0B', '#10B981', '#EF4444',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6',
  '#F97316', '#06B6D4', '#84CC16', '#A855F7',
];

interface SubjectData {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string | null;
  slug: string;
  isFree: boolean;
  semester?: {
    nameAr: string;
    academicYear?: {
      nameAr: string;
      college?: {
        nameAr: string;
        university?: {
          nameAr: string;
        };
      };
    };
  };
}

export function DashboardView() {
  const { user } = useAuthStore();
  const [mySubjects, setMySubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMySubjects = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/subjects/my');
      // الـ API يرجع: { success, data: { data: [...] } } أو { data: [...] } أو [...]
      const payload = res.data?.data ?? res.data;
      const arr = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
      setMySubjects(arr);
    } catch {
      setError('فشل في تحميل المواد الدراسية الخاصة بك.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySubjects();
  }, []);

  const stats = [
    { icon: BookOpen, value: (mySubjects?.length ?? 0).toString(), label: 'مادة دراسية مشترك بها', color: '#6C63FF' },
    { icon: Clock, value: 'جديد', label: 'حالة التعلم الحالية', color: '#F59E0B' },
    { icon: Trophy, value: 'مستمر', label: 'المستوى الأكاديمي', color: '#10B981' },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    if (h < 18) return 'مساء الخير';
    return 'مساء النور';
  };

  return (
    <main className={styles.main} id="dashboard-main">
      <div className="container">
        {/* Greeting */}
        <div className={styles.greeting} id="dashboard-greeting">
          <h1 className={styles.greetTitle}>
            {greeting()}، <span className="gradient-text">{user?.firstName ?? 'طالب'}</span> 👋
          </h1>
          <p className={styles.greetSub}>أهلاً بك في لوحة متابعة المقررات والمواد الخاصة بك</p>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          {stats.map((s, i) => (
            <div key={i} className={styles.statCard} id={`dash-stat-${i}`} style={{ '--s-color': s.color } as React.CSSProperties}>
              <div className={styles.statIcon}><s.icon size={20} /></div>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className={styles.grid2} style={{ gridTemplateColumns: '1fr' }}>
          {/* My Subjects */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>موادي الدراسية النشطة</h2>
              <Link href="/universities" className={styles.seeAll} id="dash-browse-universities" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', background: 'var(--gradient-accent)',
                borderRadius: 8, color: '#fff', fontSize: 13, textDecoration: 'none'
              }}>
                تصفح الكليات والاشتراك بمادة جديدة <ChevronLeft size={14} />
              </Link>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>جاري تحميل موادك الدراسية الحالية...</div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--error)' }}>{error}</div>
            ) : mySubjects.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '50px 20px',
                border: '2px dashed var(--glass-border)',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.02)'
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>لا توجد مواد مشترك بها حالياً</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
                  ابدأ بتصفح الجامعات المصرية، واختر كليتك ثم اشترك في المواد الدراسية المتاحة لتظهر لك هنا.
                </p>
                <Link href="/universities" style={{
                  padding: '10px 24px', background: 'var(--gradient-accent)',
                  borderRadius: 8, color: '#fff', fontSize: 14, textDecoration: 'none', fontWeight: 600
                }}>
                  تصفح الجامعات والكليات الآن
                </Link>
              </div>
            ) : (
              <div className={styles.subjectsList}>
                {mySubjects.map((s, i) => {
                  const color = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
                  const collegeName = s.semester?.academicYear?.college?.nameAr || 'كلية الصيدلة';
                  const uniName = s.semester?.academicYear?.college?.university?.nameAr || 'الجامعة';
                  return (
                    <Link href={`/subjects/${s.id}`} key={s.id} className={styles.subjectCard} id={`dash-subject-${i}`} style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className={styles.subjectInfo}>
                        <div className={styles.subjectDot} style={{ background: color }} />
                        <div>
                          <div className={styles.subjectName}>{s.nameAr}</div>
                          <div className={styles.subjectUni}>{collegeName} - {uniName}</div>
                        </div>
                      </div>
                      <ChevronLeft size={16} style={{ color: 'var(--text-muted)' }} />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

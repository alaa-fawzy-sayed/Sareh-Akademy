'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Trophy,
  Play,
  CheckCircle2,
  ChevronLeft,
  Bell,
  Ticket,
  GraduationCap,
  Loader2,
  AlertCircle,
  Video,
  ExternalLink,
  Sparkles,
  MessageSquare,
  Check,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api/client';
import styles from './DashboardView.module.css';

const SUBJECT_COLORS = [
  '#6C63FF', '#F59E0B', '#10B981', '#EF4444',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6',
  '#F97316', '#06B6D4', '#84CC16', '#A855F7',
];

type TabType = 'courses' | 'history' | 'announcements' | 'notifications' | 'voucher' | 'instructors';

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
        slug: string;
        university?: {
          nameAr: string;
          slug: string;
        };
      };
    };
  };
}

interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'URGENT';
  targetAudience: string;
  createdAt: string;
}

interface WatchHistoryItem {
  id: string;
  progressPercent: number;
  lastPositionSeconds: number;
  updatedAt: string;
  content?: {
    id: string;
    titleAr: string;
    type: string;
    chapter?: {
      titleAr: string;
      subject?: {
        id: string;
        nameAr: string;
        slug: string;
      };
    };
  };
}

interface TeacherData {
  id: string;
  title?: string;
  bio?: string;
  user?: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  subjects?: {
    subject: {
      id: string;
      nameAr: string;
    };
  }[];
}

export function DashboardView() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('courses');

  // Subjects state
  const [mySubjects, setMySubjects] = useState<SubjectData[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [subjectsError, setSubjectsError] = useState('');

  // Watch History state
  const [historyItems, setHistoryItems] = useState<WatchHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  // Teachers state
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Voucher redemption state
  const [voucherCode, setVoucherCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState('');
  const [redeemError, setRedeemError] = useState('');

  // ── 1. Fetch Subjects ──
  const fetchMySubjects = async () => {
    setLoadingSubjects(true);
    setSubjectsError('');
    try {
      const res = await api.get('/subjects/my');
      const payload = res.data?.data ?? res.data;
      const arr = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : [];
      setMySubjects(arr);
    } catch {
      setSubjectsError('تعذر تحميل المواد الدراسية الخاصة بك.');
    } finally {
      setLoadingSubjects(false);
    }
  };

  // ── 2. Fetch Watch History ──
  const fetchWatchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/progress/history');
      const payload = res.data?.data ?? res.data;
      const arr = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : [];
      setHistoryItems(arr);
    } catch {
      console.error('Failed to load watch history');
    } finally {
      setLoadingHistory(false);
    }
  };

  // ── 3. Fetch Announcements ──
  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const res = await api.get('/announcements?isPublished=true&limit=10');
      const payload = res.data?.data ?? res.data;
      const arr = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : [];
      setAnnouncements(arr);
    } catch {
      console.error('Failed to load announcements');
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  // ── 4. Fetch Teachers ──
  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const res = await api.get('/teachers?isActive=true&limit=20');
      const payload = res.data?.data ?? res.data;
      const arr = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : [];
      setTeachers(arr);
    } catch {
      console.error('Failed to load teachers');
    } finally {
      setLoadingTeachers(false);
    }
  };

  // ── 5. Fetch Notifications ──
  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const [res, countRes] = await Promise.all([
        api.get('/notifications?limit=25'),
        api.get('/notifications/unread-count'),
      ]);
      const payload = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
      setNotifications(Array.isArray(payload) ? payload : []);
      setUnreadNotifsCount(countRes.data?.count ?? countRes.data?.data?.count ?? 0);
    } catch {
      // silent
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadNotifsCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifsCount(0);
    } catch {}
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as TabType;
      if (
        tabParam &&
        ['courses', 'history', 'announcements', 'notifications', 'voucher', 'instructors'].includes(
          tabParam
        )
      ) {
        setActiveTab(tabParam);
      }
    }
    fetchMySubjects();
    fetchAnnouncements();
    fetchWatchHistory();
    fetchTeachers();
    fetchNotifications();

    const interval = setInterval(() => {
      api
        .get('/notifications/unread-count')
        .then((r) => setUnreadNotifsCount(r.data?.count ?? r.data?.data?.count ?? 0))
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // ── 5. Redeem Voucher Code ──
  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    setRedeeming(true);
    setRedeemSuccess('');
    setRedeemError('');

    try {
      const res = await api.post('/access/activate-code', {
        code: voucherCode.trim(),
      });
      const data = res.data?.data ?? res.data;
      setRedeemSuccess(data?.message || 'تم تفعيل كود الاشتراك بنجاح! تم فتح المادة في حسابك.');
      setVoucherCode('');
      // Reload subjects
      fetchMySubjects();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'كود الاشتراك غير صحيح أو تم استخدامه مسبقاً أو منتهي الصلاحية.';
      setRedeemError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setRedeeming(false);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    if (h < 18) return 'مساء الخير';
    return 'مساء النور';
  };

  const stats = [
    {
      icon: BookOpen,
      value: (mySubjects?.length ?? 0).toString(),
      label: 'مادة دراسية نشطة',
      color: '#6C63FF',
    },
    {
      icon: Clock,
      value: (historyItems?.length ?? 0).toString(),
      label: 'محاضرات قيد المتابعة',
      color: '#F59E0B',
    },
    {
      icon: unreadNotifsCount > 0 ? MessageSquare : Bell,
      value: unreadNotifsCount > 0 ? `${unreadNotifsCount} جديد` : (notifications?.length ?? announcements?.length ?? 0).toString(),
      label: unreadNotifsCount > 0 ? 'إشعارات وردود غير مقروءة' : 'الإعلانات والرسائل',
      color: unreadNotifsCount > 0 ? '#EF4444' : '#3B82F6',
    },
    {
      icon: Trophy,
      value: 'نشط',
      label: 'الحالة الأكاديمية',
      color: '#10B981',
    },
  ];

  return (
    <main className={styles.main} id="dashboard-main">
      <div className="container">
        {/* Greeting */}
        <div className={styles.greeting} id="dashboard-greeting">
          <h1 className={styles.greetTitle}>
            {greeting()}، <span className="gradient-text">{user?.firstName ?? 'طالب'}</span> 👋
          </h1>
          <p className={styles.greetSub}>
            لوحتك الأكاديمية لمتابعة المواد، المحاضرات، الإعلانات الرسمية، وتفعيل الاشتراكات
          </p>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {stats.map((s, i) => (
            <div
              key={i}
              className={styles.statCard}
              id={`dash-stat-${i}`}
              style={{ '--s-color': s.color } as React.CSSProperties}
            >
              <div className={styles.statIcon}>
                <s.icon size={20} />
              </div>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs Navigation */}
        <div className={styles.tabsNav} id="dashboard-tabs">
          <button
            className={`${styles.tabBtn} ${activeTab === 'courses' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('courses')}
            id="tab-btn-courses"
          >
            <BookOpen size={16} />
            <span>موادي الدراسية</span>
            <span className={styles.tabBadge}>{mySubjects.length}</span>
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('history')}
            id="tab-btn-history"
          >
            <Play size={16} />
            <span>سجل المشاهدة والتقدم</span>
            {historyItems.length > 0 && <span className={styles.tabBadge}>{historyItems.length}</span>}
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'announcements' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('announcements')}
            id="tab-btn-announcements"
          >
            <Bell size={16} />
            <span>إعلانات الكلية والمنصة</span>
            {announcements.length > 0 && (
              <span className={styles.tabBadge}>{announcements.length}</span>
            )}
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'notifications' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('notifications')}
            id="tab-btn-notifications"
          >
            <MessageSquare size={16} />
            <span>الإشعارات والرسائل</span>
            {unreadNotifsCount > 0 ? (
              <span className={`${styles.tabBadge} ${styles.tabBadgeRed}`}>
                {unreadNotifsCount} جديد
              </span>
            ) : notifications.length > 0 ? (
              <span className={styles.tabBadge}>{notifications.length}</span>
            ) : null}
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'voucher' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('voucher')}
            id="tab-btn-voucher"
          >
            <Ticket size={16} />
            <span>تفعيل كود اشتراك</span>
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'instructors' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('instructors')}
            id="tab-btn-instructors"
          >
            <GraduationCap size={16} />
            <span>هيئة التدريس</span>
          </button>
        </div>

        {/* ═════════════════════════════════════════════════
            TAB 1: My Courses
        ═════════════════════════════════════════════════ */}
        {activeTab === 'courses' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>المقررات المسجلة بحسابك</h2>
              <Link
                href="/universities"
                className={styles.seeAll}
                id="dash-browse-universities"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  background: 'var(--gradient-accent)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                تصفح الكليات والاشتراك بمادة جديدة <ChevronLeft size={14} />
              </Link>
            </div>

            {loadingSubjects ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                <span>جاري تحميل مقرراتك الدراسية...</span>
              </div>
            ) : subjectsError ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--error)' }}>
                {subjectsError}
              </div>
            ) : mySubjects.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '50px 20px',
                  border: '2px dashed var(--glass-border)',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div style={{ fontSize: 44, marginBottom: 12 }}>📚</div>
                <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>
                  لا توجد مواد نشطة بحسابك حالياً
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, maxWidth: 480, margin: '0 auto 20px' }}>
                  يمكنك تصفح كليات وجامعات أسيوط والاشتراك بمقرراتك، أو تفعيل كود الاشتراك المطبوع من السنتر أو المكتبة.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link
                    href="/universities"
                    style={{
                      padding: '10px 22px',
                      background: 'var(--gradient-accent)',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 14,
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    تصفح الجامعات والكليات
                  </Link>
                  <button
                    onClick={() => setActiveTab('voucher')}
                    style={{
                      padding: '10px 22px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    تفعيل كود اشتراك
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.subjectsList}>
                {mySubjects.map((s, i) => {
                  const color = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
                  const collegeName = s.semester?.academicYear?.college?.nameAr || 'كلية الصيدلة';
                  const uniName = s.semester?.academicYear?.college?.university?.nameAr || 'الجامعة';
                  return (
                    <Link
                      href={`/subjects/${s.slug || s.id}`}
                      key={s.id}
                      className={styles.subjectCard}
                      id={`dash-subject-${i}`}
                      style={{
                        textDecoration: 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div className={styles.subjectInfo}>
                        <div className={styles.subjectDot} style={{ background: color }} />
                        <div>
                          <div className={styles.subjectName}>{s.nameAr}</div>
                          <div className={styles.subjectUni}>
                            {collegeName} — {uniName}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            fontSize: 12,
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            fontWeight: 600,
                          }}
                        >
                          متابعة الدراسة
                        </span>
                        <ChevronLeft size={16} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════
            TAB 2: Continue Watching / Watch History
        ═════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>آخر المحاضرات والفيديوهات التي شاهدتها</h2>
            </div>

            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                <span>جاري استرجاع سجل المشاهدة...</span>
              </div>
            ) : historyItems.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '50px 20px',
                  border: '2px dashed var(--glass-border)',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div style={{ fontSize: 44, marginBottom: 12 }}>🎬</div>
                <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>
                  لم تبدأ مشاهدة أي فيديوهات بعد
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
                  عند تشغيل أي محاضرة أو فيديو، سيتم تسجيل تقدمك ونقطة التوقف هنا لتستأنف المشاهدة في أي وقت.
                </p>
                <button
                  onClick={() => setActiveTab('courses')}
                  style={{
                    padding: '10px 22px',
                    background: 'var(--gradient-accent)',
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  اختر مادة وابدأ المشاهدة
                </button>
              </div>
            ) : (
              <div className={styles.contentList}>
                {historyItems.map((item) => {
                  const subjectSlug = item.content?.chapter?.subject?.slug || item.content?.chapter?.subject?.id;
                  return (
                    <div key={item.id} className={styles.contentCard}>
                      <div className={styles.contentIcon}>
                        <Video size={18} />
                      </div>
                      <div className={styles.contentInfo}>
                        <div className={styles.contentTitle}>
                          {item.content?.titleAr || 'محاضرة تعليمية'}
                        </div>
                        <div className={styles.contentMeta}>
                          {item.content?.chapter?.subject?.nameAr} — {item.content?.chapter?.titleAr}
                        </div>
                        <div className={styles.progressWrap} style={{ marginTop: 6, maxWidth: 260 }}>
                          <div className={styles.progressBar}>
                            <div
                              className={styles.progressFill}
                              style={{
                                width: `${item.progressPercent || 0}%`,
                                background: '#10b981',
                              }}
                            />
                          </div>
                          <span className={styles.progressPct}>{item.progressPercent || 0}%</span>
                        </div>
                      </div>

                      {subjectSlug && (
                        <Link
                          href={`/subjects/${subjectSlug}${item.content?.id ? `?lesson=${item.content.id}` : ''}`}
                          className={styles.continueBtn}
                          style={{ textDecoration: 'none' }}
                        >
                          استئناف المشاهدة
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════
            TAB 3: Academic Announcements
        ═════════════════════════════════════════════════ */}
        {activeTab === 'announcements' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>الإعلانات والتنبيهات الرسمية</h2>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                تحديثات مباشرة من هيئة التدريس وإدارة المنصة
              </span>
            </div>

            {loadingAnnouncements ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                <span>جاري تحميل الإعلانات...</span>
              </div>
            ) : announcements.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '50px 20px',
                  border: '2px dashed var(--glass-border)',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div style={{ fontSize: 44, marginBottom: 12 }}>📢</div>
                <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>
                  لا توجد إعلانات جديدة حالياً
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
                  سيتم إخطارك هنا بأي تنبيهات تتعلق بالجداول الدراسية أو مواعيد الامتحانات فور نشرها.
                </p>
              </div>
            ) : (
              <div className={styles.announcementsList}>
                {announcements.map((a) => {
                  const tagClass =
                    a.type === 'WARNING' || a.type === 'URGENT'
                      ? styles.announcementTagWarning
                      : a.type === 'SUCCESS'
                      ? styles.announcementTagSuccess
                      : styles.announcementTagInfo;
                  const dateStr = a.createdAt
                    ? new Date(a.createdAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '';
                  return (
                    <div key={a.id} className={styles.announcementCard}>
                      <div className={styles.announcementTop}>
                        <span className={`${styles.announcementTag} ${tagClass}`}>
                          {a.type === 'URGENT'
                            ? 'تنبيه عاجل'
                            : a.type === 'WARNING'
                            ? 'هام جداً'
                            : a.type === 'SUCCESS'
                            ? 'خبر سار'
                            : 'إعلان دراسي'}
                        </span>
                        <span className={styles.announcementDate}>{dateStr}</span>
                      </div>
                      <h3 className={styles.announcementTitle}>{a.title}</h3>
                      <p className={styles.announcementBody}>{a.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════
            TAB: In-App Notifications & Admin Replies
        ═════════════════════════════════════════════════ */}
        {activeTab === 'notifications' && (
          <div className={styles.section} id="tab-panel-notifications">
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>صندوق الإشعارات والرسائل الواردة</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  تصلك هنا ردود إدارة المنصة على استفساراتك، وتأكيدات المدفوعات، والتنبيهات المباشرة.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <Link
                  href="/contact"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'var(--gradient-accent)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <MessageSquare size={14} /> إرسال استفسار للمشرف
                </Link>
                {unreadNotifsCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: 'rgba(108, 99, 255, 0.12)',
                      border: '1px solid rgba(108, 99, 255, 0.3)',
                      color: 'var(--primary-light)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    تعليم الكل كمقروء
                  </button>
                )}
              </div>
            </div>

            {/* Filter Bar */}
            <div className={styles.notifActionsBar}>
              <div className={styles.notifFilterBtns}>
                <button
                  className={`${styles.filterBtn} ${notifFilter === 'all' ? styles.filterBtnActive : ''}`}
                  onClick={() => setNotifFilter('all')}
                >
                  جميع الإشعارات ({notifications.length})
                </button>
                <button
                  className={`${styles.filterBtn} ${notifFilter === 'unread' ? styles.filterBtnActive : ''}`}
                  onClick={() => setNotifFilter('unread')}
                >
                  غير المقروءة فقط ({unreadNotifsCount})
                </button>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                يتم تحديث الإشعارات تلقائياً داخل المنصة
              </span>
            </div>

            {/* List */}
            {loadingNotifications ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                <span>جاري تحميل الإشعارات...</span>
              </div>
            ) : (() => {
              const filtered = notifFilter === 'unread'
                ? notifications.filter((n) => !n.isRead)
                : notifications;

              if (filtered.length === 0) {
                return (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '50px 20px',
                      border: '2px dashed var(--glass-border)',
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div style={{ fontSize: 44, marginBottom: 12 }}>📬</div>
                    <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>
                      {notifFilter === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد أي إشعارات أو رسائل واردة حالياً'}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 16px' }}>
                      عندما يقوم المشرف بالرد على رسالتك أو تأكيد اشتراكك ستصلك رسالة هنا فوراً.
                    </p>
                    <Link
                      href="/contact"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '10px 20px',
                        background: 'var(--primary)',
                        color: '#fff',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <MessageSquare size={15} /> التواصل مع إدارة المنصة
                    </Link>
                  </div>
                );
              }

              const notifTypeColors: Record<string, string> = {
                SYSTEM: '#6C63FF',
                PAYMENT: '#10B981',
                PAYMENT_CONFIRMED: '#10B981',
                ANNOUNCEMENT: '#3B82F6',
                CONTENT: '#F59E0B',
                PROMOTION: '#EC4899',
              };

              return (
                <div className={styles.notifsTabWrap} style={{ marginTop: 16 }}>
                  {filtered.map((item) => {
                    const color = notifTypeColors[item.type] || '#6C63FF';
                    return (
                      <div
                        key={item.id}
                        className={`${styles.notifCard} ${!item.isRead ? styles.notifCardUnread : ''}`}
                        onClick={() => !item.isRead && markNotificationRead(item.id)}
                        style={{ cursor: item.isRead ? 'default' : 'pointer' }}
                      >
                        <div
                          className={styles.notifCardDot}
                          style={{ background: color }}
                        />
                        <div className={styles.notifCardContent}>
                          <div className={styles.notifCardTitle}>
                            <span>{item.title}</span>
                            {!item.isRead && (
                              <span
                                style={{
                                  background: '#ef4444',
                                  color: '#fff',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 9999,
                                }}
                              >
                                غير مقروء
                              </span>
                            )}
                            {item.metadata?.replyable === false && (
                              <span
                                style={{
                                  background: 'rgba(245, 158, 11, 0.1)',
                                  border: '1px solid rgba(245, 158, 11, 0.2)',
                                  color: '#f59e0b',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                }}
                              >
                                🛡️ رد رسمي من إدارة المنصة
                              </span>
                            )}
                          </div>
                          <div className={styles.notifCardBody}>{item.body}</div>
                          <div className={styles.notifCardFooter}>
                            <span>
                              {new Date(item.createdAt).toLocaleDateString('ar-EG', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {!item.isRead ? (
                              <span style={{ color: 'var(--primary-light)', fontSize: 12, fontWeight: 600 }}>
                                انقر للتعليم كمقروء
                              </span>
                            ) : (
                              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Check size={14} /> تمت القراءة
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ═════════════════════════════════════════════════
            TAB 4: Redeem Access Code / Voucher
        ═════════════════════════════════════════════════ */}
        {activeTab === 'voucher' && (
          <div className={styles.section}>
            <div className={styles.redeemCard}>
              <div className={styles.redeemHeader}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🎟️</div>
                <h2 className={styles.redeemTitle}>تفعيل كود اشتراك مسبق الدفع</h2>
                <p className={styles.redeemSub}>
                  إذا قمت بشراء كود اشتراك من أحد السناتر المعتمدة أو المكتبات، أدخل الكود بالأسفل لتفعيل المقرر فورياً بحسابك.
                </p>
              </div>

              <form onSubmit={handleRedeemCode}>
                <div className={styles.redeemForm}>
                  <input
                    type="text"
                    className={styles.redeemInput}
                    placeholder="مثال: TP-ASS-PHARM-2026"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    required
                    id="voucher-code-input"
                  />
                  <button
                    type="submit"
                    className={styles.redeemBtn}
                    disabled={redeeming}
                    id="voucher-submit-btn"
                  >
                    {redeeming ? (
                      <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    تفعيل الكود
                  </button>
                </div>

                {redeemSuccess && (
                  <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
                    <CheckCircle2 size={18} />
                    <span>{redeemSuccess}</span>
                  </div>
                )}

                {redeemError && (
                  <div className={`${styles.alertBox} ${styles.alertError}`}>
                    <AlertCircle size={18} />
                    <span>{redeemError}</span>
                  </div>
                )}
              </form>

              <div
                style={{
                  marginTop: 24,
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 10,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                }}
              >
                💡 <strong>ملاحظة:</strong> كل كود مخصص لتفعيل مقرر أو حزمة مقررات محددة لمرة واحدة فقط ويرتبط بحسابك مباشرة. في حال واجهت أي مشكلة يمكنك التواصل مع الدعم الفني.
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════
            TAB 5: Instructors & Faculty
        ═════════════════════════════════════════════════ */}
        {activeTab === 'instructors' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>هيئة التدريس والمحاضرون</h2>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                نخبة من أساتذة ومدرسي الجامعات المعتمدة
              </span>
            </div>

            {loadingTeachers ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                <span>جاري تحميل بيانات المحاضرين...</span>
              </div>
            ) : teachers.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '50px 20px',
                  border: '2px dashed var(--glass-border)',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div style={{ fontSize: 44, marginBottom: 12 }}>👨‍🏫</div>
                <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>
                  جاري تسجيل واعتماد ملفات المحاضرين
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
                  سيتم عرض نبذة عن كافة أعضاء هيئة التدريس والمقررات التي يقومون بتدريسها قريباً.
                </p>
              </div>
            ) : (
              <div className={styles.teachersGrid}>
                {teachers.map((t) => {
                  const name = t.user ? `${t.user.firstName} ${t.user.lastName}` : 'دكتور المقرر';
                  const initials = t.user?.firstName ? t.user.firstName[0] : 'د';
                  return (
                    <div key={t.id} className={styles.teacherCard}>
                      <div className={styles.teacherAvatar}>{initials}</div>
                      <div className={styles.teacherInfo}>
                        <h4 className={styles.teacherName}>{name}</h4>
                        <div className={styles.teacherTitle}>{t.title || 'أستاذ المادة'}</div>
                        <p className={styles.teacherBio}>
                          {t.bio || 'مدرس ومحاضر معتمد متخصص في المقررات الطبية والصيدلانية.'}
                        </p>
                        {t.subjects && t.subjects.length > 0 && (
                          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {t.subjects.slice(0, 2).map((s) => (
                              <span
                                key={s.subject.id}
                                style={{
                                  fontSize: 11,
                                  background: 'rgba(99, 102, 241, 0.1)',
                                  color: '#818cf8',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                }}
                              >
                                {s.subject.nameAr}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

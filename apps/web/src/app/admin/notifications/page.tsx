'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Users,
  User,
  CheckCircle,
  Search,
  AlertCircle,
  Megaphone,
  Info,
  Loader2,
  Clock,
  ShieldAlert,
  Shield,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import styles from '../admin.module.css';

interface SearchedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  type: string;
  metadata?: any;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface OptionItem {
  id: string;
  nameAr: string;
  university?: { nameAr: string };
}

type TargetType = 'all' | 'admins' | 'college' | 'subject' | 'user';

export default function AdminNotificationsPage() {
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notifType, setNotifType] = useState<string>('info');

  // Specific user search state
  const [userQuery, setUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // College & Subject targeting state
  const [colleges, setColleges] = useState<OptionItem[]>([]);
  const [subjects, setSubjects] = useState<OptionItem[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Status state
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch sent notification history
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/admin/notifications/history');
      const data = res.data?.data ?? res.data;
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch colleges and subjects for targeting
  useEffect(() => {
    fetchHistory();
    const loadTargetOptions = async () => {
      setLoadingOptions(true);
      try {
        const [collegesRes, subjectsRes] = await Promise.all([
          api.get('/colleges'),
          api.get('/subjects?limit=200'),
        ]);

        const colData = collegesRes.data?.data ?? collegesRes.data ?? [];
        setColleges(Array.isArray(colData) ? colData : []);

        const subData = subjectsRes.data?.data ?? subjectsRes.data ?? [];
        setSubjects(Array.isArray(subData) ? subData : []);
      } catch {
        // ignore
      } finally {
        setLoadingOptions(false);
      }
    };
    loadTargetOptions();
  }, []);

  // Search users when query changes
  useEffect(() => {
    if (targetType !== 'user' || userQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await api.get(`/admin/users/search?q=${encodeURIComponent(userQuery.trim())}`);
        const data = res.data?.data ?? res.data;
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userQuery, targetType]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    if (targetType === 'user' && !selectedUser) {
      setErrorMessage('يرجى اختيار المستخدم المراد مراسلته');
      return;
    }

    if (targetType === 'college' && !selectedCollegeId) {
      setErrorMessage('يرجى اختيار الكلية المستهدفة');
      return;
    }

    if (targetType === 'subject' && !selectedSubjectId) {
      setErrorMessage('يرجى اختيار المادة الدراسية المستهدفة');
      return;
    }

    setSending(true);
    setErrorMessage(null);
    setSentMessage(null);

    try {
      const res = await api.post('/admin/notifications/send', {
        targetType,
        userId: targetType === 'user' ? selectedUser?.id : undefined,
        collegeId: targetType === 'college' ? selectedCollegeId : undefined,
        subjectId: targetType === 'subject' ? selectedSubjectId : undefined,
        title: title.trim(),
        body: body.trim(),
        type: notifType === 'warning' ? 'SYSTEM' : notifType === 'promo' ? 'PROMO' : 'ANNOUNCEMENT',
      });

      const msg = res.data?.message || 'تم إرسال الرسالة بنجاح!';
      setSentMessage(msg);
      setTitle('');
      setBody('');
      setSelectedUser(null);
      setUserQuery('');
      fetchHistory();

      setTimeout(() => setSentMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'فشل إرسال الإشعار. يرجى المحاولة لاحقاً.');
    } finally {
      setSending(false);
    }
  };

  const targetsList: { id: TargetType; label: string; icon: typeof Users; desc: string }[] = [
    { id: 'all', label: 'جميع الطلاب (Broadcast)', icon: Users, desc: 'إشعار عام يصل لجميع الطلاب المسجلين' },
    { id: 'admins', label: 'المشرفون والمدراء', icon: Shield, desc: 'تنبيه إداري خاص بطاقم العمل والمشرفين' },
    { id: 'college', label: 'طلاب كلية معينة', icon: GraduationCap, desc: 'استهداف طلاب كلية محددة' },
    { id: 'subject', label: 'مشتركو مادة معينة', icon: BookOpen, desc: 'استهداف طلاب مسجلين في كورس محدد' },
    { id: 'user', label: 'طالب محدد', icon: User, desc: 'رسالة خاصة لحساب طالب بعينه' },
  ];

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>الإشعارات والتواصل الإداري</h1>
          <p className={styles.pageSub}>
            إرسال إشعارات وتنبيهات مستهدفة (للجميع، للمشرفين، لكلية معينة، لمادة معينة، أو لطالب محدد)
          </p>
        </div>
      </div>

      {sentMessage && (
        <div style={{ padding: '12px 16px', marginBottom: 20, background: 'rgba(16,185,129,0.12)', border: '1px solid var(--success)', borderRadius: 8, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={18} /> {sentMessage}
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '12px 16px', marginBottom: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid var(--error)', borderRadius: 8, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={18} /> {errorMessage}
        </div>
      )}

      <div className={styles.grid2}>
        {/* Send form */}
        <div>
          <div className={styles.card} id="notif-send-card">
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}><Send size={17} /> إرسال إشعار / رسالة إدارية</div>
            </div>
            <form onSubmit={handleSend}>
              <div className={styles.modalBody} style={{ padding: '20px' }}>
                
                {/* Targeting Tabs */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>تحديد الفئة المستهدفة للإشعار</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                    {targetsList.map((t) => {
                      const Icon = t.icon;
                      const isActive = targetType === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          className={`${styles.btn} ${isActive ? styles.btnPrimary : styles.btnSecondary}`}
                          onClick={() => {
                            setTargetType(t.id);
                            setSelectedUser(null);
                          }}
                          style={{
                            fontSize: 12,
                            padding: '8px 6px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                            textAlign: 'center',
                          }}
                        >
                          <Icon size={16} />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* College selection if targetType === 'college' */}
                {targetType === 'college' && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>اختر الكلية المستهدفة</label>
                    <select
                      className={styles.formSelect}
                      value={selectedCollegeId}
                      onChange={(e) => setSelectedCollegeId(e.target.value)}
                      required
                      id="target-college-select"
                    >
                      <option value="">-- اختر كلية الصيدلة أو الكلية المطلوبة --</option>
                      {colleges.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.nameAr} {col.university ? `(${col.university.nameAr})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subject selection if targetType === 'subject' */}
                {targetType === 'subject' && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>اختر المادة / الكورس الدراسي</label>
                    <select
                      className={styles.formSelect}
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      required
                      id="target-subject-select"
                    >
                      <option value="">-- اختر المادة المطلوب إشعار مشتركيها --</option>
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Specific User Search if targetType === 'user' */}
                {targetType === 'user' && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>ابحث عن الطالب بالاسم أو البريد أو الهاتف</label>
                    <div className={styles.searchBox} style={{ position: 'relative' }}>
                      <Search size={15} style={{ color: 'var(--text-muted)' }} />
                      <input
                        className={styles.searchInput}
                        placeholder="اكتب اسم أو إيميل الطالب..."
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        id="notif-user-search-input"
                      />
                      {searchingUsers && <Loader2 size={15} className="animate-spin" style={{ marginLeft: 8 }} />}
                    </div>

                    {selectedUser && (
                      <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(108,99,255,0.1)', border: '1px solid var(--primary)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <div>
                          <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>
                          <span style={{ color: 'var(--text-muted)', marginRight: 8, fontSize: 12 }}>({selectedUser.email})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedUser(null)}
                          style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: 12 }}
                        >
                          تغيير
                        </button>
                      </div>
                    )}

                    {!selectedUser && searchResults.length > 0 && (
                      <div style={{ marginTop: 6, background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 6, maxHeight: 150, overflowY: 'auto' }}>
                        {searchResults.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => { setSelectedUser(u); setUserQuery(''); setSearchResults([]); }}
                            style={{ padding: '8px 12px', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', fontSize: 13 }}
                            className={styles.dropdownItem}
                          >
                            <strong>{u.firstName} {u.lastName}</strong> - <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.email}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Notification Type */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>نوع الرسالة</label>
                  <select
                    className={styles.formSelect}
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value)}
                    id="notif-type-select"
                  >
                    <option value="info">معلومة عامة</option>
                    <option value="promo">عرض / خصم دراسي</option>
                    <option value="warning">تنبيه إداري رسمي</option>
                    <option value="system">إشعار نظام</option>
                  </select>
                </div>

                {/* Title */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>عنوان الرسالة</label>
                  <input
                    className={styles.formInput}
                    placeholder="مثال: تنبيه هام بخصوص موعد بدء المحاضرات"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    id="notif-title-input"
                  />
                </div>

                {/* Body */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>نص الرسالة</label>
                  <textarea
                    className={styles.formTextarea}
                    rows={4}
                    placeholder="اكتب تفاصيل الرسالة هنا..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    id="notif-body-input"
                  />
                </div>

                <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                  <span>
                    هذه الرسالة تصل كإشعار رسمي بحساب المستلم داخل المنصة، ولا يمكن الرد عليها مباشرة. للتواصل والاستفسارات يستخدم الطالب قسم &quot;تواصل معنا&quot;.
                  </span>
                </div>

                <button
                  type="submit"
                  className={styles.btnPrimary}
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={sending}
                  id="notif-submit-btn"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {sending ? 'جاري الإرسال...' : 'إرسال الإشعار الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* History / Live Log */}
        <div>
          <div className={styles.card} id="notif-history-card">
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}><Clock size={17} /> سجل الإشعارات الإدارية المرسلة</div>
            </div>
            <div style={{ padding: 16 }}>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: 30 }}>
                  <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} />
                </div>
              ) : history.length === 0 ? (
                <div className={styles.emptyState}>
                  <Bell size={28} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>لا توجد إشعارات سابقة</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {history.map((item) => {
                    const targetT = item.metadata?.targetType;
                    const targetDesc =
                      targetT === 'admins' ? 'المشرفين والمدراء'
                      : targetT === 'college' ? 'طلاب الكلية'
                      : targetT === 'subject' ? 'مشتركي المادة'
                      : item.user ? `${item.user.firstName} ${item.user.lastName}`
                      : 'جميع الطلاب (Broadcast)';

                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: '12px 16px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 8,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{item.title}</strong>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {new Date(item.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.body}</p>
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 10 }}>
                          <span>
                            المستهدف: <strong>{targetDesc}</strong>
                          </span>
                          {item.metadata?.replyable === false && (
                            <span style={{ color: '#f59e0b' }}>🔒 إشعار غير قابل للرد</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

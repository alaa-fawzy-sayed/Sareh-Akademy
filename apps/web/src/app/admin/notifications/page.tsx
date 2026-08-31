'use client';

import { useState } from 'react';
import {
  Bell,
  Send,
  Users,
  User,
  CheckCircle,
  Search,
  Trash2,
  AlertCircle,
  Megaphone,
  Info,
} from 'lucide-react';
import styles from '../admin.module.css';

// ── Notification history ──
const NOTIFICATION_HISTORY = [
  { id: 1, title: 'تحديث المنصة', body: 'تم إضافة ميزات جديدة على المنصة. اكتشف التحديثات الآن!', target: 'الجميع', sentAt: 'منذ يومين', type: 'info', count: 2841 },
  { id: 2, title: 'عروض الاشتراك', body: 'خصم 20% على جميع الاشتراكات حتى نهاية الشهر', target: 'الجميع', sentAt: 'منذ أسبوع', type: 'promo', count: 2841 },
  { id: 3, title: 'تذكير بالمادة', body: 'لم تكمل مراجعة الكيمياء العضوية بعد!', target: 'أحمد محمد', sentAt: 'منذ 3 أيام', type: 'reminder', count: 1 },
  { id: 4, title: 'محتوى جديد', body: 'تم إضافة محاضرة جديدة في الفيزياء العامة', target: 'مشتركي الفيزياء', sentAt: 'أمس', type: 'content', count: 215 },
];

type NotifType = 'info' | 'warning' | 'success' | 'promo';

const typeConfig: Record<string, { label: string; badge: string; icon: typeof Bell }> = {
  info: { label: 'معلومة', badge: styles.badgeBlue, icon: Info },
  promo: { label: 'عرض', badge: styles.badgePurple, icon: Megaphone },
  reminder: { label: 'تذكير', badge: styles.badgeYellow, icon: AlertCircle },
  content: { label: 'محتوى', badge: styles.badgeGreen, icon: Bell },
};

export default function AdminNotificationsPage() {
  const [targetType, setTargetType] = useState<'all' | 'user'>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notifType, setNotifType] = useState<string>('info');
  const [userSearch, setUserSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState(NOTIFICATION_HISTORY);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    const newNotif = {
      id: Date.now(),
      title,
      body,
      target: targetType === 'all' ? 'الجميع' : userSearch || 'مستخدم محدد',
      sentAt: 'الآن',
      type: notifType,
      count: targetType === 'all' ? 2841 : 1,
    };
    setHistory((prev) => [newNotif, ...prev]);
    setSending(false);
    setSent(true);
    setTitle('');
    setBody('');
    setUserSearch('');
    setTimeout(() => setSent(false), 3000);
  };

  const deleteNotif = (id: number) => {
    setHistory((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>الإشعارات والتواصل</h1>
          <p className={styles.pageSub}>إرسال إشعارات للمستخدمين وإدارة سجل التواصل</p>
        </div>
      </div>

      <div className={styles.grid2}>
        {/* Send form */}
        <div>
          <div className={styles.card} id="notif-send-card">
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}><Send size={17} /> إرسال إشعار جديد</div>
            </div>
            <form onSubmit={handleSend}>
              <div className={styles.modalBody} style={{ padding: '20px' }}>
                {/* Target */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>المستهدفون</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className={`${styles.btn} ${targetType === 'all' ? styles.btnPrimary : styles.btnSecondary}`}
                      onClick={() => setTargetType('all')}
                      id="notif-target-all"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <Users size={15} /> جميع المستخدمين
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${targetType === 'user' ? styles.btnPrimary : styles.btnSecondary}`}
                      onClick={() => setTargetType('user')}
                      id="notif-target-user"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      <User size={15} /> مستخدم محدد
                    </button>
                  </div>
                </div>

                {/* User search */}
                {targetType === 'user' && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>ابحث عن المستخدم</label>
                    <div className={styles.searchBox}>
                      <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <input
                        className={styles.searchInput}
                        placeholder="الاسم أو البريد الإلكتروني..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        id="notif-user-search"
                      />
                    </div>
                  </div>
                )}

                {/* Type */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>نوع الإشعار</label>
                  <select
                    className={styles.formSelect}
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value)}
                    id="notif-type-select"
                  >
                    <option value="info">معلومة</option>
                    <option value="promo">عرض ترويجي</option>
                    <option value="reminder">تذكير</option>
                    <option value="content">محتوى جديد</option>
                  </select>
                </div>

                {/* Title */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>عنوان الإشعار *</label>
                  <input
                    className={styles.formInput}
                    placeholder="عنوان واضح ومختصر..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={80}
                    id="notif-title-input"
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'left' }}>
                    {title.length}/80
                  </div>
                </div>

                {/* Body */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>نص الإشعار *</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="محتوى الإشعار..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    maxLength={300}
                    style={{ minHeight: 100 }}
                    id="notif-body-input"
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'left' }}>
                    {body.length}/300
                  </div>
                </div>

                {/* Preview */}
                {(title || body) && (
                  <div style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    marginBottom: 8,
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>معاينة الإشعار</div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Bell size={18} color="#fff" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 3 }}>{title || 'عنوان الإشعار'}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{body || 'محتوى الإشعار...'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Top-Pharma · الآن</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success msg */}
                {sent && (
                  <div className={`${styles.badge} ${styles.badgeGreen}`} style={{ padding: '10px 16px', fontSize: 13, width: '100%', justifyContent: 'center' }}>
                    <CheckCircle size={15} /> تم إرسال الإشعار بنجاح!
                  </div>
                )}
              </div>
              <div className={styles.modalFooter} style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {targetType === 'all' ? 'سيُرسل لـ 2,841 مستخدم' : 'سيُرسل لمستخدم واحد'}
                </div>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={sending || !title || !body} id="notif-send-btn">
                  {sending ? (
                    <><span className={styles.spinner} style={{ width: 14, height: 14, borderWidth: 2 }} /> جاري الإرسال...</>
                  ) : (
                    <><Send size={14} /> إرسال الإشعار</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* History */}
        <div>
          <div className={styles.card} id="notif-history-card">
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}><Bell size={17} /> سجل الإشعارات المُرسلة</div>
              <span className={`${styles.badge} ${styles.badgePurple}`}>{history.length} إشعار</span>
            </div>
            <div style={{ padding: '8px 0' }}>
              {history.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}><Bell size={24} /></div>
                  <div className={styles.emptyTitle}>لا توجد إشعارات مُرسلة</div>
                </div>
              ) : history.map((n) => {
                const tc = typeConfig[n.type] ?? typeConfig.info;
                const Icon = tc.icon;
                return (
                  <div
                    key={n.id}
                    id={`notif-history-${n.id}`}
                    style={{
                      display: 'flex',
                      gap: 14,
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--glass-border)',
                      alignItems: 'flex-start',
                      transition: 'var(--transition)',
                    }}
                  >
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'var(--primary)',
                    }}>
                      <Icon size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{n.title}</span>
                        <span className={`${styles.badge} ${tc.badge}`} style={{ fontSize: 11, padding: '2px 8px' }}>{tc.label}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.5 }}>{n.body}</p>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                        <span>📍 {n.target}</span>
                        <span>👥 {n.count.toLocaleString('ar-EG')} مستلم</span>
                        <span>🕐 {n.sentAt}</span>
                      </div>
                    </div>
                    <button
                      className={`${styles.btn} ${styles.btnDanger} ${styles.btnIcon}`}
                      onClick={() => deleteNotif(n.id)}
                      title="حذف من السجل"
                      id={`notif-delete-${n.id}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  CheckCircle,
  Mail,
  User,
  Clock,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  Check,
  X,
  Reply,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import styles from '../admin.module.css';

interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  isRead: boolean;
  reply?: string | null;
  repliedAt?: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  // Selected message for details/reply modal
  const [selectedMsg, setSelectedMsg] = useState<ContactMessageItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/contact-messages?limit=50');
      const payload = res.data?.data ?? res.data;
      const list = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setMessages(list);
      setUnreadCount(payload.meta?.unreadCount ?? list.filter((m: any) => !m.isRead).length);
    } catch {
      setError('تعذر تحميل رسائل واستفسارات الطلاب.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/admin/contact-messages/${id}/read`);
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
      setUnreadCount((c) => Math.max(0, c - 1));
      if (selectedMsg?.id === id) {
        setSelectedMsg((prev) => (prev ? { ...prev, isRead: true } : null));
      }
    } catch {
      // silent
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMsg || !replyText.trim()) return;

    setReplying(true);
    setError('');
    try {
      await api.post(`/admin/contact-messages/${selectedMsg.id}/reply`, {
        reply: replyText.trim(),
      });

      setSuccessAlert(`تم إرسال الرد بنجاح كإشعار رسمي في حساب الطالب ${selectedMsg.name}`);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === selectedMsg.id
            ? { ...m, isRead: true, reply: replyText.trim(), repliedAt: new Date().toISOString() }
            : m,
        ),
      );
      setSelectedMsg(null);
      setReplyText('');
      setTimeout(() => setSuccessAlert(null), 5000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل إرسال الرد.');
    } finally {
      setReplying(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (filterRead === 'unread' && m.isRead) return false;
    if (filterRead === 'read' && !m.isRead) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = m.name?.toLowerCase().includes(q);
      const matchEmail = m.email?.toLowerCase().includes(q);
      const matchMsg = m.message?.toLowerCase().includes(q);
      const matchSub = m.subject?.toLowerCase().includes(q);
      return matchName || matchEmail || matchMsg || matchSub;
    }
    return true;
  });

  return (
    <div>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>رسائل واستفسارات الطلاب</h1>
          <p className={styles.pageSub}>
            استقبال استفسارات الطلاب من المنصة والرد عليها مباشرة عبر إشعارات المنصة الرسمية
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={fetchMessages} id="messages-refresh-btn">
            <RefreshCw size={15} /> تحديث
          </button>
        </div>
      </div>

      {successAlert && (
        <div style={{ padding: '12px 16px', marginBottom: 20, background: 'rgba(16,185,129,0.12)', border: '1px solid var(--success)', borderRadius: 8, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={18} /> {successAlert}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', marginBottom: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid var(--error)', borderRadius: 8, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Main card */}
      <div className={styles.card} id="messages-table-card">
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <MessageSquare size={17} /> البريد والاستفسارات الواردة
            {unreadCount > 0 && (
              <span style={{ marginRight: 8, background: '#ef4444', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                {unreadCount} رسائل غير مقروءة
              </span>
            )}
          </div>
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input
                className={styles.searchInput}
                placeholder="بحث باسم الطالب أو نص الرسالة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="messages-search-input"
              />
            </div>
            <select
              className={styles.filterSelect}
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value as any)}
              id="messages-filter-select"
            >
              <option value="all">جميع الرسائل</option>
              <option value="unread">غير المقروءة فقط</option>
              <option value="read">المقروءة</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>الطالب</th>
                <th>الموضوع</th>
                <th>نص الرسالة</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}><MessageSquare size={28} /></div>
                      <div className={styles.emptyTitle}>لا توجد استفسارات واردة</div>
                      <div className={styles.emptyDesc}>تصل هنا رسائل الطلاب واستفساراتهم المرسلة من خلال المنصة</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMessages.map((m) => (
                  <tr
                    key={m.id}
                    style={{ background: !m.isRead ? 'rgba(108, 99, 255, 0.04)' : undefined }}
                    id={`message-row-${m.id}`}
                  >
                    <td>
                      <div className={styles.avatarCell}>
                        <div className={styles.tableAvatar} style={{ background: !m.isRead ? 'var(--gradient-primary)' : 'var(--bg-elevated)', width: 32, height: 32, fontSize: 13 }}>
                          {m.name[0] ?? '?'}
                        </div>
                        <div className={styles.tableAvatarInfo}>
                          <span className={styles.tableAvatarName}>
                            {m.name} {!m.isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', marginRight: 4 }} />}
                          </span>
                          <span className={styles.tableAvatarSub}>{m.email}</span>
                          {m.phone && <span style={{ fontSize: 11, color: 'var(--text-muted)', direction: 'ltr', textAlign: 'right' }}>{m.phone}</span>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 160 }}>
                      {m.subject || 'استفسار عام'}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 280 }}>
                      <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.message}
                      </p>
                      {m.reply && (
                        <span style={{ fontSize: 11, color: 'var(--success)', display: 'block', marginTop: 3 }}>
                          ✓ تم الرد: {m.reply.slice(0, 35)}...
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${m.reply ? styles.badgeGreen : !m.isRead ? styles.badgeYellow : styles.badgeBlue}`}>
                        {m.reply ? 'تم الرد' : !m.isRead ? 'جديدة' : 'مقروءة'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(m.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className={styles.btnSecondary}
                          style={{ padding: '5px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={() => {
                            setSelectedMsg(m);
                            if (!m.isRead) handleMarkAsRead(m.id);
                          }}
                          id={`view-msg-${m.id}`}
                        >
                          <Eye size={13} /> عرض والرد
                        </button>
                        {!m.isRead && (
                          <button
                            className={styles.btnSecondary}
                            style={{ padding: '5px 8px', fontSize: 11 }}
                            onClick={() => handleMarkAsRead(m.id)}
                            title="تحديد كمقروء"
                          >
                            <Check size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Message Details & Reply Modal ──────────────────────────────── */}
      {selectedMsg && (
        <div className={styles.modalOverlay} onClick={() => setSelectedMsg(null)} id="message-modal-overlay">
          <div
            className={styles.modal}
            style={{ maxWidth: 640, width: '92%' }}
            onClick={(e) => e.stopPropagation()}
            id="message-modal-content"
          >
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MessageSquare size={20} color="var(--primary)" />
                <div>
                  <h3 className={styles.modalTitle}>{selectedMsg.subject || 'استفسار من طالب'}</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    من: {selectedMsg.name} ({selectedMsg.email})
                  </span>
                </div>
              </div>
              <button className={styles.modalClose} onClick={() => setSelectedMsg(null)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Message Details */}
              <div style={{ padding: 16, background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: 10, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>تاريخ الإرسال: {new Date(selectedMsg.createdAt).toLocaleString('ar-EG')}</span>
                  {selectedMsg.phone && <span style={{ direction: 'ltr' }}>هاتف: {selectedMsg.phone}</span>}
                </div>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {selectedMsg.message}
                </p>
              </div>

              {/* Previous Reply if any */}
              {selectedMsg.reply && (
                <div style={{ padding: 14, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 10, marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', marginBottom: 4 }}>
                    ✓ الرد الإداري المرسل للطالب ({selectedMsg.repliedAt ? new Date(selectedMsg.repliedAt).toLocaleDateString('ar-EG') : ''}):
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>
                    {selectedMsg.reply}
                  </p>
                </div>
              )}

              {/* Reply Form */}
              <form onSubmit={handleReply}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  كتابة رد يصل إلى إشعارات الطالب داخل المنصة:
                </label>
                <textarea
                  className={styles.formTextarea}
                  rows={4}
                  placeholder="اكتب رد الإدارة على استفسار الطالب هنا (سيصل كإشعار فوري بحسابه)..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  required
                  id="admin-reply-textarea"
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                  <button type="button" className={styles.btnSecondary} onClick={() => setSelectedMsg(null)}>
                    إغلاق
                  </button>
                  <button
                    type="submit"
                    className={styles.btnPrimary}
                    disabled={replying}
                    id="submit-reply-btn"
                  >
                    {replying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {replying ? 'جاري إرسال الرد...' : 'إرسال الرد لإشعار الطالب'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

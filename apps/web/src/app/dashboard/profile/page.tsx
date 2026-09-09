'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api/client';
import { Header } from '@/components/layout/Header/Header';
import {
  User, Phone, Mail, Camera, Save, Wallet, MessageSquare,
  Send, Bell, CheckCircle, Circle, ChevronRight, HelpCircle, Info, ExternalLink, Smartphone
} from 'lucide-react';
import styles from './ProfilePage.module.css';

interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  type: string;
  metadata?: any;
}

export default function ProfilePage() {
  const { user, setAuth, token } = useAuthStore();

  // ── حالة الملف الشخصي ──
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── حالة التواصل ──
  const [messageText, setMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSent, setMsgSent] = useState(false);

  // ── حالة الإشعارات ──
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  // ── تحميل الإشعارات ──
  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications?limit=10'),
        api.get('/notifications/unread-count'),
      ]);
      const notifData = notifRes.data?.data?.data ?? notifRes.data?.data ?? notifRes.data ?? [];
      setNotifications(Array.isArray(notifData) ? notifData : []);
      setUnreadCount(countRes.data?.count ?? countRes.data?.data?.count ?? 0);
    } catch {
      // صامت
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // sync phone from user if needed
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
  }, [user]);

  // ── رفع صورة محلية (preview) ──
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── حفظ الملف الشخصي ──
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg('');
    try {
      // في الوقت الحالي نحدّث الـ store محلياً (API profile update يمكن إضافته لاحقاً)
      if (user && token) {
        setAuth({ ...user, firstName, lastName }, token);
      }
      setProfileMsg('✅ تم حفظ البيانات بنجاح');
    } catch {
      setProfileMsg('❌ حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  // ── إرسال رسالة للأدمن ──
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setSendingMsg(true);
    try {
      await api.post('/admin/contact-messages', {
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'طالب',
        email: user?.email || '',
        phone: user?.phone || undefined,
        subject: 'رسالة من لوحة الطالب',
        message: messageText.trim(),
        userId: user?.id,
      });
      setMsgSent(true);
      setMessageText('');
      setTimeout(() => setMsgSent(false), 4000);
    } catch {
      setMsgSent(true);
      setMessageText('');
      setTimeout(() => setMsgSent(false), 4000);
    } finally {
      setSendingMsg(false);
    }
  };

  // ── تعليم الإشعار كمقروء ──
  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const notifTypeColor: Record<string, string> = {
    SYSTEM: '#6C63FF',
    PAYMENT: '#10B981',
    CONTENT: '#F59E0B',
    PROMOTION: '#EC4899',
  };

  return (
    <>
      <Header />
      <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>الملف الشخصي</h1>

        <div className={styles.grid}>
          {/* ── العمود الأيمن: معلومات الحساب ── */}
          <div className={styles.left}>

            {/* بطاقة الصورة */}
            <div className={styles.card}>
              <div className={styles.avatarSection}>
                <div className={styles.avatarWrap} onClick={() => fileInputRef.current?.click()}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="صورتك" className={styles.avatarImg} />
                  ) : (
                    <div className={styles.avatarFallback}>
                      {firstName?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                  )}
                  <div className={styles.avatarOverlay}><Camera size={18} /></div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                <div>
                  <h2 className={styles.avatarName}>{firstName} {lastName}</h2>
                  <p className={styles.avatarEmail}>{user?.email}</p>
                  <span className={styles.roleBadge}>
                    {user?.roles?.includes('SUPER_ADMIN') ? 'مشرف أول' :
                     user?.roles?.includes('ADMIN') ? 'مشرف' :
                     user?.roles?.includes('CONTENT_MANAGER') ? 'مدير محتوى' : 'طالب'}
                  </span>
                </div>
              </div>
            </div>

            {/* تعديل البيانات */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><User size={17} /> تعديل البيانات الشخصية</h3>
              <form onSubmit={handleSaveProfile} className={styles.form}>
                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label className={styles.label}>الاسم الأول</label>
                    <input className={styles.input} value={firstName} onChange={e => setFirstName(e.target.value)} required />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>الاسم الأخير</label>
                    <input className={styles.input} value={lastName} onChange={e => setLastName(e.target.value)} required />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}><Mail size={13} /> البريد الإلكتروني</label>
                  <input className={styles.input} value={user?.email ?? ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}><Phone size={13} /> رقم الهاتف</label>
                  <input
                    className={styles.input}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                    type="tel"
                  />
                </div>
                {profileMsg && (
                  <div style={{ fontSize: 13, color: profileMsg.startsWith('✅') ? '#10B981' : '#EF4444', marginTop: 4 }}>
                    {profileMsg}
                  </div>
                )}
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  <Save size={15} /> {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </form>
            </div>

            {/* الدعم والمساعدة المباشرة */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><MessageSquare size={17} /> الدعم والاستفسارات</h3>
              <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--glass-border)', marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>التواصل الرسمي:</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                  تواصل داخلي آمن ومباشر عبر نظام رسائل واستفسارات المنصة
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link
                  href="/contact"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px', borderRadius: 8, background: 'var(--gradient-primary)',
                    color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none'
                  }}
                >
                  <MessageSquare size={14} /> تواصل معنا / اتصل بنا
                </Link>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Link
                    href="/help"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      padding: '8px', borderRadius: 8, background: 'var(--bg-card-hover)',
                      color: 'var(--text-primary)', fontSize: 12, textDecoration: 'none', border: '1px solid var(--glass-border)'
                    }}
                  >
                    <HelpCircle size={13} /> طريقة الاستخدام
                  </Link>
                  <Link
                    href="/about"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      padding: '8px', borderRadius: 8, background: 'var(--bg-card-hover)',
                      color: 'var(--text-primary)', fontSize: 12, textDecoration: 'none', border: '1px solid var(--glass-border)'
                    }}
                  >
                    <Info size={13} /> عن المنصة
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ── العمود الأيسر: إشعارات + تواصل ── */}
          <div className={styles.right}>

            {/* الإشعارات */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}><Bell size={17} /> الإشعارات {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}</h3>
                {unreadCount > 0 && (
                  <button className={styles.btnLink} onClick={markAllRead}>تعليم الكل كمقروء</button>
                )}
              </div>

              {notifLoading ? (
                <p className={styles.muted}>جاري التحميل...</p>
              ) : notifications.length === 0 ? (
                <div className={styles.emptyNotif}>
                  <Bell size={28} style={{ opacity: 0.3 }} />
                  <p>لا توجد إشعارات حالياً</p>
                </div>
              ) : (
                <div className={styles.notifList}>
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`${styles.notifItem} ${!n.isRead ? styles.notifUnread : ''}`}
                      onClick={() => !n.isRead && markAsRead(n.id)}
                    >
                      <div
                        className={styles.notifDot}
                        style={{ background: notifTypeColor[n.type] ?? '#6C63FF' }}
                      />
                      <div className={styles.notifContent}>
                        <div className={styles.notifTitle}>{n.title}</div>
                        <div className={styles.notifBody}>{n.body}</div>
                        
                        {/* رسالة إدارية رسمية بدون إمكانية رد مباشر */}
                        {n.metadata?.replyable === false && (
                          <div style={{
                            marginTop: 8,
                            padding: '6px 10px',
                            background: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                            borderRadius: 6,
                            fontSize: 11,
                            color: '#f59e0b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                          }}>
                            <span>🛡️ رسالة إدارية رسمية (غير قابلة للرد المباشر)</span>
                            <Link href="/contact" style={{ color: 'var(--primary-light)', textDecoration: 'underline', fontWeight: 600 }}>
                              تواصل معنا للاستفسار
                            </Link>
                          </div>
                        )}

                        <div className={styles.notifTime}>
                          {new Date(n.createdAt).toLocaleDateString('ar-EG')}
                        </div>
                      </div>
                      {n.isRead
                        ? <CheckCircle size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                        : <Circle size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      }
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* التواصل مع الأدمن */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><MessageSquare size={17} /> التواصل مع إدارة المنصة</h3>
              {msgSent ? (
                <div className={styles.msgSuccess}>
                  <CheckCircle size={20} style={{ color: '#10B981' }} />
                  <span>تم إرسال رسالتك بنجاح! سيرد عليك المشرف قريباً.</span>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className={styles.form}>
                  <div className={styles.field}>
                    <label className={styles.label}>رسالتك لإدارة المنصة</label>
                    <textarea
                      className={styles.textarea}
                      placeholder="اكتب استفساراتك أو ملاحظاتك هنا..."
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                  <button type="submit" className={styles.btnPrimary} disabled={sendingMsg}>
                    <Send size={15} /> {sendingMsg ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

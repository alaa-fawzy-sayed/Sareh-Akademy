'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth.store';
import { useIsAdmin } from '@/lib/hooks/useIsAdmin';
import { AdminSidebar } from '@/components/features/admin/AdminSidebar';
import {
  Bell,
  Home,
  Shield,
  Loader2,
  Sun,
  Moon,
  MessageSquare,
  CreditCard,
  ExternalLink,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import styles from './admin.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const isAdmin = useIsAdmin();
  const [hydrated, setHydrated] = useState(false);

  // Theme state: dark | light
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);

  // ── 1. Hydration & Theme ──
  useEffect(() => {
    setHydrated(true);
    const savedTheme = (localStorage.getItem('top_pharma_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('top_pharma_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    document.body.setAttribute('data-theme', nextTheme);
  };

  // ── 2. Fetch Admin Notifications Stats ──
  const fetchAdminAlerts = async () => {
    if (!isAuthenticated || !isAdmin) return;
    try {
      const [msgRes, orderRes] = await Promise.all([
        api.get('/admin/contact-messages?limit=4&status=unread').catch(() => ({ data: {} })),
        api.get('/admin/orders?limit=1&status=PENDING').catch(() => ({ data: {} })),
      ]);

      const msgData = msgRes.data?.data ?? msgRes.data ?? {};
      setUnreadMessagesCount(msgData.unreadCount ?? (Array.isArray(msgData.messages) ? msgData.messages.length : 0));
      if (Array.isArray(msgData.messages)) {
        setRecentMessages(msgData.messages);
      }

      const orderData = orderRes.data?.data ?? orderRes.data ?? {};
      const pendingCount = orderData.meta?.pendingCount ?? orderData.meta?.total ?? 0;
      setPendingPaymentsCount(pendingCount);
    } catch {}
  };

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (isAdmin) {
      fetchAdminAlerts();
      const interval = setInterval(fetchAdminAlerts, 15000);
      return () => clearInterval(interval);
    }
  }, [hydrated, isAuthenticated, isAdmin, router]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalAlerts = unreadMessagesCount + pendingPaymentsCount;

  // أثناء تحميل حالة الجلسة من التخزين المحلي
  if (!hydrated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-base, #0A0A14)',
          color: 'var(--text-primary, #fff)',
          gap: 12,
        }}
      >
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--primary, #6C63FF)' }} />
        <span>جاري التحقق من صلاحيات الدخول...</span>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className={styles.accessDenied}>
        <div className={styles.accessIcon}>
          <Shield size={36} />
        </div>
        <h1 className={styles.accessTitle}>وصول مقيّد</h1>
        <p className={styles.accessSub}>
          هذه الصفحة متاحة فقط للمشرفين والمسؤولين. يرجى تسجيل الدخول بحساب مدير للوصول إلى لوحة التحكم.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/login" className={`${styles.btn} ${styles.btnPrimary}`}>
            تسجيل الدخول كمدير
          </Link>
          <Link href="/" className={`${styles.btn} ${styles.btnSecondary}`}>
            الصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminShell}>
      <AdminSidebar
        unreadMessagesCount={unreadMessagesCount}
        pendingPaymentsCount={pendingPaymentsCount}
      />

      <div className={styles.content}>
        {/* Top bar */}
        <div className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <Home size={14} />
            <span className={styles.breadcrumbSep}>/</span>
            <span>لوحة الإدارة والتحكم</span>
          </div>

          <div className={styles.topbarActions}>
            {/* Theme Toggle Button */}
            <button
              className={styles.themeToggleBtn}
              onClick={toggleTheme}
              title={theme === 'dark' ? 'التحويل إلى المظهر الفاتح' : 'التحويل إلى المظهر الداكن'}
              aria-label="تبديل مظهر لوحة الإدارة"
              id="admin-theme-toggle"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Admin Role Badge */}
            <div className={styles.adminBadge}>
              <Shield size={13} />
              {user?.roles?.includes('SUPER_ADMIN') ? 'مشرف عام' : 'مشرف'}
            </div>

            {/* Notification Bell & Dropdown */}
            <div className={styles.notifWrapper} ref={notifRef}>
              <button
                className={styles.topbarBtn}
                aria-label="الإشعارات والرسائل"
                id="admin-notif-btn"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell size={17} />
                {totalAlerts > 0 && (
                  <span className={styles.badge} id="admin-notif-badge">
                    {totalAlerts > 9 ? '9+' : totalAlerts}
                  </span>
                )}
              </button>

              {/* Interactive Admin Dropdown */}
              {notifOpen && (
                <div className={styles.notifDropdown} id="admin-notif-dropdown">
                  <div className={styles.notifHeader}>
                    <div className={styles.notifTitle}>
                      <Bell size={16} />
                      <span>تنبيهات الإدارة</span>
                      {totalAlerts > 0 && (
                        <span className={styles.notifCountBadge}>{totalAlerts} جديد</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.notifList}>
                    {/* 1. Pending Payments Alert Item */}
                    {pendingPaymentsCount > 0 && (
                      <Link
                        href="/admin/payments"
                        className={styles.notifItem}
                        onClick={() => setNotifOpen(false)}
                        style={{ background: 'rgba(245, 158, 11, 0.06)' }}
                      >
                        <div
                          className={styles.notifIconWrap}
                          style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}
                        >
                          <CreditCard size={18} />
                        </div>
                        <div className={styles.notifContent}>
                          <div className={styles.notifHeading}>
                            <span>طلبات اشتراك معلقة</span>
                            <span style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700 }}>
                              {pendingPaymentsCount} قيد المراجعة
                            </span>
                          </div>
                          <div className={styles.notifBody}>
                            يوجد طلبات دفع فودافون كاش تحتاج لمراجعة الإيصال وتفعيل المقررات للطلاب.
                          </div>
                        </div>
                      </Link>
                    )}

                    {/* 2. Unread Student Messages */}
                    {recentMessages.length > 0 ? (
                      recentMessages.map((msg) => (
                        <Link
                          key={msg.id}
                          href="/admin/messages"
                          className={styles.notifItem}
                          onClick={() => setNotifOpen(false)}
                        >
                          <div
                            className={styles.notifIconWrap}
                            style={{ background: 'rgba(108, 99, 255, 0.12)', color: '#6C63FF' }}
                          >
                            <MessageSquare size={18} />
                          </div>
                          <div className={styles.notifContent}>
                            <div className={styles.notifHeading}>
                              <span>رسالة من: {msg.name || 'طالب'}</span>
                              <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 700 }}>
                                استفسار جديد
                              </span>
                            </div>
                            <div className={styles.notifBody}>
                              <strong>{msg.subject || 'استفسار'}:</strong> {msg.message}
                            </div>
                            <div className={styles.notifTime}>
                              {new Date(msg.createdAt).toLocaleDateString('ar-EG', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : pendingPaymentsCount === 0 ? (
                      <div className={styles.notifEmpty}>
                        <Bell size={28} style={{ opacity: 0.3 }} />
                        <p>لا توجد تنبيهات أو رسائل واردة معلقة حالياً</p>
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.notifFooter}>
                    <Link
                      href="/admin/messages"
                      className={styles.notifFooterLink}
                      onClick={() => setNotifOpen(false)}
                    >
                      صندوق رسائل الطلاب ({unreadMessagesCount}) ←
                    </Link>
                    <Link
                      href="/admin/payments"
                      className={styles.notifFooterLink}
                      onClick={() => setNotifOpen(false)}
                    >
                      مراجعة المدفوعات ({pendingPaymentsCount}) ←
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className={styles.page}>{children}</main>
      </div>
    </div>
  );
}

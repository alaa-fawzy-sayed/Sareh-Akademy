'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  GraduationCap,
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
  Shield,
  LayoutDashboard,
  Sun,
  Moon,
  CheckCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { useIsAdmin } from '@/lib/hooks/useIsAdmin';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/Button/Button';
import styles from './Header.module.css';

const navLinks = [
  { href: '/', label: 'الرئيسية' },
  { href: '/universities', label: 'الجامعات' },
  { href: '/subjects', label: 'المواد' },
  { href: '/about', label: 'عن المنصة' },
  { href: '/help', label: 'طريقة الاستخدام' },
  { href: '/contact', label: 'تواصل معنا' },
];

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const isAdmin = useIsAdmin();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Theme state: dark | light
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Notifications
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // ── 1. Theme Initialization & Toggle ──
  useEffect(() => {
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

  // ── 2. Fetch Notifications & Unread Count ──
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications/unread-count');
      const count = res.data?.count ?? res.data?.data?.count ?? 0;
      setUnreadCount(count);
    } catch {}
  };

  const fetchRecentNotifications = async () => {
    if (!isAuthenticated) return;
    setLoadingNotifs(true);
    try {
      const res = await api.get('/notifications?limit=8');
      const data = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 15 seconds for real-time notification alert
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // When dropdown opens, fetch recent notifications
  const handleToggleNotif = () => {
    const next = !notifOpen;
    setNotifOpen(next);
    setProfileOpen(false);
    if (next) {
      fetchRecentNotifications();
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  // Mark single notification as read
  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {}
    }
    setNotifOpen(false);
    router.push('/dashboard?tab=notifications');
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on navigate
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const notifColorMap: Record<string, string> = {
    SYSTEM: '#6C63FF',
    PAYMENT: '#10B981',
    PAYMENT_CONFIRMED: '#10B981',
    ANNOUNCEMENT: '#3B82F6',
    CONTENT: '#F59E0B',
    PROMOTION: '#EC4899',
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`} id="main-header">
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo} id="header-logo">
          <div className={styles.logoIcon}>
            <GraduationCap size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span className={styles.logoText}>
              صرح <span className={styles.logoAccent}>أكاديمي</span>
            </span>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '1.2px', fontWeight: 700 }}>
              SARH ACADEMY
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className={styles.nav} aria-label="التنقل الرئيسي">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Theme Toggle Button (Dark / Light) */}
          <button
            className={styles.themeToggleBtn}
            onClick={toggleTheme}
            title={theme === 'dark' ? 'التحويل إلى المظهر الفاتح' : 'التحويل إلى المظهر الداكن'}
            aria-label="تبديل مظهر المنصة"
            id="header-theme-toggle"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated ? (
            <>
              {/* Notification Bell & Interactive Dropdown */}
              <div className={styles.notifWrapper} ref={notifRef}>
                <button
                  className={styles.iconBtn}
                  aria-label="الإشعارات"
                  id="header-notifications-btn"
                  onClick={handleToggleNotif}
                  style={{ position: 'relative' }}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className={styles.badge} id="header-notif-badge">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifOpen && (
                  <div className={styles.notifDropdown} id="header-notif-dropdown">
                    <div className={styles.notifHeader}>
                      <div className={styles.notifTitle}>
                        <Bell size={16} />
                        <span>الإشعارات</span>
                        {unreadCount > 0 && (
                          <span className={styles.notifCountBadge}>{unreadCount} جديد</span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          className={styles.notifMarkAllBtn}
                          onClick={handleMarkAllRead}
                          id="notif-mark-all-btn"
                        >
                          تعليم الكل كمقروء
                        </button>
                      )}
                    </div>

                    <div className={styles.notifList}>
                      {loadingNotifs ? (
                        <div className={styles.notifEmpty}>
                          <p>جاري تحميل الإشعارات...</p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className={styles.notifEmpty}>
                          <Bell size={26} style={{ opacity: 0.3 }} />
                          <p>لا توجد إشعارات حالياً</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`${styles.notifItem} ${!n.isRead ? styles.notifItemUnread : ''}`}
                            onClick={() => handleNotificationClick(n)}
                          >
                            <div
                              className={styles.notifDot}
                              style={{ background: notifColorMap[n.type] || '#6C63FF' }}
                            />
                            <div className={styles.notifContent}>
                              <div className={styles.notifHeading}>{n.title}</div>
                              <div className={styles.notifBody}>{n.body}</div>
                              {n.metadata?.replyable === false && (
                                <div className={styles.notifOfficialBadge}>
                                  🛡️ رد إداري رسمي من المنصة
                                </div>
                              )}
                              <div className={styles.notifTime}>
                                {new Date(n.createdAt).toLocaleDateString('ar-EG', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                            {!n.isRead && (
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  background: '#EF4444',
                                  flexShrink: 0,
                                  marginTop: 6,
                                }}
                              />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <div className={styles.notifFooter}>
                      <Link
                        href="/dashboard?tab=notifications"
                        className={styles.notifViewAllLink}
                        onClick={() => setNotifOpen(false)}
                      >
                        عرض كل الإشعارات والرسائل الواردة ←
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* زر الانتقال للوحة الأدمن — يظهر فقط للمديرين */}
              {isAdmin && (
                <Link
                  href="/admin"
                  id="header-to-admin-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg,#6C63FF,#8B5CF6)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Shield size={14} /> لوحة الإدارة
                </Link>
              )}

              {/* Profile Wrapper & Dropdown */}
              <div className={styles.profileWrapper} ref={profileRef}>
                <button
                  className={styles.profileBtn}
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setNotifOpen(false);
                  }}
                  id="header-profile-btn"
                >
                  <div className={styles.avatar}>
                    {user?.firstName?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <span className={styles.profileName}>{user?.firstName}</span>
                  <ChevronDown size={14} className={profileOpen ? styles.chevronUp : ''} />
                </button>

                {profileOpen && (
                  <div className={styles.dropdown} id="header-profile-dropdown">
                    <Link
                      href="/dashboard"
                      className={styles.dropItem}
                      onClick={() => setProfileOpen(false)}
                    >
                      <User size={15} /> لوحتي الدراسية
                    </Link>
                    <Link
                      href="/dashboard?tab=notifications"
                      className={styles.dropItem}
                      onClick={() => setProfileOpen(false)}
                    >
                      <Bell size={15} /> الإشعارات والرسائل
                      {unreadCount > 0 && (
                        <span
                          style={{
                            marginRight: 'auto',
                            background: '#EF4444',
                            color: '#fff',
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 9999,
                            fontWeight: 700,
                          }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      className={styles.dropItem}
                      onClick={() => setProfileOpen(false)}
                    >
                      <User size={15} /> ملفي الشخصي
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className={styles.dropItem}
                        id="header-admin-panel-link"
                        onClick={() => setProfileOpen(false)}
                      >
                        <LayoutDashboard size={15} /> لوحة الإدارة
                      </Link>
                    )}
                    <div className={styles.dropDivider} />
                    <button
                      className={`${styles.dropItem} ${styles.dropDanger}`}
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      id="header-logout-btn"
                    >
                      <LogOut size={15} /> تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" id="header-login-btn">
                  دخول
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" id="header-register-btn">
                  ابدأ مجاناً
                </Button>
              </Link>
            </>
          )}

          {/* Mobile Toggle */}
          <button
            className={styles.mobileToggle}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="القائمة"
            id="header-mobile-toggle"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu} id="header-mobile-menu">
          <nav>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.mobileLink} ${pathname === link.href ? styles.active : ''}`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className={styles.mobileLink}
                >
                  لوحتي الدراسية
                </Link>
                <Link
                  href="/dashboard?tab=notifications"
                  className={styles.mobileLink}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>الإشعارات والرسائل</span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        background: '#EF4444',
                        color: '#fff',
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        fontWeight: 700,
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/dashboard/profile"
                  className={styles.mobileLink}
                >
                  ملفي الشخصي
                </Link>
              </>
            )}
          </nav>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>مظهر المنصة:</span>
            <button
              className={styles.themeToggleBtn}
              onClick={toggleTheme}
              style={{ display: 'flex', gap: 6, width: 'auto', padding: '6px 12px' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span style={{ fontSize: 12 }}>{theme === 'dark' ? 'فاتح' : 'داكن'}</span>
            </button>
          </div>
          {!isAuthenticated && (
            <div className={styles.mobileCta}>
              <Link href="/login">
                <Button variant="secondary" fullWidth id="mobile-login-btn">
                  دخول
                </Button>
              </Link>
              <Link href="/register">
                <Button fullWidth id="mobile-register-btn">
                  ابدأ مجاناً
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

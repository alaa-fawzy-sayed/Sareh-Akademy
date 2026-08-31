'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, GraduationCap, Bell, Search, User, LogOut, ChevronDown, Shield, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { useIsAdmin } from '@/lib/hooks/useIsAdmin';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/Button/Button';
import styles from './Header.module.css';

const navLinks = [
  { href: '/', label: 'الرئيسية' },
  { href: '/universities', label: 'الجامعات' },
  { href: '/subjects', label: 'المواد' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const isAdmin = useIsAdmin();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/notifications/unread-count')
      .then(r => setUnreadCount(r.data?.count ?? r.data?.data?.count ?? 0))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`} id="main-header">
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo} id="header-logo">
          <div className={styles.logoIcon}>
            <GraduationCap size={22} />
          </div>
          <span className={styles.logoText}>
            Top<span className={styles.logoAccent}>Pharma</span>
          </span>
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
          {isAuthenticated ? (
            <>
              <button className={styles.iconBtn} aria-label="بحث" id="header-search-btn">
                <Search size={18} />
              </button>
              <button
                className={styles.iconBtn}
                aria-label="الإشعارات"
                id="header-notifications-btn"
                onClick={() => router.push('/dashboard/profile')}
                style={{ position: 'relative' }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              {/* زر الانتقال للوحة الأدمن — يظهر فقط للمديرين */}
              {isAdmin && (
                <Link href="/admin" id="header-to-admin-btn" style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8,
                  background: 'linear-gradient(135deg,#6C63FF,#8B5CF6)',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}>
                  <Shield size={14} /> لوحة الإدارة
                </Link>
              )}
              <div className={styles.profileWrapper}>
                <button
                  className={styles.profileBtn}
                  onClick={() => setProfileOpen(!profileOpen)}
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
                    <Link href="/dashboard" className={styles.dropItem}>
                      <User size={15} /> لوحتي
                    </Link>
                    <Link href="/dashboard/profile" className={styles.dropItem}>
                      <User size={15} /> ملفي الشخصي
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className={styles.dropItem} id="header-admin-panel-link">
                        <LayoutDashboard size={15} /> لوحة الإدارة
                      </Link>
                    )}
                    <div className={styles.dropDivider} />
                    <button
                      className={`${styles.dropItem} ${styles.dropDanger}`}
                      onClick={logout}
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
                <Button variant="ghost" size="sm" id="header-login-btn">دخول</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" id="header-register-btn">ابدأ مجاناً</Button>
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
          </nav>
          {!isAuthenticated && (
            <div className={styles.mobileCta}>
              <Link href="/login">
                <Button variant="secondary" fullWidth id="mobile-login-btn">دخول</Button>
              </Link>
              <Link href="/register">
                <Button fullWidth id="mobile-register-btn">ابدأ مجاناً</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

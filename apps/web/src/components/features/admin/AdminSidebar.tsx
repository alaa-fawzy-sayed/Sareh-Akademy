'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  University,
  BookOpen,
  CreditCard,
  Bell,
  Megaphone,
  GraduationCap,
  LogOut,
  Shield,
  Menu,
  X,
  BarChart3,
  Settings,
  MessageSquare,
  Video,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import styles from './AdminSidebar.module.css';

const navSections = [
  {
    label: 'عام',
    items: [
      { href: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard },
      { href: '/admin/analytics', label: 'التحليلات', icon: BarChart3 },
    ],
  },
  {
    label: 'إدارة المحتوى',
    items: [
      { href: '/admin/content', label: 'رفع وإدارة الفيديوهات', icon: Video, badge: 'جديد ⚡' },
      { href: '/admin/subjects', label: 'المواد الدراسية', icon: BookOpen },
      { href: '/admin/colleges', label: 'الكليات', icon: GraduationCap },
      { href: '/admin/universities', label: 'الجامعات', icon: University },
    ],
  },
  {
    label: 'المستخدمون والمالية',
    items: [
      { href: '/admin/users', label: 'المستخدمون', icon: Users, badge: '' },
      { href: '/admin/payments', label: 'المدفوعات', icon: CreditCard },
    ],
  },
  {
    label: 'التواصل والرسائل',
    items: [
      { href: '/admin/messages', label: 'رسائل الطلاب الواردة', icon: MessageSquare },
      { href: '/admin/notifications', label: 'إرسال الإشعارات', icon: Bell },
      { href: '/admin/announcements', label: 'الإعلانات العامة', icon: Megaphone },
    ],
  },
  {
    label: 'النظام',
    items: [
      { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
  unreadMessagesCount?: number;
  pendingPaymentsCount?: number;
}

export function AdminSidebar({
  open = true,
  onClose,
  unreadMessagesCount = 0,
  pendingPaymentsCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOpen = open || mobileOpen;

  const handleClose = () => {
    setMobileOpen(false);
    onClose?.();
  };

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="فتح القائمة"
        id="admin-mobile-toggle"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay */}
      {isOpen && <div className={styles.overlay} onClick={handleClose} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`} id="admin-sidebar">
        {/* Brand */}
        <Link href="/" className={styles.brand} id="admin-brand">
          <div className={styles.brandIcon}>
            <Shield size={20} />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>صرح أكاديمي</span>
            <span className={styles.brandSub}>Sarh Academy — الإدارة</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className={styles.nav} aria-label="قائمة الإدارة">
          {navSections.map((section, si) => (
            <div key={si}>
              <div className={styles.sectionLabel}>{section.label}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                let badgeText = item.badge;
                let isRedBadge = false;

                if (item.href === '/admin/messages' && unreadMessagesCount > 0) {
                  badgeText = `${unreadMessagesCount} جديد`;
                  isRedBadge = true;
                } else if (item.href === '/admin/payments' && pendingPaymentsCount > 0) {
                  badgeText = `${pendingPaymentsCount} معلق`;
                  isRedBadge = true;
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${active ? styles.active : ''}`}
                    onClick={handleClose}
                    id={`admin-nav-${item.href.replace('/admin/', '').replace('/admin', 'overview')}`}
                  >
                    <span className={styles.navIcon}>
                      <Icon size={18} />
                    </span>
                    <span className={styles.navLabel}>{item.label}</span>
                    {badgeText && (
                      <span
                        className={`${styles.navBadge} ${isRedBadge ? styles.navBadgeRed : ''}`}
                      >
                        {badgeText}
                      </span>
                    )}
                  </Link>
                );
              })}
              {si < navSections.length - 1 && <div className={styles.divider} />}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className={styles.footer}>
          {/* زر الانتقال لواجهة الطالب */}
          <Link href="/dashboard" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', marginBottom: 10, borderRadius: 8,
            background: 'rgba(108,99,255,0.12)',
            border: '1px solid rgba(108,99,255,0.25)',
            color: '#a89cff', fontSize: 13, fontWeight: 600,
            textDecoration: 'none', transition: 'all 0.2s',
          }} id="admin-to-student-btn">
            <GraduationCap size={15} /> واجهة الطالب
          </Link>
          <div className={styles.userCard}>
            <div className={styles.avatar}>
              {user?.firstName?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>
                {user?.firstName} {user?.lastName}
              </div>
              <div className={styles.userRole}>
                {user?.roles?.includes('SUPER_ADMIN') ? 'Super Admin' : 'Admin'}
              </div>
            </div>
            <button
              className={styles.logoutBtn}
              onClick={logout}
              title="تسجيل الخروج"
              id="admin-logout-btn"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

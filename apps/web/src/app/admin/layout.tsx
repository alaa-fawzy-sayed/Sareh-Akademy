'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth.store';
import { useIsAdmin } from '@/lib/hooks/useIsAdmin';
import { AdminSidebar } from '@/components/features/admin/AdminSidebar';
import { Bell, Home, Shield } from 'lucide-react';
import styles from './admin.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const isAdmin = useIsAdmin();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (!isAdmin) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isAdmin, router]);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className={styles.accessDenied}>
        <div className={styles.accessIcon}>
          <Shield size={36} />
        </div>
        <h1 className={styles.accessTitle}>وصول مقيّد</h1>
        <p className={styles.accessSub}>
          هذه الصفحة متاحة فقط للمشرفين والمسؤولين. إذا كنت تعتقد أن هذا خطأ، تواصل مع الدعم.
        </p>
        <Link href="/dashboard" className={`${styles.btn} ${styles.btnPrimary}`}>
          العودة للوحتي
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.adminShell}>
      <AdminSidebar />

      <div className={styles.content}>
        {/* Top bar */}
        <div className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <Home size={14} />
            <span className={styles.breadcrumbSep}>/</span>
            <span>لوحة الإدارة</span>
          </div>
          <div className={styles.topbarActions}>
            <div className={styles.adminBadge}>
              <Shield size={13} />
              {user?.roles?.includes('SUPER_ADMIN') ? 'Super Admin' : 'Admin'}
            </div>
            <button className={styles.topbarBtn} aria-label="الإشعارات" id="admin-notif-btn">
              <Bell size={16} />
              <span className={styles.notifDot} />
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className={styles.page}>{children}</main>
      </div>
    </div>
  );
}

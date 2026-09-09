import Link from 'next/link';
import { GraduationCap, Mail, Phone, MapPin } from 'lucide-react';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer} id="main-footer">
      <div className="container">
        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brand}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}><GraduationCap size={20} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span className={styles.logoText}>صرح <span className={styles.accent}>أكاديمي</span></span>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '1.2px', fontWeight: 700 }}>SARH ACADEMY</span>
              </div>
            </div>
            <p className={styles.desc}>
              المنصة التعليمية الأولى المتخصصة لطلاب الجامعات المصرية، نقدم محتوى وشروحات ومذكرات معتمدة بنظام متكامل.
            </p>
            <div className={styles.contact}>
              <span><Mail size={14} /> support@sarh-academy.com</span>
              <span><MapPin size={14} /> مصر</span>
              <Link href="/contact" style={{ color: 'var(--primary-light)', textDecoration: 'none' }}>
                تواصل واستفسارات المنصة ←
              </Link>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className={styles.colTitle}>المنصة</h4>
            <ul className={styles.links}>
              <li><Link href="/universities">الجامعات</Link></li>
              <li><Link href="/subjects">المواد الدراسية</Link></li>
              <li><Link href="/about">عن المنصة</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={styles.colTitle}>الحساب</h4>
            <ul className={styles.links}>
              <li><Link href="/register">إنشاء حساب</Link></li>
              <li><Link href="/login">تسجيل الدخول</Link></li>
              <li><Link href="/dashboard">لوحتي الدراسية</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={styles.colTitle}>المساعدة والدعم</h4>
            <ul className={styles.links}>
              <li><Link href="/help">طريقة الاستخدام (دليل الطالب)</Link></li>
              <li><Link href="/contact">تواصل معنا / اتصل بنا</Link></li>
              <li><Link href="/about">نبذة عن المنصة</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} صرح أكاديمي — Sarh Academy. جميع الحقوق محفوظة.</p>
          <p className={styles.madeWith}>صُنع بـ ❤️ لطلاب مصر</p>
        </div>
      </div>
    </footer>
  );
}

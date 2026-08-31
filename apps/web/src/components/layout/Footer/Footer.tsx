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
              <span className={styles.logoText}>Top<span className={styles.accent}>Pharma</span></span>
            </div>
            <p className={styles.desc}>
              منصة تعليمية متكاملة لطلاب الجامعات المصرية، نقدم محتوى تعليمياً عالي الجودة في مختلف التخصصات.
            </p>
            <div className={styles.contact}>
              <span><Mail size={14} /> support@toppharma.edu</span>
              <span><Phone size={14} /> 01000000000+</span>
              <span><MapPin size={14} /> القاهرة، مصر</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className={styles.colTitle}>المنصة</h4>
            <ul className={styles.links}>
              <li><Link href="/universities">الجامعات</Link></li>
              <li><Link href="/subjects">المواد الدراسية</Link></li>
              <li><Link href="/teachers">الأساتذة</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={styles.colTitle}>الحساب</h4>
            <ul className={styles.links}>
              <li><Link href="/register">إنشاء حساب</Link></li>
              <li><Link href="/login">تسجيل الدخول</Link></li>
              <li><Link href="/dashboard">لوحتي</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={styles.colTitle}>الدعم</h4>
            <ul className={styles.links}>
              <li><Link href="/about">عن المنصة</Link></li>
              <li><Link href="/privacy">سياسة الخصوصية</Link></li>
              <li><Link href="/terms">الشروط والأحكام</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} Top-Pharma. جميع الحقوق محفوظة.</p>
          <p className={styles.madeWith}>صُنع بـ ❤️ لطلاب مصر</p>
        </div>
      </div>
    </footer>
  );
}

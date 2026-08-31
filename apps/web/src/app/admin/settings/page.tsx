'use client';

import { Settings, Shield, Globe, Bell, Palette, Save } from 'lucide-react';
import { useState } from 'react';
import styles from '../admin.module.css';

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>إعدادات النظام</h1>
          <p className={styles.pageSub}>تكوين إعدادات المنصة العامة</p>
        </div>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={save} id="settings-save-btn">
          <Save size={15} /> {saved ? 'تم الحفظ ✓' : 'حفظ الإعدادات'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* General */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}><Globe size={17} /> الإعدادات العامة</div>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>اسم المنصة</label>
                <input className={styles.formInput} defaultValue="Top-Pharma" id="settings-platform-name" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>البريد الرسمي</label>
                <input className={styles.formInput} defaultValue="support@top-pharma.com" id="settings-email" />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>وصف المنصة</label>
              <textarea className={styles.formTextarea} defaultValue="منصة تعليمية متخصصة لطلاب كليات الصيدلة في مصر" id="settings-description" />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}><Shield size={17} /> الأمان والخصوصية</div>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'تفعيل التحقق بخطوتين (2FA)', id: 's-2fa', checked: true },
              { label: 'تسجيل سجلات التدقيق (Audit Logs)', id: 's-audit', checked: true },
              { label: 'تفعيل التسجيل للمستخدمين الجدد', id: 's-reg', checked: true },
              { label: 'السماح بتسجيل الدخول بـ Google', id: 's-google', checked: false },
            ].map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{item.label}</span>
                <input type="checkbox" defaultChecked={item.checked} id={item.id} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--primary)' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Notifications config */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}><Bell size={17} /> إعدادات الإشعارات</div>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'إشعارات اشتراك جديد', id: 'n-sub', checked: true },
              { label: 'إشعارات عمليات الدفع', id: 'n-pay', checked: true },
              { label: 'إشعارات تسجيل مستخدم جديد', id: 'n-user', checked: false },
              { label: 'إشعارات البريد الإلكتروني', id: 'n-email', checked: true },
            ].map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{item.label}</span>
                <input type="checkbox" defaultChecked={item.checked} id={item.id} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--primary)' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Megaphone, Plus, Edit2, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import styles from '../admin.module.css';

const MOCK_ANNOUNCEMENTS = [
  { id: 1, title: 'انطلاق الترم الثاني!', body: 'نُعلن عن بداية الفصل الدراسي الثاني ورفع محتوى جديد لجميع الجامعات.', isPublished: true, createdAt: '2024-02-01' },
  { id: 2, title: 'صيانة مجدولة', body: 'سيكون الموقع في وضع الصيانة يوم الجمعة من 2–4 صباحاً.', isPublished: true, createdAt: '2024-02-10' },
  { id: 3, title: 'مسابقة أفضل طالب', body: 'اشترك في مسابقتنا الشهرية واربح اشتراكاً مجانياً لمدة 3 أشهر!', isPublished: false, createdAt: '2024-02-15' },
];

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setAnnouncements(prev => [{ id: Date.now(), ...form, isPublished: false, createdAt: new Date().toISOString().slice(0, 10) }, ...prev]);
    setForm({ title: '', body: '' });
    setShowModal(false);
  };

  const togglePublish = (id: number) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isPublished: !a.isPublished } : a));
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>الإعلانات</h1>
          <p className={styles.pageSub}>إدارة الإعلانات المعروضة للمستخدمين</p>
        </div>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowModal(true)} id="announce-add-btn">
          <Plus size={15} /> إعلان جديد
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {announcements.map((a) => (
          <div key={a.id} className={styles.card} id={`announce-${a.id}`} style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(108,99,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                <Megaphone size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>{a.title}</span>
                  <span className={`${styles.badge} ${a.isPublished ? styles.badgeGreen : styles.badgeYellow}`}>
                    {a.isPublished ? 'منشور' : 'مسودة'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 'auto' }}>{a.createdAt}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>{a.body}</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className={`${styles.btn} ${a.isPublished ? styles.btnDanger : styles.btnSuccess} ${styles.btnIcon}`}
                  onClick={() => togglePublish(a.id)}
                  title={a.isPublished ? 'إلغاء النشر' : 'نشر'}
                  id={`announce-toggle-${a.id}`}
                >
                  {a.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  className={`${styles.btn} ${styles.btnDanger} ${styles.btnIcon}`}
                  onClick={() => setDeleteId(a.id)}
                  title="حذف"
                  id={`announce-delete-${a.id}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} id="announce-modal">
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>إعلان جديد</div>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={save}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>عنوان الإعلان *</label>
                  <input className={styles.formInput} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required id="announce-form-title" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>نص الإعلان *</label>
                  <textarea className={styles.formTextarea} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required id="announce-form-body" />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} id="announce-form-save">حفظ كمسودة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className={styles.modalOverlay} onClick={() => setDeleteId(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} id="announce-delete-modal">
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle} style={{ color: 'var(--error)' }}>حذف الإعلان</div>
              <button className={styles.modalClose} onClick={() => setDeleteId(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>هل أنت متأكد من حذف هذا الإعلان؟</p>
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setDeleteId(null)}>إلغاء</button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => { setAnnouncements(prev => prev.filter(a => a.id !== deleteId)); setDeleteId(null); }} id="announce-delete-confirm">
                <Trash2 size={14} /> حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

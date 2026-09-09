'use client';

import {
  Megaphone, Plus, Edit2, Trash2, X, Eye, EyeOff,
  Loader2, AlertCircle, CheckCircle, RefreshCw, Search,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';
import styles from '../admin.module.css';

interface Announcement {
  id: string;
  titleAr: string;
  titleEn?: string | null;
  bodyAr: string;
  bodyEn?: string | null;
  isPublished: boolean;
  createdAt: string;
  university?: { nameAr: string } | null;
  college?: { nameAr: string } | null;
}

const emptyForm = {
  titleAr: '',
  titleEn: '',
  bodyAr: '',
  bodyEn: '',
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<Announcement | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch announcements ──
  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const searchParam = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
      // Fetch all (admin sees both published & drafts)
      const res = await api.get(`/announcements?limit=100${searchParam}`);
      const payload = res.data?.data ?? res.data;
      const list: Announcement[] = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];
      setAnnouncements(list);
    } catch {
      setError('تعذر تحميل الإعلانات. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [search, filterPublished]);

  useEffect(() => {
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterPublished]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // ── Open create modal ──
  const openCreate = () => {
    setEditData(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  // ── Open edit modal ──
  const openEdit = (a: Announcement) => {
    setEditData(a);
    setForm({
      titleAr: a.titleAr,
      titleEn: a.titleEn || '',
      bodyAr: a.bodyAr,
      bodyEn: a.bodyEn || '',
    });
    setFormError('');
    setShowModal(true);
  };

  // ── Save (create or update) ──
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleAr.trim() || !form.bodyAr.trim()) {
      setFormError('العنوان والنص بالعربية حقلان إلزاميان');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editData) {
        await api.patch(`/announcements/${editData.id}`, {
          titleAr: form.titleAr.trim(),
          titleEn: form.titleEn.trim() || undefined,
          bodyAr: form.bodyAr.trim(),
          bodyEn: form.bodyEn.trim() || undefined,
        });
        showSuccess('تم تعديل الإعلان بنجاح');
      } else {
        await api.post('/announcements', {
          titleAr: form.titleAr.trim(),
          titleEn: form.titleEn.trim() || undefined,
          bodyAr: form.bodyAr.trim(),
          bodyEn: form.bodyEn.trim() || undefined,
          isPublished: false,
        });
        showSuccess('تم إنشاء الإعلان كمسودة بنجاح');
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'حدث خطأ أثناء الحفظ';
      setFormError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle publish ──
  const togglePublish = async (id: string) => {
    try {
      await api.patch(`/announcements/${id}/toggle-published`);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isPublished: !a.isPublished } : a)),
      );
    } catch {
      setError('تعذر تغيير حالة نشر الإعلان');
    }
  };

  // ── Delete ──
  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/announcements/${deleteId}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== deleteId));
      setDeleteId(null);
      showSuccess('تم حذف الإعلان بنجاح');
    } catch {
      setError('تعذر حذف الإعلان');
    } finally {
      setDeleting(false);
    }
  };

  // ── Filter in UI ──
  const filtered = announcements.filter((a) => {
    if (filterPublished === 'published' && !a.isPublished) return false;
    if (filterPublished === 'draft' && a.isPublished) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.titleAr.toLowerCase().includes(q) ||
        a.bodyAr.toLowerCase().includes(q) ||
        a.titleEn?.toLowerCase().includes(q) ||
        false
      );
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>الإعلانات</h1>
          <p className={styles.pageSub}>
            إدارة الإعلانات المعروضة للطلاب ({announcements.length} إعلان)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={fetchAnnouncements}
            id="announce-refresh-btn"
          >
            <RefreshCw size={15} /> تحديث
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={openCreate}
            id="announce-add-btn"
          >
            <Plus size={15} /> إعلان جديد
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div style={{ padding: '12px 16px', marginBottom: 20, background: 'rgba(16,185,129,0.12)', border: '1px solid var(--success)', borderRadius: 8, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid var(--error)', borderRadius: 8, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className={styles.searchBox} style={{ flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            className={styles.searchInput}
            placeholder="بحث في الإعلانات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="announce-search-input"
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterPublished}
          onChange={(e) => setFilterPublished(e.target.value as any)}
          id="announce-filter-select"
        >
          <option value="all">جميع الإعلانات</option>
          <option value="published">المنشورة فقط</option>
          <option value="draft">المسودات فقط</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto', color: 'var(--primary)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><Megaphone size={28} /></div>
            <div className={styles.emptyTitle}>لا توجد إعلانات</div>
            <div className={styles.emptyDesc}>أضف أول إعلان لتظهر هنا</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((a) => (
            <div key={a.id} className={styles.card} id={`announce-${a.id}`} style={{ padding: 0 }}>
              <div style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(108,99,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                  <Megaphone size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>{a.titleAr}</span>
                    {a.titleEn && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{a.titleEn}</span>
                    )}
                    <span className={`${styles.badge} ${a.isPublished ? styles.badgeGreen : styles.badgeYellow}`}>
                      {a.isPublished ? 'منشور' : 'مسودة'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 'auto' }}>
                      {new Date(a.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{a.bodyAr}</p>
                  {a.college && (
                    <span style={{ fontSize: 12, color: 'var(--primary-light)', marginTop: 6, display: 'inline-block' }}>
                      🎓 {a.college.nameAr}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className={`${styles.btn} ${styles.btnSecondary} ${styles.btnIcon}`}
                    onClick={() => openEdit(a)}
                    title="تعديل"
                    id={`announce-edit-${a.id}`}
                  >
                    <Edit2 size={14} />
                  </button>
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
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} id="announce-modal" style={{ maxWidth: 560 }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>{editData ? 'تعديل الإعلان' : 'إعلان جديد'}</div>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={save}>
              <div className={styles.modalBody}>
                {formError && (
                  <div style={{ padding: '10px 14px', marginBottom: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid var(--error)', borderRadius: 6, color: 'var(--error)', fontSize: 13 }}>
                    ⚠️ {formError}
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>عنوان الإعلان (عربي) *</label>
                  <input
                    className={styles.formInput}
                    value={form.titleAr}
                    onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                    placeholder="مثال: انطلاق الترم الثاني لجميع الكليات"
                    required
                    id="announce-form-title-ar"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>عنوان الإعلان (إنجليزي)</label>
                  <input
                    className={styles.formInput}
                    value={form.titleEn}
                    onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                    placeholder="e.g. Second Semester Begins"
                    id="announce-form-title-en"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>نص الإعلان (عربي) *</label>
                  <textarea
                    className={styles.formTextarea}
                    value={form.bodyAr}
                    onChange={(e) => setForm({ ...form, bodyAr: e.target.value })}
                    placeholder="اكتب تفاصيل الإعلان هنا..."
                    required
                    rows={4}
                    id="announce-form-body-ar"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>نص الإعلان (إنجليزي)</label>
                  <textarea
                    className={styles.formTextarea}
                    value={form.bodyEn}
                    onChange={(e) => setForm({ ...form, bodyEn: e.target.value })}
                    placeholder="Announcement body in English (optional)"
                    rows={3}
                    id="announce-form-body-en"
                  />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  💡 الإعلان الجديد يُحفظ كمسودة. يمكنك نشره لاحقاً من القائمة.
                </p>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => setShowModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={saving}
                  id="announce-form-save"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  {saving ? 'جاري الحفظ...' : editData ? 'حفظ التعديلات' : 'حفظ كمسودة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <div className={styles.modalOverlay} onClick={() => setDeleteId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} id="announce-delete-modal">
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle} style={{ color: 'var(--error)' }}>حذف الإعلان</div>
              <button className={styles.modalClose} onClick={() => setDeleteId(null)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                هل أنت متأكد من حذف هذا الإعلان؟ هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setDeleteId(null)}>
                إلغاء
              </button>
              <button
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={confirmDelete}
                disabled={deleting}
                id="announce-delete-confirm"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? 'جاري الحذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Save,
  Loader2,
  AlertCircle,
  Download,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { api } from '@/lib/api/client';
import styles from '../admin.module.css';

type University = {
  id: string;
  nameAr: string;
  nameEn: string;
};

type College = {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  universityId: string;
  university?: {
    id: string;
    nameAr: string;
    nameEn: string;
  };
  _count?: {
    academicYears: number;
  };
};

const PAGE_SIZE = 8;

function toArray<T>(val: any): T[] {
  if (Array.isArray(val)) return val;
  if (Array.isArray(val?.data)) return val.data;
  if (Array.isArray(val?.data?.data)) return val.data.data;
  if (Array.isArray(val?.items)) return val.items;
  return [];
}

export default function AdminCollegesPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<College | null>(null);
  const [deleteData, setDeleteData] = useState<College | null>(null);

  // Form state
  const [form, setForm] = useState({
    nameAr: '',
    nameEn: '',
    slug: '',
    universityId: '',
    description: '',
  });

  const fetchUniversities = async () => {
    try {
      const res = await api.get('/universities?limit=100');
      const data = toArray<University>(res.data);
      setUniversities(data);
      if (data.length > 0 && !form.universityId) {
        setForm((prev) => ({ ...prev, universityId: data[0].id }));
      }
    } catch {
      console.error('Failed to load universities');
    }
  };

  const fetchColleges = async () => {
    setLoading(true);
    setError('');
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await api.get(`/colleges?limit=100${searchParam}`);
      const data = toArray<College>(res.data);
      setColleges(data);
    } catch {
      setError('تعذر تحميل قائمة الكليات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
    fetchColleges();
  }, []);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchColleges();
    }
  };

  const [selectedUni, setSelectedUni] = useState<string>('all');
  const safeList = Array.isArray(colleges) ? colleges : [];

  const filtered = useMemo(
    () =>
      safeList.filter((c) => {
        const matchesUni = selectedUni === 'all' || c.universityId === selectedUni;
        const matchesSearch =
          !search ||
          c.nameAr?.includes(search) ||
          c.nameEn?.toLowerCase().includes(search.toLowerCase()) ||
          c.university?.nameAr?.includes(search);
        return matchesUni && matchesSearch;
      }),
    [safeList, search, selectedUni],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditData(null);
    setForm({
      nameAr: '',
      nameEn: '',
      slug: '',
      universityId: universities[0]?.id || '',
      description: '',
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (c: College) => {
    setEditData(c);
    setForm({
      nameAr: c.nameAr,
      nameEn: c.nameEn,
      slug: c.slug,
      universityId: c.universityId,
      description: c.description || '',
    });
    setError('');
    setShowModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const generatedSlug =
        form.slug ||
        form.nameEn
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '') ||
        `college-${Date.now()}`;

      const payload = {
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        slug: generatedSlug,
        universityId: form.universityId,
        description: form.description,
      };

      if (editData) {
        await api.patch(`/colleges/${editData.id}`, payload);
      } else {
        await api.post('/colleges', payload);
      }

      setShowModal(false);
      fetchColleges();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء الحفظ';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string) => {
    try {
      await api.patch(`/colleges/${id}/toggle-active`);
      fetchColleges();
    } catch {
      alert('تعذر تغيير حالة الكلية');
    }
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    try {
      await api.delete(`/colleges/${deleteData.id}`);
      setDeleteData(null);
      fetchColleges();
    } catch {
      alert('تعذر حذف الكلية');
    }
  };

  const exportCSV = () => {
    const header = 'الكلية (عربي),الكلية (إنجليزي),الجامعة,الحالة';
    const rows = filtered.map(
      (c) =>
        `"${c.nameAr}","${c.nameEn}","${c.university?.nameAr || '—'}","${c.isActive ? 'نشط' : 'معطل'}"`,
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `colleges-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>إدارة الكليات</h1>
          <p className={styles.pageSub}>{safeList.length} كلية مسجّلة بالمنصة</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={exportCSV}>
            <Download size={15} /> تصدير CSV
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={openCreate}
            id="colleges-add-btn"
          >
            <Plus size={15} /> إضافة كلية
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: 20,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--error)',
            borderRadius: 8,
            color: 'var(--error)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <GraduationCap size={17} /> قائمة الكليات ({filtered.length})
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedUni}
              onChange={(e) => {
                setSelectedUni(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">جميع الجامعات ({colleges.length})</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nameAr}
                </option>
              ))}
            </select>
            <div className={styles.searchBox}>
              <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                className={styles.searchInput}
                placeholder="بحث بالاسم أو الجامعة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                id="colleges-search"
              />
            </div>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>الكلية</th>
                <th>الاسم الإنجليزي</th>
                <th>الجامعة</th>
                <th>السنوات الدراسية</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : pageData.length > 0 ? (
                pageData.map((c) => (
                  <tr key={c.id} id={`college-row-${c.id}`}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {c.nameAr}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.nameEn}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {c.university?.nameAr || '—'}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
                      {c._count?.academicYears ?? 0}
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${c.isActive ? styles.badgeGreen : styles.badgeRed}`}
                      >
                        {c.isActive ? '● نشط' : '○ معطل'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className={`${styles.btn} ${styles.btnSecondary} ${styles.btnIcon}`}
                          onClick={() => openEdit(c)}
                          id={`college-edit-${c.id}`}
                          title="تعديل"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className={`${styles.btn} ${c.isActive ? styles.btnDanger : styles.btnSuccess} ${styles.btnIcon}`}
                          onClick={() => toggleActive(c.id)}
                          title={c.isActive ? 'تعطيل' : 'تفعيل'}
                        >
                          {c.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnIcon}`}
                          onClick={() => setDeleteData(c)}
                          id={`college-delete-${c.id}`}
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}
                  >
                    لا توجد كليات مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>عرض {filtered.length} كلية</div>
          <div className={styles.paginationBtns}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              <ChevronRight size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`${styles.pageBtn} ${p === page ? styles.activePage : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className={styles.pageBtn}
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL: Add / Edit College ── */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            id="college-form-modal"
            style={{ maxWidth: 500 }}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                {editData ? 'تعديل بيانات الكلية' : 'إضافة كلية جديدة'}
              </div>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={save}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>اسم الكلية بالعربي *</label>
                  <input
                    className={styles.formInput}
                    value={form.nameAr}
                    onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                    placeholder="مثال: كلية الصيدلة"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>اسم الكلية بالإنجليزي *</label>
                  <input
                    className={styles.formInput}
                    value={form.nameEn}
                    onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                    placeholder="e.g. Faculty of Pharmacy"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>الجامعة التابعة لها *</label>
                  <select
                    className={styles.formSelect}
                    value={form.universityId}
                    onChange={(e) => setForm({ ...form, universityId: e.target.value })}
                    required
                  >
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nameAr} ({u.nameEn})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>المعرف المميز (Slug)</label>
                  <input
                    className={styles.formInput}
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="e.g. pharmacy-cu"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>الوصف</label>
                  <textarea
                    className={styles.formInput}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="وصف مختصر للكلية..."
                  />
                </div>
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
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Save size={14} />
                  )}
                  {editData ? 'حفظ التعديلات' : 'إضافة الكلية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete Confirm ── */}
      {deleteData && (
        <div className={styles.modalOverlay} onClick={() => setDeleteData(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle} style={{ color: 'var(--error)' }}>
                حذف الكلية
              </div>
              <button className={styles.modalClose} onClick={() => setDeleteData(null)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                هل أنت متأكد من حذف كلية{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{deleteData.nameAr}</strong>؟<br />
                سيتم نقل الكلية لسلة المحذوفات.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setDeleteData(null)}
              >
                إلغاء
              </button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={confirmDelete}>
                <Trash2 size={14} /> حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

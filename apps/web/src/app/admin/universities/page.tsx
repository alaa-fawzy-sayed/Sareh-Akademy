'use client';

import { useState, useEffect } from 'react';
import {
  University,
  Search,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Upload,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import styles from '../admin.module.css';

interface UniversityData {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  location: string;
  description: string | null;
  isActive: boolean;
  logoUrl: string | null;
  createdAt: string;
  _count?: {
    colleges: number;
  };
}

const emptyForm = { nameAr: '', nameEn: '', slug: '', location: '', description: '' };

export default function AdminUniversitiesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [universities, setUniversities] = useState<UniversityData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<UniversityData | null>(null);
  const [deleteData, setDeleteData] = useState<UniversityData | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const PAGE_SIZE = 8;

  const fetchUniversities = async () => {
    setLoading(true);
    setError('');
    try {
      const activeParam =
        statusFilter === 'الكل'
          ? ''
          : `&isActive=${statusFilter === 'مفعّل' ? 'true' : 'false'}`;
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      
      const res = await api.get(`/universities?page=${page}&limit=${PAGE_SIZE}${searchParam}${activeParam}`);
      if (res.data) {
        const payload = res.data?.data ?? res.data;
        const arr = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
        setUniversities(arr);
        setTotalPages(payload?.meta?.totalPages ?? 1);
        setTotalCount(payload?.meta?.total ?? arr.length);
      }
    } catch {
      setError('تعذر تحميل قائمة الجامعات. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, [page, statusFilter]);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchUniversities();
    }
  };

  const openCreate = () => {
    setEditData(null);
    setFormData(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (u: UniversityData) => {
    setEditData(u);
    setFormData({
      nameAr: u.nameAr,
      nameEn: u.nameEn,
      slug: u.slug,
      location: u.location,
      description: u.description || '',
    });
    setError('');
    setShowModal(true);
  };

  const saveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editData) {
        await api.patch(`/universities/${editData.id}`, formData);
      } else {
        await api.post('/universities', formData);
      }
      setShowModal(false);
      fetchUniversities();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء الحفظ';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string) => {
    try {
      await api.patch(`/universities/${id}/toggle-active`);
      fetchUniversities();
    } catch {
      alert('تعذر تغيير حالة الجامعة');
    }
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    try {
      await api.delete(`/universities/${deleteData.id}`);
      setDeleteData(null);
      fetchUniversities();
    } catch {
      alert('تعذر حذف الجامعة');
    }
  };

  const exportCSV = () => {
    const header = 'الاسم العربي,الاسم الإنجليزي,الموقع/المدينة,تاريخ الإضافة';
    const rows = universities.map((u) =>
      `"${u.nameAr}","${u.nameEn}","${u.location}","${new Date(u.createdAt).toLocaleDateString('ar-EG')}"`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `universities-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>إدارة الجامعات</h1>
          <p className={styles.pageSub}>{totalCount} جامعة مضافة على المنصة</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={exportCSV} id="univ-export-btn">
            <Download size={15} /> تصدير CSV
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate} id="univ-add-btn">
            <Plus size={15} /> إضافة جامعة
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBanner} style={{ marginBottom: 20 }}>⚠️ {error}</div>}

      {/* Card */}
      <div className={styles.card} id="universities-table-card">
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}><University size={17} /> قائمة الجامعات</div>
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                className={styles.searchInput}
                placeholder="بحث واضغط Enter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                id="univ-search-input"
              />
            </div>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              id="univ-status-filter"
            >
              {['الكل', 'مفعّل', 'معطل'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>الجامعة</th>
                <th>المدينة / المحافظة</th>
                <th>الكليات</th>
                <th>الحالة</th>
                <th>تاريخ الإضافة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</td>
                </tr>
              ) : universities.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}><University size={28} /></div>
                      <div className={styles.emptyTitle}>لا توجد جامعات مطابقة للبحث</div>
                    </div>
                  </td>
                </tr>
              ) : universities.map((u) => (
                <tr key={u.id} id={`univ-row-${u.id}`}>
                  <td>
                    <div className={styles.avatarCell}>
                      <div className={styles.tableAvatar} style={{ background: 'var(--gradient-accent)', borderRadius: 'var(--radius-sm)', color: '#fff', fontWeight: 700 }}>
                        {u.nameAr[0]}
                      </div>
                      <div className={styles.tableAvatarInfo}>
                        <span className={styles.tableAvatarName}>{u.nameAr}</span>
                        <span className={styles.tableAvatarSub}>{u.nameEn} (/{u.slug})</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: 13 }}>
                      <MapPin size={12} /> {u.location}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--primary-light)', textAlign: 'center' }}>
                    {u._count?.colleges ?? 0}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${u.isActive ? styles.badgeGreen : styles.badgeRed}`}>
                      {u.isActive ? '● مفعّل' : '○ معطل'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(u.createdAt).toLocaleDateString('ar-EG')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnIcon}`} title="تعديل" onClick={() => openEdit(u)} id={`univ-edit-${u.id}`}>
                        <Edit2 size={14} />
                      </button>
                      <button
                        className={`${styles.btn} ${u.isActive ? styles.btnDanger : styles.btnSuccess} ${styles.btnIcon}`}
                        title={u.isActive ? 'تعطيل' : 'تفعيل'}
                        onClick={() => toggleActive(u.id)}
                        id={`univ-toggle-${u.id}`}
                      >
                        {u.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                      <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnIcon}`} title="حذف" onClick={() => setDeleteData(u)} id={`univ-delete-${u.id}`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            صفحة {page} من {totalPages}
          </div>
          <div className={styles.paginationBtns}>
            <button className={styles.pageBtn} onClick={() => setPage(p => p - 1)} disabled={page === 1} id="univ-prev-page">
              <ChevronRight size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`${styles.pageBtn} ${p === page ? styles.activePage : ''}`} onClick={() => setPage(p)} id={`univ-page-${p}`}>{p}</button>
            ))}
            <button className={styles.pageBtn} onClick={() => setPage(p => p + 1)} disabled={page === totalPages || totalPages === 0} id="univ-next-page">
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} id="univ-form-modal">
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>{editData ? 'تعديل الجامعة' : 'إضافة جامعة جديدة'}</div>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={saveForm}>
              <div className={styles.modalBody}>
                {error && <div className={styles.errorBanner} style={{ marginBottom: 12 }}>⚠️ {error}</div>}
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>اسم الجامعة (بالعربي) *</label>
                  <input
                    className={styles.formInput}
                    placeholder="مثال: جامعة القاهرة"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    required
                    id="univ-form-name-ar"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>اسم الجامعة (بالإنجليزي) *</label>
                  <input
                    className={styles.formInput}
                    placeholder="مثال: Cairo University"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    required
                    id="univ-form-name-en"
                  />
                </div>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>الـ Slug (رابط فريد بالإنجليزية) *</label>
                    <input
                      className={styles.formInput}
                      placeholder="cairo-university"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      required
                      id="univ-form-slug"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>المدينة / المحافظة *</label>
                    <input
                      className={styles.formInput}
                      placeholder="الجيزة"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                      id="univ-form-city"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>وصف مختصر للجامعة</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="تفاصيل ووصف عن الجامعة..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    id="univ-form-description"
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving} id="univ-form-save">
                  {saving ? '... جاري الحفظ' : editData ? 'حفظ التعديلات' : 'إضافة الجامعة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteData && (
        <div className={styles.modalOverlay} onClick={() => setDeleteData(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} id="univ-delete-modal">
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle} style={{ color: 'var(--error)' }}>تأكيد الحذف</div>
              <button className={styles.modalClose} onClick={() => setDeleteData(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.9 }}>
                هل أنت متأكد من حذف جامعة <strong style={{ color: 'var(--text-primary)' }}>{deleteData.nameAr}</strong>؟
                سيتم حذف جميع الكليات والمواد التابعة لها. هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setDeleteData(null)}>إلغاء</button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={confirmDelete} id="univ-delete-confirm">
                <Trash2 size={14} /> حذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Upload,
  Film,
  FileText,
  File,
  Layers,
  Eye,
  EyeOff,
  Save,
  FolderPlus,
  Loader2,
  AlertCircle,
  Video,
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { api } from '@/lib/api/client';
import styles from '../admin.module.css';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ContentItem = {
  id: string;
  titleAr: string;
  titleEn?: string;
  type: 'VIDEO' | 'FILE' | 'QUIZ' | 'RESOURCE' | 'EXAM';
  isFree: boolean;
  displayOrder: number;
  video?: { duration?: number; viewCount?: number };
  file?: { fileType?: string; originalName?: string; downloadCount?: number };
};

type Chapter = {
  id: string;
  titleAr: string;
  titleEn?: string;
  displayOrder: number;
  contents: ContentItem[];
};

type Subject = {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  isFree: boolean;
  isPublished: boolean;
  price?: number | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  introVideoUrl?: string | null;
  semesterId: string;
  semester?: {
    id: string;
    nameAr: string;
    nameEn: string;
    academicYear?: {
      nameAr: string;
      college?: {
        nameAr: string;
        university?: { nameAr: string };
      };
    };
  };
  _count?: {
    chapters: number;
  };
  chapters?: Chapter[];
};

type SemesterOption = {
  id: string;
  nameAr: string;
  academicYear?: {
    nameAr: string;
    college?: {
      nameAr: string;
      university?: { nameAr: string };
    };
  };
};

const PAGE_SIZE = 10;

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Quick price edit state
  const [priceEditSubject, setPriceEditSubject] = useState<Subject | null>(null);
  const [priceEditValue, setPriceEditValue] = useState(0);
  const [priceEditIsFree, setPriceEditIsFree] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [error, setError] = useState('');

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [editData, setEditData] = useState<Subject | null>(null);
  const [deleteData, setDeleteData] = useState<Subject | null>(null);
  const [contentSubject, setContentSubject] = useState<Subject | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  // Form state
  const [form, setForm] = useState({
    nameAr: '',
    nameEn: '',
    slug: '',
    semesterId: '',
    price: 0,
    isFree: false,
    isPublished: true,
    description: '',
    introVideoUrl: '',
  });

  // Chapter & Content upload state
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadIsFree, setUploadIsFree] = useState(false);
  const [uploadType, setUploadType] = useState<'VIDEO' | 'FILE'>('FILE');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load Semesters & Subjects ──
  const fetchSemesters = async () => {
    try {
      const res = await api.get('/semesters?limit=100');
      const data = Array.isArray(res.data?.data?.data)
        ? res.data.data.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setSemesters(data);
      if (data.length > 0 && !form.semesterId) {
        setForm((prev) => ({ ...prev, semesterId: data[0].id }));
      }
    } catch {
      console.error('Failed to load semesters');
    }
  };

  const fetchSubjects = async () => {
    setLoading(true);
    setError('');
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await api.get(`/subjects?limit=300${searchParam}`);
      const data = Array.isArray(res.data?.data?.data)
        ? res.data.data.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setSubjects(data);
    } catch {
      setError('تعذر تحميل المواد الدراسية.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
    fetchSubjects();
  }, []);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchSubjects();
    }
  };

  // ── Filter & Paginate ──
  const filtered = useMemo(
    () =>
      subjects.filter(
        (s) =>
          !search ||
          s.nameAr.includes(search) ||
          s.nameEn.toLowerCase().includes(search.toLowerCase()) ||
          s.semester?.academicYear?.college?.nameAr?.includes(search),
      ),
    [subjects, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── CRUD ──
  const openCreate = () => {
    setEditData(null);
    setForm({
      nameAr: '',
      nameEn: '',
      slug: '',
      semesterId: semesters[0]?.id || '',
      price: 0,
      isFree: false,
      isPublished: true,
      description: '',
      introVideoUrl: '',
    });
    setError('');
    setShowFormModal(true);
  };

  const openEdit = (s: Subject) => {
    setEditData(s);
    setForm({
      nameAr: s.nameAr,
      nameEn: s.nameEn,
      slug: s.slug,
      semesterId: s.semesterId,
      price: s.price ? Number(s.price) : 0,
      isFree: s.isFree,
      isPublished: s.isPublished,
      description: s.description || '',
      introVideoUrl: s.introVideoUrl || '',
    });
    setError('');
    setShowFormModal(true);
  };

  const saveSubject = async (e: React.FormEvent) => {
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
        `sub-${Date.now()}`;

      const payload = {
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        slug: generatedSlug,
        semesterId: form.semesterId,
        price: form.isFree ? 0 : Number(form.price),
        isFree: form.isFree,
        isPublished: form.isPublished,
        description: form.description,
        introVideoUrl: form.introVideoUrl || null,
      };

      if (editData) {
        await api.patch(`/subjects/${editData.id}`, payload);
      } else {
        await api.post('/subjects', payload);
      }

      setShowFormModal(false);
      fetchSubjects();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء الحفظ';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (id: string) => {
    try {
      await api.patch(`/subjects/${id}/toggle-published`);
      fetchSubjects();
    } catch {
      alert('تعذر تغيير حالة نشر المادة');
    }
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    try {
      await api.delete(`/subjects/${deleteData.id}`);
      setDeleteData(null);
      fetchSubjects();
    } catch {
      alert('تعذر حذف المادة');
    }
  };

  // ── Quick Price Edit ──
  const openPriceEdit = (s: Subject) => {
    setPriceEditSubject(s);
    setPriceEditValue(s.price ? Number(s.price) : 0);
    setPriceEditIsFree(s.isFree);
    setPriceError('');
  };

  const savePriceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceEditSubject) return;
    if (!priceEditIsFree && priceEditValue < 0) {
      setPriceError('السعر يجب أن يكون قيمة موجبة');
      return;
    }
    setSavingPrice(true);
    setPriceError('');
    try {
      await api.patch(`/subjects/${priceEditSubject.id}`, {
        price: priceEditIsFree ? 0 : Number(priceEditValue),
        isFree: priceEditIsFree,
      });
      setPriceEditSubject(null);
      fetchSubjects();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء حفظ السعر';
      setPriceError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSavingPrice(false);
    }
  };

  // ── Content Management ──
  const openContent = async (s: Subject) => {
    setContentSubject(s);
    setShowContentModal(true);
    setLoadingContent(true);
    try {
      const res = await api.get(`/subjects/${s.id}`);
      const fullSubject = res.data;
      setContentSubject(fullSubject);
      if (fullSubject.chapters && fullSubject.chapters.length > 0) {
        setSelectedChapterId(fullSubject.chapters[0].id);
      } else {
        setSelectedChapterId('');
      }
    } catch {
      console.error('Failed to load subject details');
    } finally {
      setLoadingContent(false);
    }
  };

  const createChapter = async () => {
    if (!newChapterTitle.trim() || !contentSubject) return;
    try {
      await api.post('/chapters', {
        titleAr: newChapterTitle.trim(),
        subjectId: contentSubject.id,
      });
      setNewChapterTitle('');
      // Reload subject content
      const res = await api.get(`/subjects/${contentSubject.id}`);
      setContentSubject(res.data);
      if (res.data.chapters?.length) {
        setSelectedChapterId(res.data.chapters[res.data.chapters.length - 1].id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'تعذر إنشاء الفصل');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !contentSubject || !selectedChapterId) {
      if (!selectedChapterId) alert('يرجى اختيار أو إنشاء فصل أولاً قبل رفع المحتوى');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chapterId', selectedChapterId);
    formData.append('titleAr', uploadTitle || file.name);
    formData.append('isFree', uploadIsFree ? 'true' : 'false');

    try {
      const isVideo = file.type.startsWith('video/') || uploadType === 'VIDEO';
      const endpoint = isVideo ? '/content/upload/video' : '/content/upload/file';

      await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload
      const res = await api.get(`/subjects/${contentSubject.id}`);
      setContentSubject(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'حدث خطأ أثناء رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const deleteContentItem = async (contentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;
    try {
      await api.delete(`/content/${contentId}`);
      if (contentSubject) {
        const res = await api.get(`/subjects/${contentSubject.id}`);
        setContentSubject(res.data);
      }
    } catch {
      alert('تعذر حذف الملف');
    }
  };

  // ── Export CSV ──
  const exportCSV = () => {
    const header = 'المادة (عربي),المادة (إنجليزي),الكلية,السعر,مجاني,الحالة';
    const rows = filtered.map(
      (s) =>
        `"${s.nameAr}","${s.nameEn}","${s.semester?.academicYear?.college?.nameAr || 'عام'}","${s.price || 0}","${s.isFree ? 'نعم' : 'لا'}","${s.isPublished ? 'منشور' : 'مسودة'}"`,
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subjects-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>إدارة المواد الدراسية</h1>
          <p className={styles.pageSub}>{subjects.length} مادة دراسية مسجّلة بالمنصة</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={exportCSV}
            id="subjects-export-btn"
          >
            <Download size={15} /> تصدير CSV
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={openCreate}
            id="subjects-add-btn"
          >
            <Plus size={15} /> إضافة مادة
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

      {/* ── Table Card ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <BookOpen size={17} /> قائمة المواد
          </div>
          <div className={styles.searchBox}>
            <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              className={styles.searchInput}
              placeholder="بحث بالاسم أو الكلية..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              id="subjects-search"
            />
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>المادة</th>
                <th>الاسم الإنجليزي</th>
                <th>الكلية / الفصل</th>
                <th>السعر</th>
                <th>المحتوى</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : pageData.length > 0 ? (
                pageData.map((s) => (
                  <tr key={s.id} id={`subject-row-${s.id}`}>
                    <td>
                      <div className={styles.tableAvatarInfo}>
                        <span className={styles.tableAvatarName}>{s.nameAr}</span>
                        <span className={styles.tableAvatarSub}>{s.slug}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.nameEn}</td>
                    <td style={{ fontSize: 13 }}>
                      {s.semester?.academicYear?.college?.nameAr
                        ? `${s.semester.academicYear.college.nameAr} - ${s.semester.nameAr}`
                        : s.semester?.nameAr || '—'}
                    </td>
                    <td>
                      <button
                        className={`${styles.badge} ${s.isFree ? styles.badgeGreen : styles.badgePurple}`}
                        style={{ cursor: 'pointer', border: 'none', gap: 4 }}
                        onClick={() => openPriceEdit(s)}
                        id={`subject-price-${s.id}`}
                        title="تعديل السعر"
                      >
                        <Edit2 size={10} />
                        {s.isFree ? 'مجاني' : `${s.price || 0} ج.م`}
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Link
                        href={`/admin/content?subjectId=${s.id}`}
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        style={{
                          fontSize: 12,
                          gap: 6,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '6px 12px',
                          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                          color: '#fff',
                          borderRadius: 8,
                          fontWeight: 600,
                        }}
                        id={`subject-content-${s.id}`}
                        title="فتح استوديو رفع وإدارة الفيديوهات والمحتوى لهذه المادة"
                      >
                        <Video size={13} /> استوديو المحتوى ({s._count?.chapters ?? s.chapters?.length ?? 0})
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${s.isPublished ? styles.badgeGreen : styles.badgeRed}`}
                      >
                        {s.isPublished ? '● منشور' : '○ مسودة'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className={`${styles.btn} ${styles.btnSecondary} ${styles.btnIcon}`}
                          onClick={() => openEdit(s)}
                          id={`subject-edit-${s.id}`}
                          title="تعديل"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className={`${styles.btn} ${s.isPublished ? styles.btnDanger : styles.btnSuccess} ${styles.btnIcon}`}
                          onClick={() => togglePublished(s.id)}
                          id={`subject-toggle-${s.id}`}
                          title={s.isPublished ? 'إلغاء النشر' : 'نشر'}
                        >
                          {s.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnIcon}`}
                          onClick={() => setDeleteData(s)}
                          id={`subject-delete-${s.id}`}
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
                    colSpan={7}
                    style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}
                  >
                    لا توجد مواد مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>عرض {filtered.length} مادة</div>
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

      {/* ══════════════════════════════════════════
          MODAL: Add / Edit Subject
      ══════════════════════════════════════════ */}
      {showFormModal && (
        <div className={styles.modalOverlay} onClick={() => setShowFormModal(false)}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            id="subject-form-modal"
            style={{ maxWidth: 540 }}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                {editData ? 'تعديل المادة' : 'إضافة مادة جديدة'}
              </div>
              <button className={styles.modalClose} onClick={() => setShowFormModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveSubject}>
              <div className={styles.modalBody}>
                {/* Name AR */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>اسم المادة بالعربي *</label>
                  <input
                    className={styles.formInput}
                    value={form.nameAr}
                    onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                    placeholder="مثال: الكيمياء العضوية 1"
                    required
                    id="subject-form-name-ar"
                  />
                </div>
                {/* Name EN */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>اسم المادة بالإنجليزي *</label>
                  <input
                    className={styles.formInput}
                    value={form.nameEn}
                    onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                    placeholder="e.g. Organic Chemistry I"
                    required
                    id="subject-form-name-en"
                  />
                </div>
                {/* Slug */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>المعرف المميز (Slug)</label>
                  <input
                    className={styles.formInput}
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="e.g. organic-chemistry-1"
                    id="subject-form-slug"
                  />
                </div>
                {/* Semester Selector */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>الفصل الدراسي / الكلية *</label>
                  <select
                    className={styles.formSelect}
                    value={form.semesterId}
                    onChange={(e) => setForm({ ...form, semesterId: e.target.value })}
                    required
                    id="subject-form-semester"
                  >
                    {(Array.isArray(semesters) ? semesters : []).map((sem) => (
                      <option key={sem.id} value={sem.id}>
                        {sem.academicYear?.college?.nameAr
                          ? `${sem.academicYear.college.nameAr} - ${sem.academicYear.nameAr} (${sem.nameAr})`
                          : sem.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Free / Price */}
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>السعر (ج.م)</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      disabled={form.isFree}
                      id="subject-form-price"
                    />
                  </div>
                  <div
                    className={styles.formGroup}
                    style={{ display: 'flex', alignItems: 'center', marginTop: 25, gap: 8 }}
                  >
                    <input
                      type="checkbox"
                      id="subject-form-free"
                      checked={form.isFree}
                      onChange={(e) => setForm({ ...form, isFree: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                    />
                    <label
                      htmlFor="subject-form-free"
                      className={styles.formLabel}
                      style={{ margin: 0, cursor: 'pointer' }}
                    >
                      مادة مجانية
                    </label>
                  </div>
                </div>
                {/* Description */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>نبذة ومقدمة عن المادة</label>
                  <textarea
                    className={styles.formInput}
                    style={{ minHeight: 70 }}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="نبذة تشرح ما سيتعلمه الطالب في هذا المقرر..."
                    id="subject-form-desc"
                  />
                </div>

                {/* Intro Video URL */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>رابط الفيديو التعريفي / الترويجي (Intro Video)</label>
                  <input
                    className={styles.formInput}
                    value={form.introVideoUrl}
                    onChange={(e) => setForm({ ...form, introVideoUrl: e.target.value })}
                    placeholder="رابط YouTube أو فيديو مباشر MP4 (معاينة مجانية للجميع)"
                    id="subject-form-intro-video"
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, display: 'block' }}>
                    يظهر هذا الفيديو كمعاينة ترويجية مجانية للطالب في صفحة المادة لشرح المقرر قبل الاشتراك.
                  </small>
                </div>

                {/* Publication Status */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>حالة النشر</label>
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: form.isPublished ? 'var(--primary)' : 'var(--text-muted)' }}>
                      <input
                        type="radio"
                        name="subjectPublishedStatus"
                        checked={form.isPublished}
                        onChange={() => setForm({ ...form, isPublished: true })}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span>● منشور للطلاب على المنصة</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: !form.isPublished ? '#f59e0b' : 'var(--text-muted)' }}>
                      <input
                        type="radio"
                        name="subjectPublishedStatus"
                        checked={!form.isPublished}
                        onChange={() => setForm({ ...form, isPublished: false })}
                        style={{ accentColor: '#f59e0b' }}
                      />
                      <span>○ مسودة قيد التجهيز (مخفي مؤقتاً)</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => setShowFormModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={saving}
                  id="subject-form-save"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Save size={14} />
                  )}
                  {editData ? 'حفظ التعديلات' : 'إضافة المادة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: Quick Price Edit
      ══════════════════════════════════════════ */}
      {priceEditSubject && (
        <div className={styles.modalOverlay} onClick={() => setPriceEditSubject(null)}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            id="price-edit-modal"
            style={{ maxWidth: 400 }}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>تعديل سعر المادة</div>
              <button className={styles.modalClose} onClick={() => setPriceEditSubject(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={savePriceEdit}>
              <div className={styles.modalBody}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
                  المادة: <strong style={{ color: 'var(--text-primary)' }}>{priceEditSubject.nameAr}</strong>
                </p>
                {/* Free toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <input
                    type="checkbox"
                    id="price-edit-free"
                    checked={priceEditIsFree}
                    onChange={(e) => { setPriceEditIsFree(e.target.checked); if (e.target.checked) setPriceEditValue(0); }}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                  <label htmlFor="price-edit-free" style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                    مادة مجانية (بدون سعر)
                  </label>
                </div>
                {/* Price input */}
                {!priceEditIsFree && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>السعر (ج.م) *</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      value={priceEditValue}
                      onChange={(e) => setPriceEditValue(Number(e.target.value))}
                      min={1}
                      step={1}
                      placeholder="مثال: 450"
                      id="price-edit-value"
                      required
                    />
                  </div>
                )}
                {priceError && (
                  <div style={{ color: 'var(--error)', fontSize: 13, marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <AlertCircle size={14} /> {priceError}
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setPriceEditSubject(null)}>إلغاء</button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={savingPrice} id="price-edit-save">
                  {savingPrice ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  حفظ السعر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: Content & Chapters Management
      ══════════════════════════════════════════ */}
      {showContentModal && contentSubject && (
        <div className={styles.modalOverlay} onClick={() => setShowContentModal(false)}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            id="subject-content-modal"
            style={{ maxWidth: 700, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <Layers size={16} /> محتوى وفصول — {contentSubject.nameAr}
              </div>
              <button className={styles.modalClose} onClick={() => setShowContentModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody} style={{ flex: 1, overflowY: 'auto' }}>
              {loadingContent ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} />
                </div>
              ) : (
                <>
                  {/* Create Chapter Section */}
                  <div
                    style={{
                      background: 'var(--glass-bg)',
                      padding: 14,
                      borderRadius: 10,
                      marginBottom: 16,
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    <input
                      className={styles.formInput}
                      style={{ flex: 1 }}
                      placeholder="اسم الفصل الجديد (مثال: الفصل الأول — مقدمة)"
                      value={newChapterTitle}
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      id="new-chapter-input"
                    />
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={createChapter}
                      style={{ flexShrink: 0 }}
                    >
                      <FolderPlus size={15} /> إضافة فصل
                    </button>
                  </div>

                  {/* Upload Area */}
                  {contentSubject.chapters && contentSubject.chapters.length > 0 ? (
                    <div
                      style={{
                        border: '2px dashed var(--glass-border)',
                        borderRadius: 12,
                        padding: '16px',
                        marginBottom: 20,
                        background: 'var(--glass-bg)',
                      }}
                    >
                      <div className={styles.formGrid2} style={{ marginBottom: 10 }}>
                        <div>
                          <label className={styles.formLabel}>الفصل المستهدف</label>
                          <select
                            className={styles.formSelect}
                            value={selectedChapterId}
                            onChange={(e) => setSelectedChapterId(e.target.value)}
                          >
                            {contentSubject.chapters.map((ch) => (
                              <option key={ch.id} value={ch.id}>
                                {ch.titleAr}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={styles.formLabel}>عنوان المحتوى / الدرس</label>
                          <input
                            className={styles.formInput}
                            value={uploadTitle}
                            onChange={(e) => setUploadTitle(e.target.value)}
                            placeholder="مثال: محاضرة 1 — التفاعلات"
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 12,
                        }}
                      >
                        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                          <label style={{ fontSize: 13, cursor: 'pointer', display: 'flex', gap: 6 }}>
                            <input
                              type="radio"
                              name="uploadType"
                              checked={uploadType === 'FILE'}
                              onChange={() => setUploadType('FILE')}
                            />
                            مستند (PDF / Word / PPT)
                          </label>
                          <label style={{ fontSize: 13, cursor: 'pointer', display: 'flex', gap: 6 }}>
                            <input
                              type="radio"
                              name="uploadType"
                              checked={uploadType === 'VIDEO'}
                              onChange={() => setUploadType('VIDEO')}
                            />
                            فيديو (MP4)
                          </label>
                        </div>

                        <label style={{ fontSize: 13, cursor: 'pointer', display: 'flex', gap: 6 }}>
                          <input
                            type="checkbox"
                            checked={uploadIsFree}
                            onChange={(e) => setUploadIsFree(e.target.checked)}
                          />
                          درس مجاني (معاينة)
                        </label>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        id="content-file-input"
                        style={{ display: 'none' }}
                        accept={
                          uploadType === 'VIDEO'
                            ? 'video/*'
                            : '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip'
                        }
                        onChange={handleFileUpload}
                      />
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        style={{ width: '100%', justifyContent: 'center', gap: 8, padding: '10px' }}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Upload size={16} />
                        )}
                        {uploading
                          ? 'جاري الرفع والمعالجة...'
                          : `اختر ملف ${uploadType === 'VIDEO' ? 'فيديو' : 'مستند'} للرفع`}
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '20px 0',
                        color: 'var(--text-muted)',
                        background: 'var(--glass-bg)',
                        borderRadius: 10,
                        marginBottom: 16,
                      }}
                    >
                      <p>يرجى إضافة أول فصل للمادة أعلاه لتتمكن من رفع الفيديوهات والملفات</p>
                    </div>
                  )}

                  {/* Chapters & Content Tree */}
                  {contentSubject.chapters && contentSubject.chapters.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {contentSubject.chapters.map((chapter) => (
                        <div
                          key={chapter.id}
                          style={{
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 10,
                            padding: 14,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 15,
                              color: 'var(--text-primary)',
                              marginBottom: 10,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>📁 {chapter.titleAr}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {chapter.contents?.length || 0} درس / ملف
                            </span>
                          </div>

                          {chapter.contents && chapter.contents.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {chapter.contents.map((c) => (
                                <div
                                  key={c.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '8px 12px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: 8,
                                  }}
                                >
                                  {c.type === 'VIDEO' ? (
                                    <Film size={15} color="#6C63FF" />
                                  ) : (
                                    <FileText size={15} color="#EF4444" />
                                  )}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                      }}
                                    >
                                      {c.titleAr}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                      {c.type} {c.isFree && '• مجاني'}
                                    </div>
                                  </div>
                                  <button
                                    className={`${styles.btn} ${styles.btnDanger} ${styles.btnIcon}`}
                                    onClick={() => deleteContentItem(c.id)}
                                    title="حذف"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                              لا توجد دروس في هذا الفصل بعد.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setShowContentModal(false)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: Delete Confirm
      ══════════════════════════════════════════ */}
      {deleteData && (
        <div className={styles.modalOverlay} onClick={() => setDeleteData(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle} style={{ color: 'var(--error)' }}>
                حذف المادة
              </div>
              <button className={styles.modalClose} onClick={() => setDeleteData(null)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                هل أنت متأكد من حذف مادة{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{deleteData.nameAr}</strong>؟<br />
                سيتم نقل المادة لسلة المحذوفات.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setDeleteData(null)}
              >
                إلغاء
              </button>
              <button
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={confirmDelete}
                id="subject-delete-confirm"
              >
                <Trash2 size={14} /> حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

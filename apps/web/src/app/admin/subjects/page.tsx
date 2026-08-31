'use client';

import {
  BookOpen, Plus, Edit2, Trash2, Search, X, Download,
  ChevronLeft, ChevronRight, Upload, Film, FileText,
  File, Layers, Eye, EyeOff, Save
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import styles from '../admin.module.css';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ContentItem = {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'word' | 'other';
  fileName: string;
  size: string;
  uploadedAt: string;
  dataUrl?: string; // base64 for local storage demo
};

type Subject = {
  id: string;
  nameAr: string;
  nameEn: string;
  college: string;
  year: number;
  semester: number;
  isFree: boolean;
  isActive: boolean;
  studentsCount: number;
  content: ContentItem[];
};

// ─────────────────────────────────────────────
// Default pharmacy subjects (مواد الصيدلة)
// ─────────────────────────────────────────────
const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'ph-1',  nameAr: 'الكيمياء العضوية 1',    nameEn: 'Organic Chemistry I',      college: 'كلية الصيدلة', year: 1, semester: 1, isFree: false, isActive: true, studentsCount: 0, content: [] },
  { id: 'ph-2',  nameAr: 'الكيمياء العضوية 2',    nameEn: 'Organic Chemistry II',     college: 'كلية الصيدلة', year: 1, semester: 2, isFree: false, isActive: true, studentsCount: 0, content: [] },
  { id: 'ph-3',  nameAr: 'الكيمياء التحليلية 1',  nameEn: 'Analytical Chemistry I',   college: 'كلية الصيدلة', year: 2, semester: 1, isFree: false, isActive: true, studentsCount: 0, content: [] },
  { id: 'ph-4',  nameAr: 'الكيمياء التحليلية 2',  nameEn: 'Analytical Chemistry II',  college: 'كلية الصيدلة', year: 2, semester: 2, isFree: false, isActive: true, studentsCount: 0, content: [] },
  { id: 'ph-5',  nameAr: 'الرياضيات',              nameEn: 'Math',                     college: 'كلية الصيدلة', year: 1, semester: 1, isFree: true,  isActive: true, studentsCount: 0, content: [] },
  { id: 'ph-6',  nameAr: 'الصيدلة الفيزيائية',    nameEn: 'Physical Pharmacy',        college: 'كلية الصيدلة', year: 2, semester: 1, isFree: false, isActive: true, studentsCount: 0, content: [] },
  { id: 'ph-7',  nameAr: 'الفسيولوجيا',            nameEn: 'Physiology',               college: 'كلية الصيدلة', year: 1, semester: 2, isFree: false, isActive: true, studentsCount: 0, content: [] },
  { id: 'ph-8',  nameAr: 'الفارماكولوجيا 1',       nameEn: 'Pharmacology I',           college: 'كلية الصيدلة', year: 3, semester: 1, isFree: false, isActive: true, studentsCount: 0, content: [] },
  { id: 'ph-9',  nameAr: 'الفارماكولوجيا 2',       nameEn: 'Pharmacology II',          college: 'كلية الصيدلة', year: 3, semester: 2, isFree: false, isActive: true, studentsCount: 0, content: [] },
  { id: 'ph-10', nameAr: 'الفارماكولوجيا 3',       nameEn: 'Pharmacology III',         college: 'كلية الصيدلة', year: 4, semester: 1, isFree: false, isActive: true, studentsCount: 0, content: [] },
  { id: 'ph-11', nameAr: 'النباتات الطبية',         nameEn: 'Medicinal Plants',         college: 'كلية الصيدلة', year: 4, semester: 1, isFree: false, isActive: true, studentsCount: 0, content: [] },
  { id: 'ph-12', nameAr: 'علم العقاقير',            nameEn: 'Pharmacognosy',            college: 'كلية الصيدلة', year: 4, semester: 2, isFree: false, isActive: true, studentsCount: 0, content: [] },
];

const STORAGE_KEY = 'top_pharma_subjects';
const PAGE_SIZE = 10;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function detectFileType(name: string, mime: string): ContentItem['type'] {
  if (mime.startsWith('video/')) return 'video';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.includes('word') || name.endsWith('.docx') || name.endsWith('.doc')) return 'word';
  return 'other';
}

function fileIcon(type: ContentItem['type']) {
  if (type === 'video') return <Film size={15} color="#6C63FF" />;
  if (type === 'pdf')   return <FileText size={15} color="#EF4444" />;
  if (type === 'word')  return <File size={15} color="#3B82F6" />;
  return <File size={15} color="#F59E0B" />;
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [showFormModal, setShowFormModal]       = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [editData, setEditData]   = useState<Subject | null>(null);
  const [deleteData, setDeleteData] = useState<Subject | null>(null);
  const [contentSubject, setContentSubject] = useState<Subject | null>(null);

  // Form state
  const [form, setForm] = useState({
    nameAr: '', nameEn: '', college: 'كلية الصيدلة',
    year: 1, semester: 1, isFree: false,
  });

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');

  // ── Load from localStorage ──
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSubjects(JSON.parse(stored));
      } else {
        setSubjects(DEFAULT_SUBJECTS);
      }
    } catch {
      setSubjects(DEFAULT_SUBJECTS);
    }
  }, []);

  // ── Save to localStorage on change ──
  const persist = (updated: Subject[]) => {
    setSubjects(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
  };

  // ── Filter & Paginate ──
  const filtered = useMemo(() =>
    subjects.filter(s =>
      !search ||
      s.nameAr.includes(search) ||
      s.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      s.college.includes(search)
    ),
    [subjects, search]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── CRUD ──
  const openCreate = () => {
    setEditData(null);
    setForm({ nameAr: '', nameEn: '', college: 'كلية الصيدلة', year: 1, semester: 1, isFree: false });
    setShowFormModal(true);
  };

  const openEdit = (s: Subject) => {
    setEditData(s);
    setForm({ nameAr: s.nameAr, nameEn: s.nameEn, college: s.college, year: s.year, semester: s.semester, isFree: s.isFree });
    setShowFormModal(true);
  };

  const saveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (editData) {
      persist(subjects.map(s => s.id === editData.id ? { ...s, ...form } : s));
    } else {
      persist([...subjects, {
        id: `ph-${Date.now()}`,
        ...form,
        isActive: true,
        studentsCount: 0,
        content: [],
      }]);
    }
    setShowFormModal(false);
  };

  const toggleActive = (id: string) =>
    persist(subjects.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));

  const confirmDelete = () => {
    if (deleteData) {
      persist(subjects.filter(s => s.id !== deleteData.id));
      setDeleteData(null);
    }
  };

  // ── Content Management ──
  const openContent = (s: Subject) => {
    setContentSubject(s);
    setUploadTitle('');
    setShowContentModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !contentSubject) return;
    setUploading(true);

    const reader = new FileReader();
    reader.onload = () => {
      const newItem: ContentItem = {
        id: `c-${Date.now()}`,
        title: uploadTitle || file.name,
        type: detectFileType(file.name, file.type),
        fileName: file.name,
        size: formatBytes(file.size),
        uploadedAt: new Date().toLocaleDateString('ar-EG'),
        dataUrl: reader.result as string,
      };

      const updated = subjects.map(s =>
        s.id === contentSubject.id
          ? { ...s, content: [...s.content, newItem] }
          : s
      );
      persist(updated);
      setContentSubject(updated.find(s => s.id === contentSubject.id) || null);
      setUploading(false);
      setUploadTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const deleteContent = (subjectId: string, contentId: string) => {
    const updated = subjects.map(s =>
      s.id === subjectId
        ? { ...s, content: s.content.filter(c => c.id !== contentId) }
        : s
    );
    persist(updated);
    setContentSubject(updated.find(s => s.id === subjectId) || null);
  };

  // ── Export CSV ──
  const exportCSV = () => {
    const header = 'المادة (عربي),المادة (إنجليزي),الكلية,السنة,الفصل,مجاني,المحتوى,الحالة';
    const rows = filtered.map(s =>
      `${s.nameAr},${s.nameEn},${s.college},${s.year},${s.semester},${s.isFree ? 'نعم' : 'لا'},${s.content.length},${s.isActive ? 'نشط' : 'معطل'}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `pharmacy-subjects-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>إدارة مواد الصيدلة</h1>
          <p className={styles.pageSub}>{subjects.length} مادة دراسية • كليات الصيدلة</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={exportCSV} id="subjects-export-btn">
            <Download size={15} /> تصدير CSV
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate} id="subjects-add-btn">
            <Plus size={15} /> إضافة مادة
          </button>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}><BookOpen size={17} /> قائمة المواد</div>
          <div className={styles.searchBox}>
            <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              className={styles.searchInput}
              placeholder="بحث بالاسم العربي أو الإنجليزي..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
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
                <th>السنة / الفصل</th>
                <th>نوع</th>
                <th>المحتوى</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(s => (
                <tr key={s.id} id={`subject-row-${s.id}`}>
                  <td>
                    <div className={styles.tableAvatarInfo}>
                      <span className={styles.tableAvatarName}>{s.nameAr}</span>
                      <span className={styles.tableAvatarSub}>{s.college}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.nameEn}</td>
                  <td style={{ fontSize: 13, textAlign: 'center' }}>سنة {s.year} / فصل {s.semester}</td>
                  <td>
                    <span className={`${styles.badge} ${s.isFree ? styles.badgeGreen : styles.badgePurple}`}>
                      {s.isFree ? 'مجاني' : 'مدفوع'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      style={{ fontSize: 12, gap: 5 }}
                      onClick={() => openContent(s)}
                      id={`subject-content-${s.id}`}
                    >
                      <Layers size={13} /> {s.content.length} ملف
                    </button>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${s.isActive ? styles.badgeGreen : styles.badgeRed}`}>
                      {s.isActive ? '● نشط' : '○ معطل'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnIcon}`}
                        onClick={() => openEdit(s)} id={`subject-edit-${s.id}`}
                        title="تعديل"
                      ><Edit2 size={14} /></button>
                      <button
                        className={`${styles.btn} ${s.isActive ? styles.btnDanger : styles.btnSuccess} ${styles.btnIcon}`}
                        onClick={() => toggleActive(s.id)} id={`subject-toggle-${s.id}`}
                        title={s.isActive ? 'تعطيل' : 'تفعيل'}
                      >{s.isActive ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                      <button
                        className={`${styles.btn} ${styles.btnDanger} ${styles.btnIcon}`}
                        onClick={() => setDeleteData(s)} id={`subject-delete-${s.id}`}
                        title="حذف"
                      ><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageData.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
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
            <button className={styles.pageBtn} onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              <ChevronRight size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`${styles.pageBtn} ${p === page ? styles.activePage : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className={styles.pageBtn} onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
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
          <div className={styles.modal} onClick={e => e.stopPropagation()} id="subject-form-modal"
            style={{ maxWidth: 540 }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>{editData ? 'تعديل المادة' : 'إضافة مادة جديدة'}</div>
              <button className={styles.modalClose} onClick={() => setShowFormModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={saveSubject}>
              <div className={styles.modalBody}>
                {/* Name AR */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>اسم المادة بالعربي *</label>
                  <input
                    className={styles.formInput}
                    value={form.nameAr}
                    onChange={e => setForm({ ...form, nameAr: e.target.value })}
                    placeholder="مثال: الكيمياء العضوية 1"
                    required id="subject-form-name-ar"
                  />
                </div>
                {/* Name EN */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>اسم المادة بالإنجليزي</label>
                  <input
                    className={styles.formInput}
                    value={form.nameEn}
                    onChange={e => setForm({ ...form, nameEn: e.target.value })}
                    placeholder="e.g. Organic Chemistry I"
                    id="subject-form-name-en"
                  />
                </div>
                {/* College */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>الكلية</label>
                  <input
                    className={styles.formInput}
                    value={form.college}
                    onChange={e => setForm({ ...form, college: e.target.value })}
                    placeholder="مثال: كلية الصيدلة"
                    id="subject-form-college"
                  />
                </div>
                {/* Year & Semester */}
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>السنة الدراسية</label>
                    <select
                      className={styles.formSelect}
                      value={form.year}
                      onChange={e => setForm({ ...form, year: Number(e.target.value) })}
                      id="subject-form-year"
                    >
                      {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>سنة {y}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>الفصل الدراسي</label>
                    <select
                      className={styles.formSelect}
                      value={form.semester}
                      onChange={e => setForm({ ...form, semester: Number(e.target.value) })}
                      id="subject-form-semester"
                    >
                      <option value={1}>الفصل الأول</option>
                      <option value={2}>الفصل الثاني</option>
                    </select>
                  </div>
                </div>
                {/* Free */}
                <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox" id="subject-form-free"
                    checked={form.isFree}
                    onChange={e => setForm({ ...form, isFree: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                  />
                  <label htmlFor="subject-form-free" className={styles.formLabel} style={{ margin: 0, cursor: 'pointer' }}>
                    المادة مجانية للجميع
                  </label>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowFormModal(false)}>إلغاء</button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} id="subject-form-save">
                  <Save size={14} /> {editData ? 'حفظ التعديلات' : 'إضافة المادة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: Content Management (رفع الملفات)
      ══════════════════════════════════════════ */}
      {showContentModal && contentSubject && (
        <div className={styles.modalOverlay} onClick={() => setShowContentModal(false)}>
          <div
            className={styles.modal}
            onClick={e => e.stopPropagation()}
            id="subject-content-modal"
            style={{ maxWidth: 620, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <Layers size={16} /> محتوى — {contentSubject.nameAr}
              </div>
              <button className={styles.modalClose} onClick={() => setShowContentModal(false)}><X size={18} /></button>
            </div>

            <div className={styles.modalBody} style={{ flex: 1, overflowY: 'auto' }}>
              {/* Upload Area */}
              <div style={{
                border: '2px dashed var(--glass-border)',
                borderRadius: 12,
                padding: '20px',
                marginBottom: 20,
                background: 'var(--glass-bg)',
              }}>
                <div style={{ marginBottom: 10 }}>
                  <label className={styles.formLabel}>عنوان الملف (اختياري)</label>
                  <input
                    className={styles.formInput}
                    value={uploadTitle}
                    onChange={e => setUploadTitle(e.target.value)}
                    placeholder="مثال: محاضرة 1 — مقدمة"
                    id="content-upload-title"
                  />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="content-file-input"
                  style={{ display: 'none' }}
                  accept="video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{ width: '100%', justifyContent: 'center', gap: 8, padding: '12px' }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  id="content-upload-btn"
                >
                  <Upload size={16} />
                  {uploading ? 'جاري الرفع...' : 'اختر ملف (فيديو / PDF / Word / ...)'}
                </button>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                  يدعم: MP4، PDF، Word، PowerPoint، Excel، ZIP
                </p>
              </div>

              {/* Content List */}
              {contentSubject.content.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                  <Layers size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p>لم يُضف أي محتوى بعد</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {contentSubject.content.map(c => (
                    <div key={c.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 10,
                    }}>
                      <div style={{ flexShrink: 0 }}>{fileIcon(c.type)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {c.fileName} • {c.size} • {c.uploadedAt}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {c.dataUrl && (
                          <a
                            href={c.dataUrl}
                            download={c.fileName}
                            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnIcon}`}
                            title="تنزيل"
                          ><Download size={13} /></a>
                        )}
                        <button
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnIcon}`}
                          onClick={() => deleteContent(contentSubject.id, c.id)}
                          title="حذف"
                          id={`content-delete-${c.id}`}
                        ><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowContentModal(false)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: Delete Confirm
      ══════════════════════════════════════════ */}
      {deleteData && (
        <div className={styles.modalOverlay} onClick={() => setDeleteData(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle} style={{ color: 'var(--error)' }}>حذف المادة</div>
              <button className={styles.modalClose} onClick={() => setDeleteData(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                هل أنت متأكد من حذف مادة <strong style={{ color: 'var(--text-primary)' }}>{deleteData.nameAr}</strong>؟<br />
                سيتم حذف المادة وكل محتواها ({deleteData.content.length} ملف) نهائياً.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setDeleteData(null)}>إلغاء</button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={confirmDelete} id="subject-delete-confirm">
                <Trash2 size={14} /> حذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

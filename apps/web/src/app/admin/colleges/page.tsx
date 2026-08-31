'use client';

import { GraduationCap, Plus, Edit2, Trash2, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import styles from '../admin.module.css';

const MOCK_COLLEGES = [
  { id: 'col-1', name: 'كلية الصيدلة', university: 'جامعة القاهرة', studentsCount: 234, subjectsCount: 42, isActive: true },
  { id: 'col-2', name: 'كلية الطب', university: 'جامعة القاهرة', studentsCount: 180, subjectsCount: 38, isActive: true },
  { id: 'col-3', name: 'كلية الصيدلة', university: 'جامعة الإسكندرية', studentsCount: 156, subjectsCount: 35, isActive: true },
  { id: 'col-4', name: 'كلية العلوم', university: 'جامعة عين شمس', studentsCount: 98, subjectsCount: 28, isActive: false },
  { id: 'col-5', name: 'كلية الصيدلة', university: 'جامعة المنصورة', studentsCount: 87, subjectsCount: 31, isActive: true },
  { id: 'col-6', name: 'كلية الطب البيطري', university: 'جامعة القاهرة', studentsCount: 63, subjectsCount: 22, isActive: true },
];

type College = typeof MOCK_COLLEGES[number];
const PAGE_SIZE = 8;

export default function AdminCollegesPage() {
  const [colleges, setColleges] = useState(MOCK_COLLEGES);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<College | null>(null);
  const [form, setForm] = useState({ name: '', university: '', description: '' });
  const [deleteData, setDeleteData] = useState<College | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() =>
    colleges.filter(c => !search || c.name.includes(search) || c.university.includes(search)),
    [colleges, search]
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setEditData(null); setForm({ name: '', university: '', description: '' }); setShowModal(true); };
  const openEdit = (c: College) => { setEditData(c); setForm({ name: c.name, university: c.university, description: '' }); setShowModal(true); };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (editData) {
      setColleges(prev => prev.map(c => c.id === editData.id ? { ...c, ...form } : c));
    } else {
      setColleges(prev => [...prev, { id: `col-${Date.now()}`, ...form, studentsCount: 0, subjectsCount: 0, isActive: true }]);
    }
    setShowModal(false);
  };

  const toggleActive = (id: string) => setColleges(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  const confirmDelete = () => { if (deleteData) { setColleges(prev => prev.filter(c => c.id !== deleteData.id)); setDeleteData(null); } };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>إدارة الكليات</h1>
          <p className={styles.pageSub}>{colleges.length} كلية مسجّلة</p>
        </div>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate} id="colleges-add-btn"><Plus size={15} /> إضافة كلية</button>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}><GraduationCap size={17} /> قائمة الكليات</div>
          <div className={styles.searchBox}>
            <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input className={styles.searchInput} placeholder="بحث..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} id="colleges-search" />
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>الكلية</th><th>الجامعة</th><th>الطلاب</th><th>المواد</th><th>الحالة</th><th>الإجراءات</th></tr>
            </thead>
            <tbody>
              {pageData.map(c => (
                <tr key={c.id} id={`college-row-${c.id}`}>
                  <td><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.university}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{c.studentsCount}</td>
                  <td style={{ textAlign: 'center', color: 'var(--primary-light)', fontWeight: 700 }}>{c.subjectsCount}</td>
                  <td><span className={`${styles.badge} ${c.isActive ? styles.badgeGreen : styles.badgeRed}`}>{c.isActive ? '● نشط' : '○ معطل'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnIcon}`} onClick={() => openEdit(c)} id={`college-edit-${c.id}`}><Edit2 size={14} /></button>
                      <button className={`${styles.btn} ${c.isActive ? styles.btnDanger : styles.btnSuccess} ${styles.btnIcon}`} onClick={() => toggleActive(c.id)} id={`college-toggle-${c.id}`}>{c.isActive ? '⏸' : '▶'}</button>
                      <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnIcon}`} onClick={() => setDeleteData(c)} id={`college-delete-${c.id}`}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>عرض {filtered.length} كلية</div>
          <div className={styles.paginationBtns}>
            <button className={styles.pageBtn} onClick={() => setPage(p => p - 1)} disabled={page === 1}><ChevronRight size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`${styles.pageBtn} ${p === page ? styles.activePage : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className={styles.pageBtn} onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}><ChevronLeft size={14} /></button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} id="college-form-modal">
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>{editData ? 'تعديل الكلية' : 'إضافة كلية جديدة'}</div>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={save}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>اسم الكلية *</label>
                  <input className={styles.formInput} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required id="college-form-name" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>الجامعة</label>
                  <select className={styles.formSelect} value={form.university} onChange={e => setForm({ ...form, university: e.target.value })} id="college-form-univ">
                    {['جامعة القاهرة', 'جامعة الإسكندرية', 'جامعة عين شمس', 'جامعة المنصورة'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>وصف</label>
                  <textarea className={styles.formTextarea} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} id="college-form-desc" />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} id="college-form-save">{editData ? 'حفظ التعديلات' : 'إضافة'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteData && (
        <div className={styles.modalOverlay} onClick={() => setDeleteData(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle} style={{ color: 'var(--error)' }}>حذف الكلية</div>
              <button className={styles.modalClose} onClick={() => setDeleteData(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}><p style={{ color: 'var(--text-secondary)' }}>هل أنت متأكد من حذف كلية <strong style={{ color: 'var(--text-primary)' }}>{deleteData.name}</strong>؟</p></div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setDeleteData(null)}>إلغاء</button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={confirmDelete} id="college-delete-confirm"><Trash2 size={14} /> حذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

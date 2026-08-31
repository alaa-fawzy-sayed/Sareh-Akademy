'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Download,
  Edit2,
  Trash2,
  Shield,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import styles from '../admin.module.css';

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  roles: string[];
  subscriptionsCount: number;
}

const ROLES = ['الكل', 'STUDENT', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'];
const STATUSES = ['الكل', 'نشط', 'موقوف'];
const PAGE_SIZE = 10;

const roleLabel: Record<string, { label: string; badge: string }> = {
  STUDENT: { label: 'طالب', badge: styles.badgeBlue },
  CONTENT_MANAGER: { label: 'مدير محتوى', badge: styles.badgePurple },
  ADMIN: { label: 'مشرف', badge: styles.badgeYellow },
  SUPER_ADMIN: { label: 'مشرف أول', badge: styles.badgeRed },
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('الكل');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [page, setPage] = useState(1);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const activeParam =
        statusFilter === 'الكل'
          ? ''
          : `&isActive=${statusFilter === 'نشط' ? 'true' : 'false'}`;
      const roleParam = roleFilter !== 'الكل' ? `&role=${roleFilter}` : '';
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';

      const res = await api.get(`/users?page=${page}&limit=${PAGE_SIZE}${searchParam}${roleParam}${activeParam}`);
      if (res.data) {
        const payload = res.data?.data ?? res.data;
        const arr = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
        setUsers(arr);
        setTotalCount(payload?.meta?.total ?? arr.length);
        setTotalPages(payload?.meta?.totalPages ?? 1);
      }
    } catch {
      setError('تعذر تحميل قائمة المستخدمين. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchUsers();
    }
  };

  // Export CSV
  const exportCSV = () => {
    const header = 'الاسم,البريد الإلكتروني,الأدوار,الحالة,تاريخ الانضمام';
    const rows = users.map((u) =>
      `"${u.firstName} ${u.lastName}","${u.email}","${u.roles.join(', ')}","${u.isActive ? 'نشط' : 'موقوف'}","${new Date(u.createdAt).toLocaleDateString('ar-EG')}"`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleStatus = async (id: string) => {
    try {
      await api.patch(`/users/${id}/toggle-status`);
      fetchUsers();
    } catch {
      alert('تعذر تغيير حالة المستخدم');
    }
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    try {
      await api.delete(`/users/${deleteUser.id}`);
      setDeleteUser(null);
      fetchUsers();
    } catch {
      alert('تعذر حذف المستخدم');
    }
  };

  const saveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    setError('');

    const form = e.currentTarget;
    const data = new FormData(form);
    const targetRole = data.get('role') as string;

    try {
      await api.patch(`/users/${editUser.id}/role`, { role: targetRole });
      setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>إدارة المستخدمين</h1>
          <p className={styles.pageSub}>{totalCount} مستخدم مسجّل في المنصة</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={exportCSV} id="users-export-btn">
            <Download size={15} />
            تصدير CSV
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBanner} style={{ marginBottom: 20 }}>⚠️ {error}</div>}

      {/* Card */}
      <div className={styles.card} id="users-table-card">
        {/* Toolbar */}
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}><Users size={17} /> قائمة المستخدمين</div>
          <div className={styles.toolbar}>
            {/* Search */}
            <div className={styles.searchBox}>
              <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                className={styles.searchInput}
                placeholder="بحث واضغط Enter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                id="users-search-input"
              />
            </div>

            {/* Role filter */}
            <select
              className={styles.filterSelect}
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              id="users-role-filter"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r === 'الكل' ? 'كل الأدوار' : (roleLabel[r]?.label || r)}</option>)}
            </select>

            {/* Status filter */}
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              id="users-status-filter"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s === 'الكل' ? 'كل الحالات' : s}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>الدور</th>
                <th>الحالة</th>
                <th>الاشتراكات بالمواد</th>
                <th>تاريخ الانضمام</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}><Users size={28} /></div>
                      <div className={styles.emptyTitle}>لا يوجد مستخدمون مطابقون للبحث</div>
                    </div>
                  </td>
                </tr>
              ) : users.map((u) => {
                const primaryRole = u.roles[0] || 'STUDENT';
                return (
                  <tr key={u.id} id={`user-row-${u.id}`}>
                    <td>
                      <div className={styles.avatarCell}>
                        <div className={styles.tableAvatar}>{u.firstName[0]}</div>
                        <div className={styles.tableAvatarInfo}>
                          <span className={styles.tableAvatarName}>{u.firstName} {u.lastName}</span>
                          <span className={styles.tableAvatarSub}>{u.email} {u.phone ? `· ${u.phone}` : ''}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${roleLabel[primaryRole]?.badge ?? styles.badgeBlue}`}>
                        {roleLabel[primaryRole]?.label ?? primaryRole}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${u.isActive ? styles.badgeGreen : styles.badgeRed}`}>
                        {u.isActive ? '● نشط' : '○ موقوف'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{u.subscriptionsCount}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {/* Edit */}
                        <button
                          className={`${styles.btn} ${styles.btnSecondary} ${styles.btnIcon}`}
                          title="تغيير صلاحية الدور"
                          onClick={() => setEditUser(u)}
                          id={`user-edit-${u.id}`}
                        >
                          <Edit2 size={14} />
                        </button>
                        {/* Toggle status */}
                        <button
                          className={`${styles.btn} ${u.isActive ? styles.btnDanger : styles.btnSuccess} ${styles.btnIcon}`}
                          title={u.isActive ? 'إيقاف' : 'تفعيل'}
                          onClick={() => toggleStatus(u.id)}
                          id={`user-toggle-${u.id}`}
                        >
                          {u.isActive ? <Ban size={14} /> : <CheckCircle size={14} />}
                        </button>
                        {/* Delete */}
                        <button
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnIcon}`}
                          title="حذف"
                          onClick={() => setDeleteUser(u)}
                          id={`user-delete-${u.id}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            صفحة {page} من {totalPages}
          </div>
          <div className={styles.paginationBtns}>
            <button className={styles.pageBtn} onClick={() => setPage(p => p - 1)} disabled={page === 1} id="users-prev-page">
              <ChevronRight size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`${styles.pageBtn} ${p === page ? styles.activePage : ''}`}
                onClick={() => setPage(p)}
                id={`users-page-${p}`}
              >
                {p}
              </button>
            ))}
            <button className={styles.pageBtn} onClick={() => setPage(p => p + 1)} disabled={page === totalPages || totalPages === 0} id="users-next-page">
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className={styles.modalOverlay} onClick={() => setEditUser(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} id="user-edit-modal">
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>تعديل صلاحيات المستخدم</div>
              <button className={styles.modalClose} onClick={() => setEditUser(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveEdit}>
              <div className={styles.modalBody}>
                {error && <div className={styles.errorBanner} style={{ marginBottom: 12 }}>⚠️ {error}</div>}
                
                <p style={{ marginBottom: 15, fontSize: 14 }}>
                  تعديل دور العضو: <strong style={{ color: 'var(--primary-light)' }}>{editUser.firstName} {editUser.lastName}</strong>
                </p>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>صلاحية الدور</label>
                  <select name="role" defaultValue={editUser.roles[0] || 'STUDENT'} className={`${styles.formSelect}`}>
                    <option value="STUDENT">طالب (STUDENT)</option>
                    <option value="CONTENT_MANAGER">مدير محتوى (CONTENT_MANAGER)</option>
                    <option value="ADMIN">مشرف (ADMIN)</option>
                    <option value="SUPER_ADMIN">مشرف أول (SUPER_ADMIN)</option>
                  </select>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setEditUser(null)}>إلغاء</button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving} id="user-edit-save">
                  <Shield size={14} /> {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteUser && (
        <div className={styles.modalOverlay} onClick={() => setDeleteUser(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} id="user-delete-modal">
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle} style={{ color: 'var(--error)' }}>تأكيد الحذف</div>
              <button className={styles.modalClose} onClick={() => setDeleteUser(null)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                هل أنت متأكد من حذف المستخدم <strong style={{ color: 'var(--text-primary)' }}>{deleteUser.firstName} {deleteUser.lastName}</strong>؟
                هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setDeleteUser(null)}>إلغاء</button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={confirmDelete} id="user-delete-confirm">
                <Trash2 size={14} /> حذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

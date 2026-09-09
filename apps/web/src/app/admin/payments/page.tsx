'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  Phone,
  Check,
  X,
  FileText,
  Smartphone,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { type Order, approveOrder, rejectOrder } from '@/lib/api/services';
import styles from '../admin.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminOrdersResponse {
  data: Order[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface AdminStats {
  totalRevenue: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
}

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<string, { label: string; badge: string; icon: typeof CheckCircle }> = {
  PAID:    { label: 'ناجحة ومفعلة', badge: styles.badgeGreen,  icon: CheckCircle },
  PENDING: { label: 'قيد المراجعة',  badge: styles.badgeYellow, icon: Clock       },
  FAILED:  { label: 'مرفوضة / ملغاة', badge: styles.badgeRed,    icon: XCircle     },
  REFUNDED:{ label: 'مُستردة',        badge: styles.badgeRed,    icon: XCircle     },
};

function toArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object' && Array.isArray((val as any).data)) return (val as any).data;
  return [];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [stats, setStats] = useState<AdminStats>({
    totalRevenue: 0,
    paidCount: 0,
    pendingCount: 0,
    failedCount: 0,
  });

  // ── Fetch Orders from Admin endpoint ──
  const fetchOrders = useCallback(async (currentPage = 1) => {
    setLoading(true);
    setError('');
    try {
      const statusParam = statusFilter !== 'الكل'
        ? `&status=${statusFilter}`
        : '';
      const searchParam = search.trim()
        ? `&search=${encodeURIComponent(search.trim())}`
        : '';

      const res = await api.get(
        `/admin/orders?page=${currentPage}&limit=${PAGE_SIZE}${statusParam}${searchParam}`,
      );

      const payload: AdminOrdersResponse = res.data;
      const data = toArray<Order>(payload.data ?? payload);
      setOrders(data);
      setMeta({
        page: payload.meta?.page ?? currentPage,
        total: payload.meta?.total ?? data.length,
        totalPages: payload.meta?.totalPages ?? 1,
      });

      if (payload.meta) {
        setStats({
          totalRevenue: (payload as any).meta?.totalRevenue ?? 0,
          paidCount:    (payload as any).meta?.paidCount    ?? 0,
          pendingCount: (payload as any).meta?.pendingCount  ?? 0,
          failedCount:  (payload as any).meta?.failedCount   ?? 0,
        });
      }
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 403) {
        setError('نقطة نهاية طلبات الأدمن غير موجودة. راجع الـ API.');
      } else {
        setError('تعذر تحميل بيانات المدفوعات.');
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchOrders(page);
  }, [page, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchOrders(1);
  };

  // ── Approve Payment ──
  const handleApprove = async (orderId: string) => {
    if (processingOrderId) return;
    setProcessingOrderId(orderId);
    setError('');
    setActionSuccess(null);
    try {
      await approveOrder(orderId);
      setActionSuccess(`تم اعتماد الطلب #${orderId.slice(-8)} بنجاح وتفعيل المادة للطالب فورا!`);
      // Update local state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'PAID' } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: 'PAID' } : null);
      }
      fetchOrders(page);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل اعتماد الطلب. حاول مجدداً.');
    } finally {
      setProcessingOrderId(null);
    }
  };

  // ── Reject Payment ──
  const handleReject = async (orderId: string) => {
    if (processingOrderId) return;
    setProcessingOrderId(orderId);
    setError('');
    setActionSuccess(null);
    try {
      await rejectOrder(orderId, rejectReason || 'لم يتم استلام المبلغ على محفظة فودافون كاش أو البيانات غير مطابقة');
      setActionSuccess(`تم رفض الطلب #${orderId.slice(-8)}.`);
      // Update local state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'FAILED' } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: 'FAILED' } : null);
      }
      setIsRejecting(false);
      setRejectReason('');
      fetchOrders(page);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل رفض الطلب. حاول مجدداً.');
    } finally {
      setProcessingOrderId(null);
    }
  };

  // ── Export CSV ──
  const exportCSV = () => {
    const header = 'رقم الطلب,المستخدم,رقم هاتف المحفظة,المبلغ,الحالة,الوسيلة,التاريخ';
    const rows = orders.map((o) => {
      const user = o.user ? `${o.user.firstName} ${o.user.lastName}` : '—';
      const senderNum = o.payment?.metadata?.senderNumber ?? o.user?.phone ?? '—';
      const status = STATUS_LABELS[o.status]?.label ?? o.status;
      const provider = o.payment?.provider ?? 'MANUAL';
      const date = new Date(o.createdAt).toLocaleDateString('ar-EG');
      return `${o.id.slice(-8)},${user},${senderNum},${o.totalAmount},${status},${provider},${date}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Stats from loaded data if not in meta ──
  const displayStats = {
    totalRevenue: stats.totalRevenue || orders.filter(o => o.status === 'PAID').reduce((acc, o) => acc + Number(o.totalAmount), 0),
    paidCount:    stats.paidCount    || orders.filter(o => o.status === 'PAID').length,
    pendingCount: stats.pendingCount || orders.filter(o => o.status === 'PENDING').length,
    failedCount:  stats.failedCount  || orders.filter(o => o.status === 'FAILED').length,
  };

  const miniStats = [
    { label: 'إجمالي الإيرادات المؤكدة', value: `${displayStats.totalRevenue.toLocaleString('ar-EG')} ج`, icon: DollarSign, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'اشتراكات مؤكدة ومفعلة',   value: String(displayStats.paidCount),    icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'بانتظار التحقق (معلقة)',    value: String(displayStats.pendingCount),  icon: Clock,       color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    { label: 'طلبات مرفوضة',             value: String(displayStats.failedCount),   icon: XCircle,     color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  ];

  const STATUSES = ['الكل', 'PENDING', 'PAID', 'FAILED'];

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>المدفوعات والاشتراكات</h1>
          <p className={styles.pageSub}>التحقق اليدوي الحقيقي من تحويلات فودافون كاش وتفعيل المواد للطلاب</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => fetchOrders(page)} id="payments-refresh">
            <RefreshCw size={15} /> تحديث
          </button>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={exportCSV} id="payments-export-btn">
            <Download size={15} /> تصدير CSV
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {actionSuccess && (
        <div style={{ padding: '12px 16px', marginBottom: 20, background: 'rgba(16,185,129,0.12)', border: '1px solid var(--success)', borderRadius: 8, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={18} /> {actionSuccess}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid var(--error)', borderRadius: 8, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Mini stats */}
      <div className={styles.statsGrid} id="payments-stats">
        {miniStats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={styles.statCard} style={{ '--s-color': s.color, '--s-bg': s.bg } as React.CSSProperties} id={`payment-stat-${i}`}>
              <div className={styles.statIconWrap}><Icon size={20} /></div>
              <div className={styles.statBody}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table card */}
      <div className={styles.card} id="payments-table-card">
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}><CreditCard size={17} /> طلبات التحويل والاشتراكات الحقيقية</div>
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                className={styles.searchInput}
                placeholder="بحث بالاسم أو رقم المحفظة أو الطلب..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                id="payments-search-input"
              />
            </div>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              id="payments-status-filter"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === 'الكل' ? 'الكل' : STATUS_LABELS[s]?.label ?? s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>الطالب</th>
                <th>المادة المطلوبة</th>
                <th>بيانات التحويل</th>
                <th>المبلغ</th>
                <th>الإيصال</th>
                <th>الحالة</th>
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}><CreditCard size={28} /></div>
                      <div className={styles.emptyTitle}>لا توجد طلبات دفع</div>
                      <div className={styles.emptyDesc}>
                        {error ? 'تحقق من إعداد الـ API' : 'لم يتم تسجيل أي طلبات دفع حتى الآن'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : orders.map((o) => {
                const sc = STATUS_LABELS[o.status] ?? STATUS_LABELS['PENDING'];
                const Icon = sc.icon;
                const user = o.user
                  ? `${o.user.firstName} ${o.user.lastName}`
                  : `#${o.id.slice(-8)}`;
                const email = o.user?.email ?? '—';
                const phone = o.user?.phone;
                const subjectNames = o.items?.map(i => i.subjectName).join('، ') || '—';
                const meta = o.payment?.metadata || {};
                const senderNumber = meta.senderNumber || phone || '—';
                const receiptUrl = meta.receiptUrl;
                const isProcessing = processingOrderId === o.id;
                const isPending = o.status === 'PENDING';

                return (
                  <tr key={o.id} id={`payment-row-${o.id}`}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 4 }}>
                        #{o.id.slice(-8)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.avatarCell}>
                        <div className={styles.tableAvatar} style={{ background: 'var(--gradient-primary)', width: 32, height: 32, fontSize: 13 }}>
                          {user[0] ?? '?'}
                        </div>
                        <div className={styles.tableAvatarInfo}>
                          <span className={styles.tableAvatarName}>{user}</span>
                          <span className={styles.tableAvatarSub}>{email}</span>
                          {phone && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', direction: 'ltr', textAlign: 'right' }}>
                              📞 {phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 180 }}>
                      <strong>{subjectNames}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, width: 'fit-content' }}>
                          <Smartphone size={12} /> فودافون كاش
                        </span>
                        <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-primary)', direction: 'ltr', textAlign: 'right' }}>
                          محفظة المرسل: <strong>{senderNumber}</strong>
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--success)', fontSize: 15 }}>
                      {Number(o.totalAmount).toLocaleString('ar-EG')} ج
                    </td>
                    <td>
                      {receiptUrl ? (
                        <button
                          className={styles.btnSecondary}
                          style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 6 }}
                          onClick={() => { setSelectedOrder(o); setIsRejecting(false); }}
                          title="عرض إيصال التحويل بالحجم الكامل"
                          id={`view-receipt-${o.id}`}
                        >
                          <Eye size={13} /> معاينة
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>بدون إيصال</span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${sc.badge}`}>
                        <Icon size={11} /> {sc.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        {isPending ? (
                          <>
                            <button
                              className={styles.btnPrimary}
                              style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5, background: '#10B981', borderColor: '#10B981' }}
                              onClick={() => handleApprove(o.id)}
                              disabled={isProcessing}
                              id={`approve-order-${o.id}`}
                              title="تأكيد استلام المبلغ وتفعيل المادة للطالب فورا"
                            >
                              {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                              اعتماد وتفعيل
                            </button>
                            <button
                              className={styles.btnDanger}
                              style={{ padding: '6px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              onClick={() => { setSelectedOrder(o); setIsRejecting(true); }}
                              disabled={isProcessing}
                              id={`reject-order-${o.id}`}
                              title="رفض الطلب"
                            >
                              <X size={13} />
                              رفض
                            </button>
                          </>
                        ) : (
                          <button
                            className={styles.btnSecondary}
                            style={{ padding: '5px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={() => { setSelectedOrder(o); setIsRejecting(false); }}
                            id={`details-order-${o.id}`}
                          >
                            <FileText size={13} /> التفاصيل
                          </button>
                        )}
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
            عرض {Math.min((page - 1) * PAGE_SIZE + 1, meta.total)}–{Math.min(page * PAGE_SIZE, meta.total)} من {meta.total} معاملة
          </div>
          <div className={styles.paginationBtns}>
            <button className={styles.pageBtn} onClick={() => setPage(p => p - 1)} disabled={page === 1} id="payments-prev-page">
              <ChevronRight size={14} />
            </button>
            {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`${styles.pageBtn} ${p === page ? styles.activePage : ''}`} onClick={() => setPage(p)} id={`payments-page-${p}`}>
                {p}
              </button>
            ))}
            <button className={styles.pageBtn} onClick={() => setPage(p => p + 1)} disabled={page >= meta.totalPages} id="payments-next-page">
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Full Receipt & Verification Modal ─────────────────────────────── */}
      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)} id="receipt-modal-overlay">
          <div
            className={styles.modal}
            style={{ maxWidth: 840, width: '92%' }}
            onClick={(e) => e.stopPropagation()}
            id="receipt-modal-content"
          >
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={22} color="var(--primary)" />
                <div>
                  <h3 className={styles.modalTitle}>التحقق من تحويل فودافون كاش - طلب #{selectedOrder.id.slice(-8)}</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    تاريخ الطلب: {new Date(selectedOrder.createdAt).toLocaleString('ar-EG')}
                  </span>
                </div>
              </div>
              <button className={styles.modalClose} onClick={() => setSelectedOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: selectedOrder.payment?.metadata?.receiptUrl ? '1.2fr 1fr' : '1fr', gap: 20 }}>
                
                {/* Receipt Image Side */}
                {selectedOrder.payment?.metadata?.receiptUrl && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Eye size={15} /> صورة إيصال التحويل (سكرين شوت الطالب):
                    </div>
                    <div style={{
                      position: 'relative',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 8,
                      overflow: 'hidden',
                      maxHeight: 460,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <img
                        src={selectedOrder.payment.metadata.receiptUrl}
                        alt="إيصال التحويل"
                        style={{ width: '100%', height: 'auto', maxHeight: 460, objectFit: 'contain' }}
                        id="modal-receipt-img"
                      />
                    </div>
                    <a
                      href={selectedOrder.payment.metadata.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.btnSecondary}
                      style={{ fontSize: 12, textAlign: 'center', justifyContent: 'center', padding: '6px 12px' }}
                    >
                      <ExternalLink size={13} /> فتح الصورة في نافذة منفصلة
                    </a>
                  </div>
                )}

                {/* Transfer Information Side */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: 16 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>بيانات المعاملة</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: 6 }}>
                        <span style={{ color: 'var(--text-muted)' }}>الطالب:</span>
                        <strong>{selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: 6 }}>
                        <span style={{ color: 'var(--text-muted)' }}>البريد:</span>
                        <span>{selectedOrder.user?.email}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: 6 }}>
                        <span style={{ color: 'var(--text-muted)' }}>هاتف الطالب:</span>
                        <span style={{ direction: 'ltr' }}>{selectedOrder.user?.phone || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: 6, background: 'rgba(239,68,68,0.06)', padding: '6px 8px', borderRadius: 4 }}>
                        <span style={{ color: '#EF4444', fontWeight: 700 }}>محفظة فودافون كاش المرسلة:</span>
                        <strong style={{ direction: 'ltr', fontFamily: 'monospace', fontSize: 14, color: '#EF4444' }}>
                          {selectedOrder.payment?.metadata?.senderNumber || selectedOrder.user?.phone || '—'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: 6 }}>
                        <span style={{ color: 'var(--text-muted)' }}>المحفظة المستلمة (المنصة):</span>
                        <strong style={{ direction: 'ltr', fontFamily: 'monospace' }}>01044599072</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: 6 }}>
                        <span style={{ color: 'var(--text-muted)' }}>المواد المطلوبة:</span>
                        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          {selectedOrder.items?.map(i => i.subjectName).join('، ')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4 }}>
                        <span style={{ color: 'var(--text-muted)' }}>المبلغ الإجمالي المطلوب:</span>
                        <strong style={{ fontSize: 16, color: 'var(--success)' }}>
                          {Number(selectedOrder.totalAmount).toLocaleString('ar-EG')} جنيه مصري
                        </strong>
                      </div>
                    </div>

                    {selectedOrder.payment?.metadata?.notes && (
                      <div style={{ marginTop: 12, padding: 10, background: 'var(--glass-bg)', borderRadius: 6, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>ملاحظات الطالب:</span>
                        <p style={{ margin: 0, color: 'var(--text-primary)' }}>{selectedOrder.payment.metadata.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Current Status Box */}
                  <div style={{ padding: 12, borderRadius: 8, background: selectedOrder.status === 'PAID' ? 'rgba(16,185,129,0.1)' : selectedOrder.status === 'FAILED' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {selectedOrder.status === 'PAID' ? (
                      <>
                        <CheckCircle size={20} color="#10B981" />
                        <div>
                          <strong style={{ color: '#10B981', display: 'block', fontSize: 13 }}>تم اعتماد الدفع وتفعيل المادة</strong>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>الطالب لديه صلاحية كاملة لتصفح المحتوى والدروس.</span>
                        </div>
                      </>
                    ) : selectedOrder.status === 'FAILED' ? (
                      <>
                        <XCircle size={20} color="#EF4444" />
                        <div>
                          <strong style={{ color: '#EF4444', display: 'block', fontSize: 13 }}>طلب ملغى / مرفوض</strong>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>لم يتم تفعيل المادة.</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Clock size={20} color="#F59E0B" />
                        <div>
                          <strong style={{ color: '#F59E0B', display: 'block', fontSize: 13 }}>بانتظار التحقق من وصول التحويل</strong>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>تأكد من وصول المبلغ لحساب فودافون كاش 01044599072 ثم اضغط اعتماد.</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Reject Reason Form (if opened) */}
                  {isRejecting && (
                    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: 12 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--error)', marginBottom: 6 }}>
                        سبب الرفض (سيظهر للطالب):
                      </label>
                      <textarea
                        className={styles.formInput}
                        rows={2}
                        placeholder="مثال: لم يتم استلام التحويل، أو المبلغ المحول غير مطابق، أو الصورة غير واضحة..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        style={{ fontSize: 12, resize: 'none' }}
                        id="reject-reason-input"
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                        <button
                          className={styles.btnSecondary}
                          style={{ fontSize: 11, padding: '4px 10px' }}
                          onClick={() => setIsRejecting(false)}
                        >
                          إلغاء
                        </button>
                        <button
                          className={styles.btnDanger}
                          style={{ fontSize: 11, padding: '4px 10px' }}
                          onClick={() => handleReject(selectedOrder.id)}
                          disabled={processingOrderId === selectedOrder.id}
                          id="confirm-reject-btn"
                        >
                          {processingOrderId === selectedOrder.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} تأكيد الرفض
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setSelectedOrder(null)}>
                إغلاق
              </button>

              {selectedOrder.status === 'PENDING' && !isRejecting && (
                <>
                  <button
                    className={styles.btnDanger}
                    onClick={() => setIsRejecting(true)}
                    disabled={processingOrderId === selectedOrder.id}
                    id="modal-open-reject-btn"
                  >
                    <X size={14} /> رفض الطلب
                  </button>
                  <button
                    className={styles.btnPrimary}
                    style={{ background: '#10B981', borderColor: '#10B981' }}
                    onClick={() => handleApprove(selectedOrder.id)}
                    disabled={processingOrderId === selectedOrder.id}
                    id="modal-approve-btn"
                  >
                    {processingOrderId === selectedOrder.id ? (
                      <><Loader2 size={14} className="animate-spin" /> جاري التفعيل...</>
                    ) : (
                      <><Check size={14} /> تأكيد استلام المبلغ وتفعيل المادة للطالب فورا</>
                    )}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

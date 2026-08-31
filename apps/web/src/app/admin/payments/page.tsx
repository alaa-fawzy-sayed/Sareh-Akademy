'use client';

import { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
} from 'lucide-react';
import styles from '../admin.module.css';

// ── Mock data ──
const MOCK_PAYMENTS = Array.from({ length: 50 }, (_, i) => ({
  id: `pay-${i + 1}`,
  user: ['أحمد محمد', 'فاطمة حسن', 'محمود إبراهيم', 'سارة أحمد', 'عمر خالد', 'خالد سامي', 'منى رمضان', 'هبة عبدالله'][i % 8],
  email: `user${i + 1}@example.com`,
  subject: ['الكيمياء العضوية', 'الفيزياء العامة', 'الأحياء الجزيئية', 'الكيمياء التحليلية', 'الميكروبيولوجي'][i % 5],
  university: ['جامعة القاهرة', 'جامعة الإسكندرية', 'جامعة عين شمس'][i % 3],
  amount: [290, 380, 450, 520, 390, 460, 310, 580][i % 8],
  status: (['success', 'success', 'success', 'pending', 'failed'] as const)[i % 5],
  method: ['بطاقة ائتمان', 'فوري', 'Paymob'][i % 3],
  createdAt: new Date(Date.now() - i * 3600000 * 6).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }),
  transactionId: `TXN-${100000 + i}`,
}));

type Payment = typeof MOCK_PAYMENTS[number];
const PAGE_SIZE = 10;
const STATUSES = ['الكل', 'success', 'pending', 'failed'];

const statusConfig = {
  success: { label: 'ناجحة', badge: styles.badgeGreen, icon: CheckCircle },
  pending: { label: 'معلقة', badge: styles.badgeYellow, icon: Clock },
  failed: { label: 'فشلت', badge: styles.badgeRed, icon: XCircle },
};

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() =>
    MOCK_PAYMENTS.filter((p) => {
      const matchSearch = !search || p.user.includes(search) || p.subject.includes(search) || p.transactionId.includes(search);
      const matchStatus = statusFilter === 'الكل' || p.status === statusFilter;
      return matchSearch && matchStatus;
    }),
    [search, statusFilter]
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalRevenue = MOCK_PAYMENTS.filter(p => p.status === 'success').reduce((a, p) => a + p.amount, 0);
  const successCount = MOCK_PAYMENTS.filter(p => p.status === 'success').length;
  const pendingCount = MOCK_PAYMENTS.filter(p => p.status === 'pending').length;
  const failedCount = MOCK_PAYMENTS.filter(p => p.status === 'failed').length;

  const exportCSV = () => {
    const header = 'رقم العملية,المستخدم,البريد,المادة,المبلغ,الحالة,وسيلة الدفع,التاريخ';
    const rows = filtered.map((p) =>
      `${p.transactionId},${p.user},${p.email},${p.subject},${p.amount},${p.status},${p.method},${p.createdAt}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const miniStats = [
    { label: 'إجمالي الإيرادات', value: `${totalRevenue.toLocaleString('ar-EG')} ج`, icon: DollarSign, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'عمليات ناجحة', value: successCount.toString(), icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'معلقة', value: pendingCount.toString(), icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    { label: 'فاشلة', value: failedCount.toString(), icon: XCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  ];

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>المدفوعات والإيرادات</h1>
          <p className={styles.pageSub}>تتبع جميع عمليات الدفع على المنصة</p>
        </div>
        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={exportCSV} id="payments-export-btn">
          <Download size={15} /> تصدير CSV
        </button>
      </div>

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
          <div className={styles.cardTitle}><CreditCard size={17} /> سجل المعاملات</div>
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                className={styles.searchInput}
                placeholder="بحث بالاسم أو رقم العملية..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
                <option key={s}>{s === 'success' ? 'ناجحة' : s === 'pending' ? 'معلقة' : s === 'failed' ? 'فاشلة' : s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>رقم العملية</th>
                <th>المستخدم</th>
                <th>المادة</th>
                <th>وسيلة الدفع</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><CreditCard size={28} /></div>
                    <div className={styles.emptyTitle}>لا توجد معاملات</div>
                  </div>
                </td></tr>
              ) : pageData.map((p) => {
                const sc = statusConfig[p.status];
                const Icon = sc.icon;
                return (
                  <tr key={p.id} id={`payment-row-${p.id}`}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4 }}>
                        {p.transactionId}
                      </span>
                    </td>
                    <td>
                      <div className={styles.avatarCell}>
                        <div className={styles.tableAvatar} style={{ background: 'var(--gradient-primary)', width: 30, height: 30, fontSize: 12 }}>{p.user[0]}</div>
                        <div className={styles.tableAvatarInfo}>
                          <span className={styles.tableAvatarName}>{p.user}</span>
                          <span className={styles.tableAvatarSub}>{p.email}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.subject}</td>
                    <td style={{ fontSize: 13 }}>{p.method}</td>
                    <td style={{ fontWeight: 800, color: 'var(--success)', fontSize: 15 }}>{p.amount} ج</td>
                    <td>
                      <span className={`${styles.badge} ${sc.badge}`}>
                        <Icon size={11} /> {sc.label}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.createdAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            عرض {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} من {filtered.length} معاملة
          </div>
          <div className={styles.paginationBtns}>
            <button className={styles.pageBtn} onClick={() => setPage(p => p - 1)} disabled={page === 1} id="payments-prev-page"><ChevronRight size={14} /></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`${styles.pageBtn} ${p === page ? styles.activePage : ''}`} onClick={() => setPage(p)} id={`payments-page-${p}`}>{p}</button>
            ))}
            <button className={styles.pageBtn} onClick={() => setPage(p => p + 1)} disabled={page === totalPages || totalPages === 0} id="payments-next-page"><ChevronLeft size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

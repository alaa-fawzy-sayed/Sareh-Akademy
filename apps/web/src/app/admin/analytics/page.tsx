'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import styles from '../admin.module.css';
import analyticsStyles from './analytics.module.css';

// ─── Types ────────────────────────────────────────────────────
interface AnalyticsData {
  period: { from: string; to: string };
  stats: {
    newUsers: number;
    activeUsers: number;
    revenue: number;
    contentViews: number;
    conversionRate: number;
  };
  chart: {
    labels: string[];
    values: number[];
  };
  topSubjects: { nameAr: string; nameEn: string; views: number }[];
  topUniversities: { nameAr: string; nameEn: string; students: number }[];
}

// ─── Date range presets ────────────────────────────────────────
type PresetKey = 'today' | '7d' | '30d' | '90d' | 'custom';

interface Preset {
  key: PresetKey;
  label: string;
  getRange: () => { from: Date; to: Date };
}

const PRESETS: Preset[] = [
  {
    key: 'today',
    label: 'اليوم',
    getRange: () => {
      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { from: start, to: now };
    },
  },
  {
    key: '7d',
    label: 'آخر 7 أيام',
    getRange: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 7);
      return { from, to };
    },
  },
  {
    key: '30d',
    label: 'آخر 30 يوماً',
    getRange: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);
      return { from, to };
    },
  },
  {
    key: '90d',
    label: 'آخر 3 أشهر',
    getRange: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 90);
      return { from, to };
    },
  },
  { key: 'custom', label: 'مخصص', getRange: () => ({ from: new Date(), to: new Date() }) },
];

// ─── Helper ────────────────────────────────────────────────────
function toInputDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function formatDateAr(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', {
    day: 'numeric', month: 'short',
  });
}

// ─── Zeroed Empty State (used only when no data recorded yet) ──
function buildEmptyData(from: Date, to: Date): AnalyticsData {
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1);
  const labels: string[] = [];
  const values: number[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    labels.push(d.toISOString().split('T')[0]);
    values.push(0);
  }
  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    stats: { newUsers: 0, activeUsers: 0, revenue: 0, contentViews: 0, conversionRate: 0 },
    chart: { labels, values },
    topSubjects: [],
    topUniversities: [],
  };
}

// ─── Component ─────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const [preset, setPreset]           = useState<PresetKey>('7d');
  const [customFrom, setCustomFrom]   = useState(toInputDate(new Date()));
  const [customTo, setCustomTo]       = useState(toInputDate(new Date()));
  const [showCustom, setShowCustom]   = useState(false);
  const [data, setData]               = useState<AnalyticsData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [refreshKey, setRefreshKey]   = useState(0);

  // Build the from/to dates from the current preset
  const getRange = useCallback((): { from: Date; to: Date } => {
    if (preset === 'custom') {
      return {
        from: new Date(customFrom + 'T00:00:00'),
        to:   new Date(customTo   + 'T23:59:59'),
      };
    }
    return PRESETS.find(p => p.key === preset)!.getRange();
  }, [preset, customFrom, customTo]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getRange();
      const res = await api.get(`/admin/analytics?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`);
      const payload = res.data?.data ?? res.data;
      if (payload && payload.stats) {
        setData(payload);
      } else {
        setData(buildEmptyData(from, to));
      }
    } catch {
      const { from, to } = getRange();
      setData(buildEmptyData(from, to));
    } finally {
      setLoading(false);
    }
  }, [getRange, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Derived chart values ──────────────────────────────────
  const chartLabels = data?.chart.labels ?? [];
  const chartValues = data?.chart.values ?? [];
  const maxVal      = Math.max(...chartValues, 1);

  // If too many days, sample to at most 30 bars
  const sampleStep = chartLabels.length > 30 ? Math.ceil(chartLabels.length / 30) : 1;
  const sampledLabels = chartLabels.filter((_, i) => i % sampleStep === 0);
  const sampledValues = chartValues.filter((_, i) => i % sampleStep === 0);
  const sampledMax    = Math.max(...sampledValues, 1);
  const peakIdx       = sampledValues.indexOf(Math.max(...sampledValues));

  const stats = data?.stats;

  return (
    <div>
      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>التحليلات والإحصاءات</h1>
          <p className={styles.pageSub}>أداء المنصة خلال الفترة المحددة</p>
        </div>

        {/* ── Date range controls ── */}
        <div className={analyticsStyles.rangeBar} id="analytics-date-range-bar">
          {/* Preset pills */}
          <div className={analyticsStyles.presets}>
            {PRESETS.filter(p => p.key !== 'custom').map(p => (
              <button
                key={p.key}
                id={`preset-${p.key}`}
                className={`${analyticsStyles.presetBtn} ${preset === p.key ? analyticsStyles.presetBtnActive : ''}`}
                onClick={() => { setPreset(p.key); setShowCustom(false); }}
              >
                {p.label}
              </button>
            ))}

            {/* Custom toggle */}
            <button
              id="preset-custom"
              className={`${analyticsStyles.presetBtn} ${preset === 'custom' ? analyticsStyles.presetBtnActive : ''}`}
              onClick={() => { setPreset('custom'); setShowCustom(v => !v); }}
            >
              <Calendar size={14} /> مخصص <ChevronDown size={12} style={{ opacity: 0.6 }} />
            </button>
          </div>

          {/* Refresh */}
          <button
            id="analytics-refresh"
            className={analyticsStyles.refreshBtn}
            onClick={() => setRefreshKey(k => k + 1)}
            title="تحديث البيانات"
          >
            <RefreshCw size={15} className={loading ? analyticsStyles.spinning : ''} />
          </button>
        </div>
      </div>

      {/* ── Custom date picker ── */}
      {showCustom && (
        <div className={analyticsStyles.customPicker} id="analytics-custom-date-picker">
          <div className={analyticsStyles.customPickerInner}>
            <div className={analyticsStyles.customField}>
              <label>من</label>
              <input
                id="custom-from-date"
                type="date"
                value={customFrom}
                max={customTo}
                onChange={e => setCustomFrom(e.target.value)}
                className={styles.formInput}
              />
            </div>
            <div className={analyticsStyles.customField}>
              <label>إلى</label>
              <input
                id="custom-to-date"
                type="date"
                value={customTo}
                min={customFrom}
                max={toInputDate(new Date())}
                onChange={e => setCustomTo(e.target.value)}
                className={styles.formInput}
              />
            </div>
            <button
              id="apply-custom-range"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => { setShowCustom(false); setRefreshKey(k => k + 1); }}
            >
              تطبيق
            </button>
          </div>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className={analyticsStyles.skeletonGrid}>
          {[1,2,3,4].map(i => <div key={i} className={analyticsStyles.skeletonCard} />)}
        </div>
      )}

      {/* ── Stats cards ── */}
      {!loading && stats && (
        <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            {
              icon: Users, label: 'مستخدمون جدد', value: stats.newUsers.toLocaleString('ar-EG'),
              color: '#6C63FF', bg: 'rgba(108,99,255,0.12)',
            },
            {
              icon: BookOpen, label: 'مشاهدات المحتوى', value: stats.contentViews.toLocaleString('ar-EG'),
              color: '#10B981', bg: 'rgba(16,185,129,0.12)',
            },
            {
              icon: DollarSign, label: 'الإيرادات', value: `${stats.revenue.toLocaleString('ar-EG')} ج`,
              color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',
            },
            {
              icon: TrendingUp, label: 'معدل التحويل', value: `${stats.conversionRate}%`,
              color: '#EF4444', bg: 'rgba(239,68,68,0.12)',
            },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={styles.statCard} style={{ '--s-color': s.color, '--s-bg': s.bg } as React.CSSProperties}>
                <div className={styles.statIconWrap}><Icon size={20} /></div>
                <div className={styles.statBody}>
                  <div className={styles.statValue}>{s.value}</div>
                  <div className={styles.statLabel}>{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Chart card ── */}
      {!loading && (
        <div className={styles.card} id="analytics-chart-card">
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <BarChart3 size={17} />
              نشاط المستخدمين
              {data && (
                <span className={analyticsStyles.periodLabel}>
                  {formatDateAr(data.period.from)} — {formatDateAr(data.period.to)}
                </span>
              )}
            </div>
          </div>
          <div style={{ padding: '24px 28px 20px' }}>
            {sampledLabels.length === 0 ? (
              <div className={styles.emptyState} style={{ padding: '40px' }}>
                <div className={styles.emptyIcon}><BarChart3 size={28} /></div>
                <div className={styles.emptyTitle}>لا توجد بيانات في هذه الفترة</div>
              </div>
            ) : (
              <>
                {/* Bar chart */}
                <div
                  id="analytics-bar-chart"
                  style={{ display: 'flex', alignItems: 'flex-end', gap: sampledLabels.length > 14 ? 4 : 10, height: 200 }}
                >
                  {sampledValues.map((val, i) => (
                    <div
                      key={i}
                      className={analyticsStyles.bar}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
                    >
                      {val > 0 && (
                        <span className={analyticsStyles.barValue}>{val}</span>
                      )}
                      <div
                        className={analyticsStyles.barFill}
                        style={{
                          width: '100%',
                          height: `${Math.max(4, (val / sampledMax) * 160)}px`,
                          background: i === peakIdx ? 'var(--gradient-primary)' : 'var(--glass-bg)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '6px 6px 0 0',
                          boxShadow: i === peakIdx ? 'var(--shadow-primary)' : 'none',
                        }}
                        title={`${formatDateAr(sampledLabels[i])}: ${val}`}
                      />
                      {sampledLabels.length <= 14 && (
                        <span className={analyticsStyles.barLabel}>
                          {formatDateAr(sampledLabels[i])}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* X-axis labels for long ranges */}
                {sampledLabels.length > 14 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <span className={analyticsStyles.barLabel}>{formatDateAr(sampledLabels[0])}</span>
                    <span className={analyticsStyles.barLabel}>{formatDateAr(sampledLabels[sampledLabels.length - 1])}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Top content + universities ── */}
      {!loading && (
        <div className={styles.grid2} style={{ marginTop: 20 }}>
          {/* Top subjects */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>المواد الأكثر مشاهدة</div>
            </div>
            <div style={{ padding: '12px 0' }}>
              {(data?.topSubjects.length ?? 0) === 0 ? (
                <div className={styles.emptyState} style={{ padding: '30px' }}>
                  <div className={styles.emptyTitle}>لا توجد بيانات</div>
                </div>
              ) : (() => {
                const maxViews = Math.max(...data!.topSubjects.map(s => s.views), 1);
                return data!.topSubjects.map((item, i) => (
                  <div key={i} style={{ padding: '10px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.nameAr}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{item.views.toLocaleString('ar-EG')} مشاهدة</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--glass-bg)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round((item.views / maxViews) * 100)}%`, background: 'var(--gradient-primary)', borderRadius: 3, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Top universities */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>الجامعات الأكثر نشاطاً</div>
            </div>
            <div style={{ padding: '12px 0' }}>
              {(data?.topUniversities.length ?? 0) === 0 ? (
                <div className={styles.emptyState} style={{ padding: '30px' }}>
                  <div className={styles.emptyTitle}>لا توجد بيانات</div>
                </div>
              ) : (() => {
                const maxStudents = Math.max(...data!.topUniversities.map(u => u.students), 1);
                return data!.topUniversities.map((item, i) => (
                  <div key={i} style={{ padding: '10px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.nameAr}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{item.students.toLocaleString('ar-EG')} طالب</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--glass-bg)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round((item.students / maxStudents) * 100)}%`, background: 'linear-gradient(135deg,#F59E0B,#D97706)', borderRadius: 3, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

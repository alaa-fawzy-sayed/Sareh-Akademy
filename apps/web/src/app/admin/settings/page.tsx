'use client';

import {
  Settings, Shield, Globe, Bell, Save,
  Loader2, CheckCircle, AlertCircle, RefreshCw,
  DollarSign, Phone, Mail, Lock, Database, Video,
  Users, BookOpen, GraduationCap, Zap, Eye, EyeOff,
  FileText, Clock, Tag, Link, Palette, Server,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';
import styles from '../admin.module.css';

// ── Default Settings ────────────────────────────────────────────────────
const DEFAULT_SETTINGS: Record<string, string> = {
  // General
  platform_name: 'صرح أكاديمي — Sarh Academy',
  platform_tagline: 'منصة التعليم الجامعي الأولى في مصر',
  platform_email: 'support@sarh-academy.com',
  platform_phone: '',
  platform_whatsapp: '',
  platform_description: 'منصة صرح أكاديمي (Sarh Academy) للتعليم الجامعي — محتوى تعليمي عالي الجودة لطلاب الجامعات المصرية',
  platform_facebook_url: '',
  platform_instagram_url: '',
  platform_youtube_url: '',
  platform_telegram_url: '',

  // Payment
  vf_cash_number: '01044599072',
  vf_cash_name: 'إدارة صرح أكاديمي',
  min_order_amount: '0',
  max_order_amount: '10000',
  currency: 'EGP',
  currency_symbol: 'ج.م',
  payment_instructions: 'حوّل المبلغ على محفظة فودافون كاش ثم ارفع صورة الإيصال',

  // Security
  allow_registration: 'true',
  require_email_verify: 'false',
  maintenance_mode: 'false',
  maintenance_message: 'المنصة في وضع الصيانة حالياً، نعود قريباً.',
  max_login_attempts: '5',
  login_block_minutes: '15',
  session_timeout_hours: '24',

  // Content
  max_video_size_mb: '500',
  max_file_size_mb: '50',
  allowed_video_types: 'mp4,mkv,webm',
  allowed_file_types: 'pdf,doc,docx,ppt,pptx',
  default_video_quality: '720p',
  enable_downloads: 'false',
  watermark_videos: 'false',
  watermark_text: 'صرح أكاديمي — Sarh Academy',
  free_preview_minutes: '5',

  // Students
  allow_profile_edit: 'true',
  allow_avatar_upload: 'true',
  show_progress_bar: 'true',
  show_leaderboard: 'false',
  quiz_pass_percentage: '60',
  max_quiz_attempts: '3',
  show_correct_answers: 'true',
  enable_bookmarks: 'true',
  enable_notes: 'true',

  // Notifications
  notify_new_order: 'true',
  notify_new_user: 'false',
  notify_payment_fail: 'true',
  notify_new_message: 'true',
  mail_enabled: 'false',
  mail_from_name: 'صرح أكاديمي — Sarh Academy',
  mail_reply_to: 'noreply@sarh-academy.com',

  // SEO
  seo_title: 'صرح أكاديمي | Sarh Academy — المنصة التعليمية المتكاملة',
  seo_description: 'منصة صرح أكاديمي (Sarh Academy) للتعليم الجامعي — شروحات ومحاضرات ومذكرات تفاعلية لطلاب الجامعات المصرية.',
  seo_keywords: 'صرح أكاديمي, Sarh Academy, كورسات جامعية, محاضرات, طب, صيدلة, هندسة, مصر',
  google_analytics_id: '',
  facebook_pixel_id: '',

  // Advanced
  api_rate_limit: '100',
  enable_search: 'true',
  search_min_chars: '2',
  cache_ttl_minutes: '5',
  contact_form_enabled: 'true',
  about_us_visible: 'true',
};

// ── Section Card ──────────────────────────────────────────────────────
function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.card} id={id}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}><Icon size={17} /> {title}</div>
      </div>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────
function Toggle({
  id, checked, onChange, label, description,
}: {
  id: string; checked: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
      <div>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{label}</span>
        {description && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>{description}</span>}
      </div>
      <button
        id={id}
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          position: 'relative', width: 44, height: 24, borderRadius: 12, border: 'none',
          background: checked ? 'var(--primary)' : 'var(--bg-elevated)', cursor: 'pointer',
          transition: 'background 0.2s', flexShrink: 0, outline: '2px solid var(--glass-border)',
        }}
        aria-checked={checked} role="switch"
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18,
          borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </button>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────
function Field({
  label, id, value, onChange, placeholder, type = 'text', hint, prefix, suffix, dir,
}: {
  label: string; id: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string; prefix?: string; suffix?: string; dir?: string;
}) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel} htmlFor={id}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 0 }}>
        {prefix && (
          <span style={{ padding: '0 12px', height: 40, display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {prefix}
          </span>
        )}
        <input
          id={id}
          type={type}
          className={styles.formInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir={dir}
          style={{ flex: 1, borderRadius: prefix ? '0 8px 8px 0' : suffix ? '8px 0 0 8px' : undefined }}
        />
        {suffix && (
          <span style={{ padding: '0 12px', height: 40, display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderLeft: 'none', borderRadius: '0 8px 8px 0', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {suffix}
          </span>
        )}
      </div>
      {hint && <small style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, display: 'block' }}>{hint}</small>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/settings');
      const data: Record<string, string> = res.data?.data ?? res.data ?? {};
      setSettings((prev) => ({ ...prev, ...data }));
    } catch {
      setError('تعذر تحميل الإعدادات. سيتم استخدام القيم الافتراضية.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const set = (key: string) => (value: string | boolean) =>
    setSettings((prev) => ({ ...prev, [key]: typeof value === 'boolean' ? String(value) : value }));

  const bool = (key: string) => settings[key] === 'true';
  const val = (key: string) => settings[key] ?? DEFAULT_SETTINGS[key] ?? '';

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api.patch('/admin/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: 'general',       label: 'عام',          icon: Globe },
    { id: 'payment',       label: 'الدفع',         icon: DollarSign },
    { id: 'security',      label: 'الأمان',        icon: Shield },
    { id: 'content',       label: 'المحتوى',       icon: Video },
    { id: 'students',      label: 'الطلاب',        icon: GraduationCap },
    { id: 'notifications', label: 'الإشعارات',     icon: Bell },
    { id: 'seo',           label: 'SEO',           icon: Tag },
    { id: 'advanced',      label: 'متقدم',         icon: Server },
  ];

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>إعدادات المنصة</h1>
          <p className={styles.pageSub}>تكوين إعدادات المنصة الشاملة وحفظها في قاعدة البيانات</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={loadSettings} id="settings-refresh">
            <RefreshCw size={15} /> تحديث
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={save} disabled={saving || loading} id="settings-save-btn">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saved ? '✓ تم الحفظ' : saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {saved && (
        <div style={{ padding: '12px 16px', marginBottom: 20, background: 'rgba(16,185,129,0.12)', border: '1px solid var(--success)', borderRadius: 8, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={18} /> تم حفظ جميع الإعدادات بنجاح في قاعدة البيانات
        </div>
      )}
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid var(--error)', borderRadius: 8, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap', padding: '4px', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              id={`settings-tab-${tab.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto', color: 'var(--primary)' }} />
          <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 14 }}>جاري تحميل الإعدادات...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ══ GENERAL ══ */}
          {activeTab === 'general' && (
            <>
              <Section id="s-general" icon={Globe} title="هوية المنصة">
                <div className={styles.formGrid2}>
                  <Field id="s-name" label="اسم المنصة *" value={val('platform_name')} onChange={set('platform_name')} placeholder="صرح أكاديمي — Sarh Academy" />
                  <Field id="s-tagline" label="الشعار / Tagline" value={val('platform_tagline')} onChange={set('platform_tagline')} placeholder="منصة التعليم الجامعي الأولى في مصر" />
                </div>
                <div className={styles.formGrid2}>
                  <Field id="s-email" label="بريد الدعم الرسمي" value={val('platform_email')} onChange={set('platform_email')} placeholder="support@sarh-academy.com" type="email" />
                  <Field id="s-phone" label="رقم الهاتف" value={val('platform_phone')} onChange={set('platform_phone')} placeholder="01xxxxxxxxx" dir="ltr" />
                </div>
                <div className={styles.formGrid2}>
                  <Field id="s-whatsapp" label="واتساب الدعم" value={val('platform_whatsapp')} onChange={set('platform_whatsapp')} placeholder="01xxxxxxxxx" prefix="WA" dir="ltr" />
                  <Field id="s-telegram" label="قناة تيليجرام" value={val('platform_telegram_url')} onChange={set('platform_telegram_url')} placeholder="https://t.me/..." prefix="🔗" dir="ltr" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>وصف المنصة</label>
                  <textarea
                    className={styles.formTextarea}
                    id="s-desc"
                    value={val('platform_description')}
                    onChange={(e) => set('platform_description')(e.target.value)}
                    placeholder="وصف مختصر عن المنصة..."
                    rows={3}
                  />
                </div>
              </Section>

              <Section id="s-social" icon={Link} title="روابط التواصل الاجتماعي">
                <div className={styles.formGrid2}>
                  <Field id="s-fb" label="فيسبوك" value={val('platform_facebook_url')} onChange={set('platform_facebook_url')} placeholder="https://facebook.com/..." prefix="FB" dir="ltr" />
                  <Field id="s-ig" label="إنستجرام" value={val('platform_instagram_url')} onChange={set('platform_instagram_url')} placeholder="https://instagram.com/..." prefix="IG" dir="ltr" />
                </div>
                <div className={styles.formGrid2}>
                  <Field id="s-yt" label="يوتيوب" value={val('platform_youtube_url')} onChange={set('platform_youtube_url')} placeholder="https://youtube.com/..." prefix="YT" dir="ltr" />
                  <Field id="s-tw" label="تويتر / X" value={val('platform_twitter_url')} onChange={set('platform_twitter_url')} placeholder="https://x.com/..." prefix="X" dir="ltr" />
                </div>
              </Section>
            </>
          )}

          {/* ══ PAYMENT ══ */}
          {activeTab === 'payment' && (
            <>
              <Section id="s-vf" icon={Phone} title="فودافون كاش">
                <div className={styles.formGrid2}>
                  <Field id="s-vf-num" label="رقم المحفظة (الاستقبال) *" value={val('vf_cash_number')} onChange={set('vf_cash_number')} placeholder="01xxxxxxxxx" dir="ltr" hint="هذا الرقم يظهر للطلاب عند الدفع" />
                  <Field id="s-vf-name" label="الاسم على المحفظة" value={val('vf_cash_name')} onChange={set('vf_cash_name')} placeholder="إدارة صرح أكاديمي" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>تعليمات الدفع (تظهر للطالب)</label>
                  <textarea
                    className={styles.formTextarea}
                    id="s-pay-inst"
                    value={val('payment_instructions')}
                    onChange={(e) => set('payment_instructions')(e.target.value)}
                    placeholder="حوّل المبلغ على محفظة فودافون كاش ثم ارفع صورة الإيصال"
                    rows={3}
                  />
                </div>
              </Section>

              <Section id="s-limits" icon={DollarSign} title="حدود الطلبات والعملة">
                <div className={styles.formGrid2}>
                  <Field id="s-min" label="الحد الأدنى للطلب" value={val('min_order_amount')} onChange={set('min_order_amount')} type="number" suffix={val('currency_symbol') || 'ج.م'} />
                  <Field id="s-max" label="الحد الأقصى للطلب" value={val('max_order_amount')} onChange={set('max_order_amount')} type="number" suffix={val('currency_symbol') || 'ج.م'} />
                </div>
                <div className={styles.formGrid2}>
                  <Field id="s-currency" label="رمز العملة (ISO)" value={val('currency')} onChange={set('currency')} placeholder="EGP" dir="ltr" />
                  <Field id="s-currency-sym" label="رمز العملة المعروض" value={val('currency_symbol')} onChange={set('currency_symbol')} placeholder="ج.م" />
                </div>
              </Section>
            </>
          )}

          {/* ══ SECURITY ══ */}
          {activeTab === 'security' && (
            <>
              <Section id="s-access" icon={Shield} title="التسجيل والوصول">
                <Toggle id="s-reg" checked={bool('allow_registration')} onChange={set('allow_registration')} label="السماح بتسجيل حسابات جديدة" description="عند التعطيل لن يتمكن أي مستخدم جديد من إنشاء حساب" />
                <Toggle id="s-verify" checked={bool('require_email_verify')} onChange={set('require_email_verify')} label="طلب تأكيد البريد الإلكتروني" description="يتطلب إعداد SMTP في ملف .env" />
                <Toggle id="s-maintenance" checked={bool('maintenance_mode')} onChange={set('maintenance_mode')} label="⚠️ وضع الصيانة" description="عند التفعيل: صفحة صيانة تظهر لجميع المستخدمين غير الأدمن" />
                {bool('maintenance_mode') && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>رسالة الصيانة (تظهر للزوار)</label>
                    <input
                      id="s-maint-msg"
                      className={styles.formInput}
                      value={val('maintenance_message')}
                      onChange={(e) => set('maintenance_message')(e.target.value)}
                      placeholder="المنصة في وضع الصيانة حالياً، نعود قريباً."
                    />
                  </div>
                )}
              </Section>

              <Section id="s-login" icon={Lock} title="حماية تسجيل الدخول">
                <div className={styles.formGrid2}>
                  <Field id="s-max-login" label="الحد الأقصى لمحاولات الدخول الفاشلة" value={val('max_login_attempts')} onChange={set('max_login_attempts')} type="number" hint="يُحجب الحساب بعد هذا العدد" suffix="محاولات" />
                  <Field id="s-block-min" label="مدة الحجب (دقيقة)" value={val('login_block_minutes')} onChange={set('login_block_minutes')} type="number" suffix="دقيقة" />
                </div>
                <Field id="s-session" label="مهلة انتهاء الجلسة" value={val('session_timeout_hours')} onChange={set('session_timeout_hours')} type="number" suffix="ساعة" hint="بعد هذه المدة يُطلب من المستخدم تسجيل الدخول من جديد" />
              </Section>
            </>
          )}

          {/* ══ CONTENT ══ */}
          {activeTab === 'content' && (
            <>
              <Section id="s-upload" icon={Video} title="رفع الملفات والفيديوهات">
                <div className={styles.formGrid2}>
                  <Field id="s-vid-size" label="الحد الأقصى لحجم الفيديو" value={val('max_video_size_mb')} onChange={set('max_video_size_mb')} type="number" suffix="MB" hint="500 MB = مناسب لفيديوهات HD" />
                  <Field id="s-file-size" label="الحد الأقصى لحجم الملفات" value={val('max_file_size_mb')} onChange={set('max_file_size_mb')} type="number" suffix="MB" />
                </div>
                <div className={styles.formGrid2}>
                  <Field id="s-vid-types" label="صيغ الفيديو المسموحة" value={val('allowed_video_types')} onChange={set('allowed_video_types')} placeholder="mp4,mkv,webm" hint="مفصولة بفاصلة" dir="ltr" />
                  <Field id="s-file-types" label="صيغ الملفات المسموحة" value={val('allowed_file_types')} onChange={set('allowed_file_types')} placeholder="pdf,doc,docx" hint="مفصولة بفاصلة" dir="ltr" />
                </div>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>جودة الفيديو الافتراضية</label>
                    <select className={styles.formSelect} id="s-vid-quality" value={val('default_video_quality')} onChange={(e) => set('default_video_quality')(e.target.value)}>
                      <option value="360p">360p (توفير البيانات)</option>
                      <option value="480p">480p (جودة متوسطة)</option>
                      <option value="720p">720p (HD - موصى به)</option>
                      <option value="1080p">1080p (Full HD)</option>
                    </select>
                  </div>
                  <Field id="s-preview" label="مدة المعاينة المجانية" value={val('free_preview_minutes')} onChange={set('free_preview_minutes')} type="number" suffix="دقيقة" hint="للمواد المدفوعة: الوقت المتاح بدون اشتراك" />
                </div>
              </Section>

              <Section id="s-protect" icon={Shield} title="حماية المحتوى">
                <Toggle id="s-downloads" checked={bool('enable_downloads')} onChange={set('enable_downloads')} label="السماح بتحميل الملفات" description="ملفات PDF والمستندات — لا يشمل الفيديوهات" />
                <Toggle id="s-watermark" checked={bool('watermark_videos')} onChange={set('watermark_videos')} label="إضافة علامة مائية على الفيديوهات" description="يحمي المحتوى من التسريب" />
                {bool('watermark_videos') && (
                  <Field id="s-watermark-text" label="نص العلامة المائية" value={val('watermark_text')} onChange={set('watermark_text')} placeholder="صرح أكاديمي — Sarh Academy" />
                )}
              </Section>
            </>
          )}

          {/* ══ STUDENTS ══ */}
          {activeTab === 'students' && (
            <>
              <Section id="s-profile" icon={Users} title="إعدادات الملف الشخصي">
                <Toggle id="s-prof-edit" checked={bool('allow_profile_edit')} onChange={set('allow_profile_edit')} label="السماح للطلاب بتعديل ملفهم الشخصي" />
                <Toggle id="s-avatar" checked={bool('allow_avatar_upload')} onChange={set('allow_avatar_upload')} label="السماح برفع صورة شخصية" />
                <Toggle id="s-progress" checked={bool('show_progress_bar')} onChange={set('show_progress_bar')} label="عرض شريط التقدم الدراسي" description="يظهر للطالب نسبة إنجازه في كل مادة" />
                <Toggle id="s-leaderboard" checked={bool('show_leaderboard')} onChange={set('show_leaderboard')} label="تفعيل لوحة المتصدرين" description="يعرض الطلاب الأكثر مشاهدة وإنجازاً" />
                <Toggle id="s-bookmarks" checked={bool('enable_bookmarks')} onChange={set('enable_bookmarks')} label="تفعيل المفضلة (Bookmarks)" />
                <Toggle id="s-notes" checked={bool('enable_notes')} onChange={set('enable_notes')} label="تفعيل الملاحظات الشخصية" description="يتيح للطالب كتابة ملاحظات على كل درس" />
              </Section>

              <Section id="s-quiz" icon={FileText} title="إعدادات الاختبارات">
                <div className={styles.formGrid2}>
                  <Field id="s-pass-pct" label="نسبة النجاح في الاختبار" value={val('quiz_pass_percentage')} onChange={set('quiz_pass_percentage')} type="number" suffix="%" hint="الدرجة الدنيا للنجاح" />
                  <Field id="s-max-attempts" label="الحد الأقصى لمحاولات الاختبار" value={val('max_quiz_attempts')} onChange={set('max_quiz_attempts')} type="number" suffix="محاولات" />
                </div>
                <Toggle id="s-show-answers" checked={bool('show_correct_answers')} onChange={set('show_correct_answers')} label="إظهار الإجابات الصحيحة بعد الاختبار" description="يرى الطالب الإجابات الصحيحة بعد انتهاء المحاولة" />
              </Section>
            </>
          )}

          {/* ══ NOTIFICATIONS ══ */}
          {activeTab === 'notifications' && (
            <>
              <Section id="s-notif-admin" icon={Bell} title="إشعارات الأدمن الداخلية">
                <Toggle id="s-notif-order" checked={bool('notify_new_order')} onChange={set('notify_new_order')} label="إشعار عند وصول طلب اشتراك جديد" description="إشعار داخلي في لوحة الأدمن" />
                <Toggle id="s-notif-user" checked={bool('notify_new_user')} onChange={set('notify_new_user')} label="إشعار عند تسجيل مستخدم جديد" />
                <Toggle id="s-notif-pay-fail" checked={bool('notify_payment_fail')} onChange={set('notify_payment_fail')} label="إشعار عند رفض أو فشل طلب دفع" />
                <Toggle id="s-notif-msg" checked={bool('notify_new_message')} onChange={set('notify_new_message')} label="إشعار عند وصول رسالة/استفسار جديد" description="رسائل من قسم تواصل معنا" />
              </Section>

              <Section id="s-email-cfg" icon={Mail} title="إعدادات البريد الإلكتروني (SMTP)">
                <Toggle id="s-mail-en" checked={bool('mail_enabled')} onChange={set('mail_enabled')} label="تفعيل إرسال البريد الإلكتروني" description="يتطلب إعداد MAIL_HOST في ملف .env" />
                {bool('mail_enabled') && (
                  <>
                    <div className={styles.formGrid2}>
                      <Field id="s-mail-from" label="اسم المرسل" value={val('mail_from_name')} onChange={set('mail_from_name')} placeholder="صرح أكاديمي — Sarh Academy" />
                      <Field id="s-mail-reply" label="بريد الرد (Reply-To)" value={val('mail_reply_to')} onChange={set('mail_reply_to')} placeholder="noreply@sarh-academy.com" type="email" dir="ltr" />
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: 12, color: '#f59e0b' }}>
                      ⚠️ لتفعيل البريد الإلكتروني، أضف في ملف <code>.env</code> القيم التالية: MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS
                    </div>
                  </>
                )}
              </Section>
            </>
          )}

          {/* ══ SEO ══ */}
          {activeTab === 'seo' && (
            <>
              <Section id="s-seo-meta" icon={Tag} title="الوسوم والبيانات الوصفية">
                <Field id="s-seo-title" label="عنوان الموقع (Title Tag)" value={val('seo_title')} onChange={set('seo_title')} placeholder="صرح أكاديمي | Sarh Academy — المنصة التعليمية المتكاملة" hint="يظهر في تبويب المتصفح ونتائج جوجل" />
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>وصف الموقع (Meta Description)</label>
                  <textarea
                    className={styles.formTextarea}
                    id="s-seo-desc"
                    value={val('seo_description')}
                    onChange={(e) => set('seo_description')(e.target.value)}
                    placeholder="منصة صرح أكاديمي (Sarh Academy) للتعليم الجامعي — شروحات ومحاضرات ومذكرات تفاعلية..."
                    rows={3}
                  />
                  <small style={{ color: val('seo_description').length > 160 ? 'var(--error)' : 'var(--text-muted)', fontSize: 12, marginTop: 4, display: 'block' }}>
                    {val('seo_description').length}/160 حرف {val('seo_description').length > 160 ? '(طويل جداً ⚠️)' : '(مثالي)'}
                  </small>
                </div>
                <Field id="s-seo-kw" label="الكلمات المفتاحية (Keywords)" value={val('seo_keywords')} onChange={set('seo_keywords')} placeholder="صرح أكاديمي, Sarh Academy, محاضرات, مصر" hint="مفصولة بفاصلة" />
              </Section>

              <Section id="s-analytics" icon={Zap} title="التحليلات والإعلانات">
                <Field id="s-ga" label="Google Analytics ID" value={val('google_analytics_id')} onChange={set('google_analytics_id')} placeholder="G-XXXXXXXXXX" dir="ltr" hint="اتركه فارغاً لتعطيل التحليل" />
                <Field id="s-fb-pixel" label="Facebook Pixel ID" value={val('facebook_pixel_id')} onChange={set('facebook_pixel_id')} placeholder="XXXXXXXXXXXXXXXX" dir="ltr" hint="للإعلانات والتتبع على فيسبوك" />
              </Section>
            </>
          )}

          {/* ══ ADVANCED ══ */}
          {activeTab === 'advanced' && (
            <>
              <Section id="s-perf" icon={Server} title="الأداء والتقنية">
                <div className={styles.formGrid2}>
                  <Field id="s-rate" label="حد الطلبات (Rate Limit)" value={val('api_rate_limit')} onChange={set('api_rate_limit')} type="number" suffix="طلب/دقيقة" hint="يحمي الـ API من الإساءة" />
                  <Field id="s-cache" label="مدة الكاش" value={val('cache_ttl_minutes')} onChange={set('cache_ttl_minutes')} type="number" suffix="دقيقة" hint="مدة تخزين البيانات مؤقتاً" />
                </div>
              </Section>

              <Section id="s-features" icon={Zap} title="تفعيل/تعطيل الوظائف">
                <Toggle id="s-search-en" checked={bool('enable_search')} onChange={set('enable_search')} label="تفعيل محرك البحث" description="بحث في المواد والمحتوى والجامعات" />
                {bool('enable_search') && (
                  <Field id="s-search-min" label="الحد الأدنى لأحرف البحث" value={val('search_min_chars')} onChange={set('search_min_chars')} type="number" suffix="أحرف" />
                )}
                <Toggle id="s-contact-en" checked={bool('contact_form_enabled')} onChange={set('contact_form_enabled')} label="تفعيل نموذج تواصل معنا" description="يمكّن الطلاب من إرسال استفسارات" />
                <Toggle id="s-about-vis" checked={bool('about_us_visible')} onChange={set('about_us_visible')} label="إظهار صفحة عن المنصة" />
              </Section>

              <Section id="s-danger" icon={AlertCircle} title="منطقة الخطر">
                <div style={{ padding: '14px 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.7 }}>
                    ⚠️ هذه العمليات لا يمكن التراجع عنها. تأكد قبل تنفيذها.
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      className={`${styles.btn} ${styles.btnDanger}`}
                      style={{ fontSize: 13 }}
                      onClick={() => {
                        if (confirm('هل أنت متأكد من مسح جميع الجلسات المنتهية من قاعدة البيانات؟'))
                          api.delete('/admin/sessions/expired').catch(() => alert('فشلت العملية'));
                      }}
                      id="s-clear-sessions"
                    >
                      مسح الجلسات المنتهية
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnDanger}`}
                      style={{ fontSize: 13 }}
                      onClick={() => {
                        if (confirm('هل أنت متأكد من مسح سجل العمليات القديم (أكثر من 90 يوم)؟'))
                          api.delete('/admin/audit-logs/old').catch(() => alert('فشلت العملية'));
                      }}
                      id="s-clear-logs"
                    >
                      مسح السجلات القديمة (+90 يوم)
                    </button>
                  </div>
                </div>
              </Section>
            </>
          )}

          {/* Bottom save */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 20 }}>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={save}
              disabled={saving}
              id="settings-save-bottom"
              style={{ minWidth: 200, justifyContent: 'center' }}
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saved ? '✓ تم حفظ جميع الإعدادات' : saving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

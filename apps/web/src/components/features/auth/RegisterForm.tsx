'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, GraduationCap, Mail, Lock, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { useAuthStore } from '@/lib/store/auth.store';
import styles from './LoginForm.module.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export function RegisterForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  // تحقق من كلمة المرور قبل الإرسال
  const validatePassword = (pass: string): string | null => {
    if (pass.length < 8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    if (!/[A-Z]/.test(pass)) return 'يجب أن تحتوي على حرف كبير (A-Z)';
    if (!/[a-z]/.test(pass)) return 'يجب أن تحتوي على حرف صغير (a-z)';
    if (!/\d/.test(pass)) return 'يجب أن تحتوي على رقم (0-9)';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // تحقق محلي أولاً
    const passError = validatePassword(form.password);
    if (passError) { setError(passError); return; }

    setLoading(true);
    try {
      // 1. إنشاء الحساب
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          ...(form.phone ? { phone: form.phone } : {}),
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        // ترجمة رسائل الخطأ
        const msg: string = Array.isArray(data.message)
          ? data.message[0]
          : (data.message ?? 'حدث خطأ في إنشاء الحساب');
        const arabicMsg = msg
          .replace('Password must contain uppercase, lowercase, and a number', 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم')
          .replace('Password must be at least 8 characters', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
          .replace('Invalid email address', 'البريد الإلكتروني غير صالح')
          .replace('Invalid phone number', 'رقم الهاتف غير صالح (استخدم: 01xxxxxxxxx)')
          .replace('Email already registered', 'البريد الإلكتروني مسجّل مسبقاً');
        setError(arabicMsg);
        return;
      }

      const regData = await res.json();
      const token: string = regData.accessToken ?? regData.data?.accessToken ?? '';

      if (token) {
        // 2. جيب بيانات المستخدم وسجّل دخوله تلقائياً
        const meRes = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.ok) {
          const me = await meRes.json();
          const user = me.user ?? me.data ?? me;
          setAuth(
            {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              avatarUrl: user.avatarUrl,
              roles: user.roles ?? [],
            },
            token,
          );
          router.push('/dashboard');
          return;
        }
      }
      // لو ما فيش توكن أو فشل الـ me، روّح لصفحة الدخول
      router.push('/login?registered=1');
    } catch {
      setError('حدث خطأ. تحقق من اتصالك بالإنترنت.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page} id="register-page">
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.orb1} />
        <div className={styles.orb2} />
      </div>

      <div className={styles.wrapper}>
        <Link href="/" className={styles.logo} id="register-logo">
          <div className={styles.logoIcon}><GraduationCap size={20} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, textAlign: 'start' }}>
            <span>صرح <span className={styles.accent}>أكاديمي</span></span>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '1px', fontWeight: 700 }}>SARH ACADEMY</span>
          </div>
        </Link>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>انضم إلينا ✨</h1>
            <p className={styles.subtitle}>أنشئ حسابك وابدأ التعلم فوراً</p>
          </div>

          {error && <div className={styles.errorBanner} role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form} id="register-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="reg-firstName">الاسم الأول</label>
                <div className={styles.inputWrap}>
                  <User size={16} className={styles.inputIcon} />
                  <input id="reg-firstName" type="text" name="firstName" placeholder="محمد" value={form.firstName} onChange={handleChange} className={styles.input} required minLength={2} />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="reg-lastName">الاسم الأخير</label>
                <div className={styles.inputWrap}>
                  <User size={16} className={styles.inputIcon} />
                  <input id="reg-lastName" type="text" name="lastName" placeholder="أحمد" value={form.lastName} onChange={handleChange} className={styles.input} required minLength={2} />
                </div>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="reg-email">البريد الإلكتروني</label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input id="reg-email" type="email" name="email" placeholder="example@gmail.com" value={form.email} onChange={handleChange} className={styles.input} required dir="ltr" />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="reg-phone">رقم الهاتف <span style={{fontSize:12,color:'var(--text-muted)'}}>(اختياري)</span></label>
              <div className={styles.inputWrap}>
                <Phone size={16} className={styles.inputIcon} />
                <input id="reg-phone" type="tel" name="phone" placeholder="01xxxxxxxxx" value={form.phone} onChange={handleChange} className={styles.input} dir="ltr" />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="reg-password">كلمة المرور</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input id="reg-password" type={showPass ? 'text' : 'password'} name="password" placeholder="مثال: Ahmed123" value={form.password} onChange={handleChange} className={styles.input} required />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)} id="reg-toggle-password">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                ✦ 8 أحرف على الأقل · حرف كبير (A) · حرف صغير (a) · رقم (1)
              </p>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading} id="register-submit-btn">
              إنشاء الحساب
            </Button>
          </form>

          <p className={styles.registerLink}>
            لديك حساب بالفعل؟{' '}
            <Link href="/login" id="register-to-login">سجّل دخولك</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

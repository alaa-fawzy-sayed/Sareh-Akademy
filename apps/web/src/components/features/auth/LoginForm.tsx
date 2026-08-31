'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, GraduationCap, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { useAuthStore } from '@/lib/store/auth.store';
import styles from './LoginForm.module.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export function LoginForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // 1. Login
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? 'بيانات الدخول غير صحيحة');
        return;
      }

      const data = await res.json();
      const token: string = data.data?.accessToken ?? data.accessToken ?? '';

      if (!token) {
        setError('حدث خطأ في الخادم، حاول مرة أخرى');
        return;
      }

      // 2. جيب بيانات المستخدم الكاملة (اسم، رول...)
      const meRes = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      if (!meRes.ok) {
        setError('تعذّر جلب بيانات المستخدم');
        return;
      }

      const me = await meRes.json();
      const user = me.data ?? me;

      // 3. احفظ في الـ store
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

      // 4. وجّه حسب الدور
      const isAdmin = (user.roles ?? []).some((r: string) =>
        ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(r),
      );
      router.push(isAdmin ? '/admin' : '/dashboard');
    } catch {
      setError('حدث خطأ. تحقق من اتصالك بالإنترنت.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page} id="login-page">
      {/* Background */}
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.orb1} />
        <div className={styles.orb2} />
      </div>

      <div className={styles.wrapper}>
        {/* Logo */}
        <Link href="/" className={styles.logo} id="login-logo">
          <div className={styles.logoIcon}><GraduationCap size={20} /></div>
          <span>Top<span className={styles.accent}>Pharma</span></span>
        </Link>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>مرحباً بعودتك 👋</h1>
            <p className={styles.subtitle}>سجّل دخولك للوصول إلى محتواك التعليمي</p>
          </div>

          {error && (
            <div className={styles.errorBanner} role="alert" id="login-error">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form} id="login-form">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="login-email">البريد الإلكتروني</label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  placeholder="example@university.edu.eg"
                  value={form.email}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  autoComplete="email"
                  dir="ltr"
                />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="login-password">كلمة المرور</label>
                <Link href="/forgot-password" className={styles.forgot} id="login-forgot-link">نسيت كلمة المرور؟</Link>
              </div>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPass(!showPass)}
                  aria-label="إظهار/إخفاء كلمة المرور"
                  id="login-toggle-password"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading} id="login-submit-btn">
              تسجيل الدخول
            </Button>
          </form>

          <p className={styles.registerLink}>
            ليس لديك حساب؟{' '}
            <Link href="/register" id="login-to-register">أنشئ حساباً الآن</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

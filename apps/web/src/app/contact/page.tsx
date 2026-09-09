'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Send,
  CheckCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Mail,
  MapPin,
  HelpCircle,
  Info,
  BookOpen,
} from 'lucide-react';
import { Header } from '@/components/layout/Header/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api/client';

export default function ContactPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      setEmail(user.email || '');
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !message.trim()) {
      setErrorMsg('يرجى كتابة الاسم والرسالة');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.post('/admin/contact-messages', {
        name: fullName.trim(),
        email: email.trim() || user?.email || 'student@sarh-academy.com',
        phone: phone.trim() || undefined,
        subject: subject.trim() || 'استفسار من طالب',
        message: message.trim(),
        userId: user?.id,
      });

      setSuccessMsg(true);
      setMessage('');
      setSubject('');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة لاحقاً.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main style={{ minHeight: '85vh', paddingTop: '100px', paddingBottom: '80px' }}>
        <div className="container" style={{ maxWidth: 1040 }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 30,
              background: 'rgba(108, 99, 255, 0.1)',
              border: '1px solid rgba(108, 99, 255, 0.3)',
              color: 'var(--primary-light)',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}>
              <MessageSquare size={16} /> التواصل والدعم الفني عبر المنصة
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
              تواصل مع إدارة المنصة مباشرة
            </h1>
            <p style={{ maxWidth: 660, margin: '0 auto', fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              يتم استقبال ومتابعة كافة استفسارات وطلبات الطلاب بشكل حصري وموثق عبر المنصة لضمان سرعة الرد والمتابعة الدقيقة.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 30,
            marginBottom: 40,
          }}>
            
            {/* Info Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--glass-border)',
                borderRadius: 16,
                padding: 28,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(108, 99, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}>
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      نظام التذاكر والاستفسارات
                    </h3>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>مربوط بلوحة تحكم المشرفين</span>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0, marginBottom: 16 }}>
                  كل رسالة ترسلها تصل مباشرة إلى لوحة إدارة المنصة، ويقوم المشرف المختص بالاطلاع عليها وإرسال الرد الرسمي إلى إشعارات حسابك داخل المنصة.
                </p>

                <div style={{
                  padding: '12px 14px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 10,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <Clock size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <span>متوسط وقت الرد: من 15 دقيقة إلى ساعتين كحد أقصى</span>
                </div>
              </div>

              {/* Useful quick links */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--glass-border)',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <HelpCircle size={20} color="var(--accent)" />
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>هل تبحث عن شرح لكيفية الاشتراك؟</span>
                    <Link href="/help" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>
                      راجع دليل الاستخدام والأسئلة الشائعة ←
                    </Link>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Info size={20} color="var(--primary)" />
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>تعرف أكثر على الكليات والمقررات:</span>
                    <Link href="/about" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>
                      نبذة عن المنصة والمناهج المتاحة ←
                    </Link>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <MapPin size={20} color="var(--success)" />
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>المقر الأكاديمي:</span>
                    <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>أسيوط، جمهورية مصر العربية</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Inquiry Form Column */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--glass-border)',
              borderRadius: 16,
              padding: 32,
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                إرسال استفسار أو رسالة للإدارة
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
                اكتب سؤالك أو استفسارك وسيتلقى المشرفون إشعاراً فورياً في لوحة الإدارة للرد عليك.
              </p>

              {successMsg && (
                <div style={{
                  padding: '14px 18px',
                  borderRadius: 10,
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid var(--success)',
                  color: 'var(--success)',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 14,
                }}>
                  <CheckCircle size={20} style={{ flexShrink: 0 }} />
                  <span>
                    تم استلام رسالتك بنجاح ووصلت لإدارة المنصة! سيصلك الرد في إشعارات حسابك قريباً.
                  </span>
                </div>
              )}

              {errorMsg && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid var(--error)',
                  color: 'var(--error)',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13,
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    الاسم بالكامل <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: أحمد محمد علي"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                    id="contact-name-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      رقم الهاتف (اختياري)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 8,
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        outline: 'none',
                      }}
                      id="contact-phone-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 8,
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        outline: 'none',
                      }}
                      id="contact-email-input"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    موضوع الاستفسار
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="مثال: استفسار عن مادة الكيمياء العضوية"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                    id="contact-subject-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    تفاصيل الرسالة <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب استفسارك بالتفصيل هنا ليتم تحويله للمشرف المختص..."
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                    id="contact-message-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px',
                    borderRadius: 10,
                    background: 'var(--gradient-primary)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    marginTop: 6,
                  }}
                  id="contact-submit-btn"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {submitting ? 'جاري الإرسال...' : 'إرسال الرسالة إلى إدارة المنصة'}
                </button>
              </form>
            </div>

          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}

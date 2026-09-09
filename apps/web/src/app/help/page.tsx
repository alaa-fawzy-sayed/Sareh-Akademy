'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Smartphone,
  CheckCircle,
  Play,
  UploadCloud,
  ShieldCheck,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ArrowLeft,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Header } from '@/components/layout/Header/Header';
import { Footer } from '@/components/layout/Footer/Footer';

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<Record<number, boolean>>({ 0: true, 1: true });

  const toggleFaq = (idx: number) => {
    setOpenFaq((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const steps = [
    {
      num: 1,
      title: 'استعراض الجامعات واختيار كليتك',
      desc: 'ادخل على قسم "الجامعات"، اختر جامعتك (مثل: جامعة أسيوط الجديدة، جامعة القاهرة، جامعة أسيوط...)، ثم اختر كلية الصيدلة لتظهر لك كافة المقررات المتاحة.',
      icon: Search,
    },
    {
      num: 2,
      title: 'مشاهدة الفيديو التعريفي والدروس المجانية',
      desc: 'عند فتح أي مادة، ستجد فيديو تعريفي يشرح تفاصيل المنهج، بالإضافة إلى إمكانية معاينة المحاضرات التجريبية المجانية بدون أي اشتراك.',
      icon: Play,
    },
    {
      num: 3,
      title: 'التحويل عبر فودافون كاش (01044599072)',
      desc: 'اضغط على زر "اشترك في المادة الآن"، وقم بتحويل قيمة الاشتراك إلى رقم فودافون كاش المعتمد 01044599072 عبر محفظتك أو تطبيق إنستاباي.',
      icon: Smartphone,
    },
    {
      num: 4,
      title: 'رفع صورة إيصال التحويل (Screenshot)',
      desc: 'أدخل رقم الهاتف الذي حولت منه، وارفع صورة إيصال العملية بضغطة زر، ثم اضغط "إرسال الإيصال وتأكيد الطلب". سيصبح طلبك قيد المراجعة.',
      icon: UploadCloud,
    },
    {
      num: 5,
      title: 'التحقق الإداري وتفعيل المادة فوراً',
      desc: 'يقوم فريق الإدارة بمطابقة التحويل وتفعيل المادة لحسابك. ستصلك رسالة تأكيد على أيقونة الإشعارات، وتُفتح جميع الفيديوهات والمذكرات فوراً.',
      icon: ShieldCheck,
    },
    {
      num: 6,
      title: 'بدء الدراسة وتحميل مذكرات الـ PDF',
      desc: 'استمتع بمشاهدة المحاضرات بجودة Full HD مع إمكانية تحميل المذكرات والملخصات ومتابعة نسبة إنجازك من لوحة تحكم الطالب.',
      icon: Download,
    },
  ];

  const faqs = [
    {
      q: 'كم يستغرق وقت تفعيل الاشتراك بعد رفع إيصال فودافون كاش؟',
      a: 'يتم فحص ومراجعة الإيصال وتأكيد الاشتراك خلال وقت قياسي (عادة بين 15 دقيقة إلى ساعتين كحد أقصى) طوال أوقات العمل الرسمية للمنصة.',
    },
    {
      q: 'ما هو رقم فودافون كاش المعتمد والرسمي للمنصة؟',
      a: 'الرقم المعتمد والوحيد لعمليات التحويل هو: 01044599072. يرجى التأكد دائماً من التحويل لهذا الرقم حصراً.',
    },
    {
      q: 'هل يمكنني مشاهدة المحاضرات على الهاتف والكمبيوتر؟',
      a: 'نعم، المنصة متوافقة بالكامل وتعمل بسلاسة على جميع الأجهزة: الهواتف الذكية (Android / iOS)، الأجهزة اللوحية (Tablets)، وأجهزة الكمبيوتر واللابتوب.',
    },
    {
      q: 'هل المذكرات والملخصات متاحة للتحميل والطباعة؟',
      a: 'نعم، جميع المشتركين يمكنهم تحميل ملفات ومذكرات الـ PDF المرفقة مع المحاضرات وطباعتها للمذاكرة في أي وقت.',
    },
    {
      q: 'ماذا أفعل إذا واجهت مشكلة أثناء الدفع أو تفعيل المادة؟',
      a: 'يمكنك التواصل الفوري مع فريق الدعم الفني عبر صفحة "تواصل معنا" بالمنصة وسيتم الرد على استفسارك ومساعدتك في حسابك مباشرة.',
    },
  ];

  return (
    <>
      <Header />
      <main style={{ minHeight: '85vh', paddingTop: '100px', paddingBottom: '80px' }}>
        <div className="container" style={{ maxWidth: 1040 }}>
          
          {/* Header section */}
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 30,
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: 'var(--accent-light)',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}>
              <HelpCircle size={16} /> دليل الاستخدام والأسئلة الشائعة
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
              كيف تبدأ دراستك على <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>صرح أكاديمي (Sarh Academy)</span>؟
            </h1>
            <p style={{ maxWidth: 680, margin: '0 auto', fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              خطوات بسيطة وواضحة ترشدك من أول تصفح المواد وحتى تفعيل اشتراكك وبدء المشاهدة.
            </p>
          </div>

          {/* Step by step cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
            marginBottom: 60,
          }}>
            {steps.map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.num}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 16,
                    padding: 28,
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: 'var(--gradient-primary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}>
                      {st.num}
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {st.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                    {st.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* FAQs section */}
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--glass-border)',
            borderRadius: 18,
            padding: '36px',
            marginBottom: 50,
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', marginBottom: 8 }}>
              الأسئلة الأكثر شيوعاً
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginBottom: 30 }}>
              كل ما قد يخطر ببالك حول التسجيل والاشتراك والمحاضرات
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {faqs.map((faq, i) => {
                const isOpen = !!openFaq[i];
                return (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(i)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'right',
                        fontFamily: 'inherit',
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {faq.q}
                      </span>
                      {isOpen ? <ChevronUp size={18} color="var(--primary)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 20px 16px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, borderTop: '1px solid var(--glass-border)', paddingTop: 12 }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Need help banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)',
            border: '1px solid rgba(108, 99, 255, 0.3)',
            borderRadius: 16,
            padding: '30px',
            textAlign: 'center',
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              هل لديك استفسار إضافي أو تحتاج مساعدة مخصصة؟
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
              فريق الدعم الفني جاهز لمساعدتك والرد على استفساراتك عبر نظام المراسلة الداخلي بالمنصة.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Link
                href="/contact"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  borderRadius: 10,
                  background: 'var(--gradient-primary)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: 'none',
                }}
              >
                <MessageSquare size={16} /> تواصل مع الدعم الفني
              </Link>
              <Link
                href="/universities"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  borderRadius: 10,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                }}
              >
                تصفح المقررات الدراسية
              </Link>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}

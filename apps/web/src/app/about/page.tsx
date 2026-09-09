'use client';

import Link from 'next/link';
import {
  GraduationCap,
  Award,
  BookOpen,
  CheckCircle2,
  Users,
  ShieldCheck,
  Video,
  FileText,
  Smartphone,
  Sparkles,
  ArrowLeft,
  Building2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header/Header';
import { Footer } from '@/components/layout/Footer/Footer';

export default function AboutPage() {
  const highlights = [
    {
      icon: BookOpen,
      title: 'مناهج صيدلة معتمدة وتخصصية',
      desc: 'تغطية شاملة ومفصلة لكافة مقررات الصيدلة في الجامعات المصرية: الكيمياء العضوية، علم الأدوية، الكيمياء التحليلية، الصيدلانيات، العقاقير والنباتات الطبية.',
    },
    {
      icon: Video,
      title: 'شروحات مرئية فائقة الجودة (Full HD)',
      desc: 'محاضرات مسجلة بأعلى جودة مع أساتذة متخصصين، تدمج بين الشرح النظري والتطبيقات السريرية وحل أسئلة الامتحانات السابقة.',
    },
    {
      icon: FileText,
      title: 'مذكرات وملخصات PDF منقحة',
      desc: 'مذكرات دراسية جاهزة للتحميل والطباعة ومطابقة تماماً لأحدث لوائح كليات الصيدلة ومحاضرات الجامعات.',
    },
    {
      icon: ShieldCheck,
      title: 'اشتراك آمن وتحقق معتمد',
      desc: 'نظام دفع وتحقق يدوي دقيق عبر محفظة فودافون كاش المعتمدة للمنصة 01044599072، لتفعيل اشتراكك الفوري بأمان.',
    },
  ];

  const subjectsList = [
    'Organic chemistry I',
    'Organic chemistry II',
    'Analytical chemistry I',
    'Analytical chemistry II',
    'Math',
    'Physical pharmacy',
    'Physiology',
    'Pharmacology I',
    'Pharmacology II',
    'Pharmacology III',
    'Medicinal plants',
    'Pharmacognosy',
  ];

  return (
    <>
      <Header />
      <main style={{ minHeight: '85vh', paddingTop: '100px', paddingBottom: '80px' }}>
        <div className="container" style={{ maxWidth: 1080 }}>
          
          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
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
              <Sparkles size={16} /> منصة التعليم الجامعي الرائدة في مصر
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 16 }}>
              نبذة عن منصة <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>صرح أكاديمي (Sarh Academy)</span>
            </h1>
            <p style={{ maxWidth: 720, margin: '0 auto', fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              المنصة الجامعية الأولى المتخصصة في تقديم المحتوى الأكاديمي المعتمد لطلاب الجامعات المصرية (جامعة أسيوط الجديدة، القاهرة، أسيوط، الإسكندرية، عين شمس، المنصورة وغيرها).
            </p>
          </div>

          {/* Mission & Vision Card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--glass-border)',
            borderRadius: 16,
            padding: '36px',
            marginBottom: 40,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 30,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Award size={24} color="var(--primary)" />
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>رؤيتنا ورسالتنا</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, margin: 0 }}>
                توفير بيئة تعليمية ذكية تسهّل على الطالب استيعاب أثقل المواد العلمية عبر محاضرات مسجلة عالية الدقة، شروحات مبسطة، وتدريبات مطابقة لامتحانات الجامعات، مع المتابعة المستمرة والدعم الأكاديمي.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Building2 size={24} color="var(--accent)" />
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>تغطية الجامعات والكليات</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, margin: 0 }}>
                صُممت المقررات لتلائم لوائح الساعات المعتمدة وبرامج مختلف الكليات بالجامعات الحكومية والأهلية والخاصة في جمهورية مصر العربية.
              </p>
            </div>
          </div>

          {/* Highlights Grid */}
          <div style={{ marginBottom: 50 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', marginBottom: 30, color: 'var(--text-primary)' }}>
              ما يميز تجربة الطالب في صرح أكاديمي (Sarh Academy)
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 20,
            }}>
              {highlights.map((h, i) => {
                const Icon = h.icon;
                return (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 12,
                      padding: 24,
                      transition: 'transform 0.2s, border-color 0.2s',
                    }}
                  >
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: 'rgba(108, 99, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                      marginBottom: 16,
                    }}>
                      <Icon size={22} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                      {h.title}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                      {h.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Curricula Covered */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.08) 0%, rgba(245, 158, 11, 0.05) 100%)',
            border: '1px solid var(--glass-border)',
            borderRadius: 16,
            padding: '36px',
            marginBottom: 50,
          }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, textAlign: 'center' }}>
              المقررات الصيدلية التخصصية المتوفرة
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              مقررات دراسية متكاملة تم إعدادها بواسطة نخبة من المتخصصين
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
              {subjectsList.map((sub, i) => (
                <span
                  key={i}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--glass-border)',
                    padding: '8px 16px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={14} color="#10b981" /> {sub}
                </span>
              ))}
            </div>
          </div>

          {/* Call to action buttons */}
          <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link
              href="/universities"
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
              تصفح الجامعات والمواد <ArrowLeft size={16} />
            </Link>
            <Link
              href="/help"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                borderRadius: 10,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              طريقة الاستخدام والدليل
            </Link>
            <Link
              href="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                borderRadius: 10,
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: 'var(--accent-light)',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              تواصل معنا
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}

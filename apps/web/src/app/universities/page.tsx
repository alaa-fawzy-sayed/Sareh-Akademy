'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin, University as UniIcon } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Header } from '@/components/layout/Header/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import styles from './page.module.css';

interface UniversityData {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  location: string;
  description: string | null;
  isActive: boolean;
  logoUrl: string | null;
  createdAt: string;
  _count?: {
    colleges: number;
  };
}

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<UniversityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUniversities = async () => {
      setLoading(true);
      setError('');
    try {
        const res = await api.get('/universities?isActive=true');
        // الـ API يرجع: { success, data: { data: [...], meta: {} } }
        const payload = res.data?.data ?? res.data;
        const arr = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
        setUniversities(arr);
      } catch {
        setError('عذراً، فشل تحميل قائمة الجامعات. تحقق من اتصال الشبكة.');
      } finally {
        setLoading(false);
      }
    };
    fetchUniversities();
  }, []);

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <h1 className={styles.title}>الجامعات <span className="gradient-text">المتاحة</span></h1>
            <p className={styles.subtitle}>
              اختر جامعتك للوصول إلى المحتوى الدراسي المخصص لكلياتك وتخصصاتك الحقيقية
            </p>
          </div>

          {error && <div className={styles.errorBanner} style={{ color: 'var(--error)', marginBottom: 20, textAlign: 'center' }}>⚠️ {error}</div>}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>جاري تحميل الجامعات...</div>
          ) : universities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>لا توجد جامعات نشطة حالياً.</div>
          ) : (
            <div className={styles.grid}>
              {universities.map((uni, idx) => {
                const colors = ['#6C63FF', '#F59E0B', '#10B981', '#EF4444'];
                const color = colors[idx % colors.length];
                return (
                  <Link key={uni.slug} href={`/universities/${uni.slug}`} className={styles.card}>
                    <div className={styles.cardTop}>
                      <div className={styles.emojiWrap} style={{ '--u-color': color } as React.CSSProperties}>
                        {uni.logoUrl ? (
                          <Image src={uni.logoUrl} alt={uni.nameAr} width={40} height={40} className={styles.logoImg} />
                        ) : (
                          <UniIcon size={24} style={{ color }} />
                        )}
                      </div>
                      <div>
                        <h2 className={styles.uniName}>{uni.nameAr}</h2>
                        <span className={styles.uniNameEn}>{uni.nameEn}</span>
                      </div>
                    </div>
                    
                    <p className={styles.desc}>{uni.description || 'لا يوجد وصف متاح للجامعة'}</p>
                    
                    <div className={styles.meta}>
                      <div className={styles.metaItem}>
                        <MapPin size={14} />
                        {uni.location}
                      </div>
                      <div className={styles.metaItem}>
                        <span>{uni._count?.colleges ?? 0} كليات</span>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.enterText}>تصفح الكليات</span>
                      <ArrowLeft size={16} className={styles.arrow} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

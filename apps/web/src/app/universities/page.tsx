'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin, GraduationCap, Search, Loader2 } from 'lucide-react';
import { fetchUniversities, type University } from '@/lib/api/services';
import { UNIVERSITIES as FALLBACK_UNIS } from '@/lib/data/universities';
import { Header } from '@/components/layout/Header/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import styles from './page.module.css';

const COLORS = ['#6C63FF', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'];

const UNIVERSITY_LOGOS: Record<string, string> = {
  sphinx: '/images/logos/sphinx.jpg',
  assiut: '/images/logos/assiut.jpg',
  'new-assiut': '/images/logos/new-assiut.jpg',
  badr: '/images/logos/badr.jpg',
  azhar: '/images/logos/azhar.jpg',
};

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUniversities()
      .then((data) => {
        if (data && data.length > 0) {
          setUniversities(data);
        } else {
          // Fallback if empty
          setUniversities(
            FALLBACK_UNIS.map((u) => ({
              id: u.slug,
              nameAr: u.nameAr,
              nameEn: u.nameEn,
              slug: u.slug,
              location: u.location,
              description: u.description,
              logoUrl: u.logo || UNIVERSITY_LOGOS[u.slug] || null,
              isActive: true,
              _count: { colleges: u.colleges?.length ?? 6 },
            }))
          );
        }
      })
      .catch((err) => {
        console.warn('Failed to load universities from API, using fallback:', err);
        setUniversities(
          FALLBACK_UNIS.map((u) => ({
            id: u.slug,
            nameAr: u.nameAr,
            nameEn: u.nameEn,
            slug: u.slug,
            location: u.location,
            description: u.description,
            logoUrl: u.logo || UNIVERSITY_LOGOS[u.slug] || null,
            isActive: true,
            _count: { colleges: u.colleges?.length ?? 6 },
          }))
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // فلترة client-side بالبحث
  const filtered = search.trim()
    ? universities.filter(
        (u) =>
          u.nameAr.toLowerCase().includes(search.toLowerCase()) ||
          u.nameEn.toLowerCase().includes(search.toLowerCase()) ||
          u.location?.toLowerCase().includes(search.toLowerCase()),
      )
    : universities;

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <h1 className={styles.title}>الجامعات <span className="gradient-text">المعتمدة في أسيوط</span></h1>
            <p className={styles.subtitle}>
              اختر جامعتك للوصول إلى المحتوى الدراسي والمناهج الرسمية لكلياتك المعتمدة
            </p>

            {/* Search */}
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="ابحث عن جامعة بالاسم أو الموقع..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
                id="universities-search"
              />
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--error)', marginBottom: 20, textAlign: 'center' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Loader2 size={28} style={{ animation: 'spin 0.8s linear infinite' }} />
              <span>جاري تحميل الجامعات...</span>
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              {search ? 'لا توجد نتائج لبحثك' : 'لا توجد جامعات نشطة حالياً.'}
            </div>
          )}

          {/* Grid */}
          {!loading && filtered.length > 0 && (
            <div className={styles.grid}>
              {filtered.map((uni, idx) => {
                const color = COLORS[idx % COLORS.length];
                const logo = uni.logoUrl || UNIVERSITY_LOGOS[uni.slug] || '/images/logos/new-assiut.jpg';
                return (
                  <Link key={uni.slug} href={`/universities/${uni.slug}`} className={styles.card} id={`uni-card-${uni.slug}`}>
                    <div className={styles.cardTop}>
                      <div className={styles.emojiWrap} style={{ '--u-color': color } as React.CSSProperties}>
                        <Image src={logo} alt={uni.nameAr} width={50} height={50} className={styles.logoImg} />
                      </div>
                      <div>
                        <h2 className={styles.uniName}>{uni.nameAr}</h2>
                        <span className={styles.uniNameEn}>{uni.nameEn}</span>
                      </div>
                    </div>

                    <p className={styles.desc}>{uni.description || 'جامعة معتمدة ومسجلة في المنصة'}</p>

                    <div className={styles.meta}>
                      {uni.location && (
                        <div className={styles.metaItem}>
                          <MapPin size={14} />
                          <span>{uni.location}</span>
                        </div>
                      )}
                      <div className={styles.metaItem}>
                        <GraduationCap size={14} />
                        <span>{uni._count?.colleges ?? 10} كليات معتمدة</span>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.enterText}>تصفح الكليات والمواد</span>
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

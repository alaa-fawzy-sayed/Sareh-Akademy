'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Search, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { fetchAllCollegesWithSubjects, type CollegeWithSubjects } from '@/lib/api/services';
import styles from './page.module.css';

// College icon fallback map
const COLLEGE_ICONS: Record<string, string> = {
  pharmacy: '⚗️',
  dentistry: '🦷',
  medicine: '🩺',
  science: '🔬',
  engineering: '⚙️',
  law: '⚖️',
  arts: '🎨',
  commerce: '💼',
  default: '📚',
};

function getIcon(slug: string, icon: string | null): string {
  if (icon) return icon;
  const key = Object.keys(COLLEGE_ICONS).find((k) => slug.includes(k));
  return COLLEGE_ICONS[key ?? 'default'];
}

export default function SubjectsPage() {
  const [colleges, setColleges] = useState<CollegeWithSubjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAllCollegesWithSubjects()
      .then(setColleges)
      .finally(() => setLoading(false));
  }, []);

  // Client-side search filter
  const filtered = search.trim()
    ? colleges
        .map((c) => ({
          ...c,
          subjects: c.subjects.filter((s) =>
            s.nameAr.toLowerCase().includes(search.toLowerCase()) ||
            s.nameEn.toLowerCase().includes(search.toLowerCase()),
          ),
        }))
        .filter((c) => c.subjects.length > 0)
    : colleges;

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          {/* Page header */}
          <div className={styles.header}>
            <h1 className={styles.title}>
              دليل <span className="gradient-text">المواد والمقررات</span>
            </h1>
            <p className={styles.subtitle}>
              تصفح المقررات الدراسية المشروحة والشاملة لجميع التخصصات والكليات الجامعية
            </p>

            {/* Search */}
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="ابحث عن مادة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
                id="subjects-search"
              />
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className={styles.loadingWrap}>
              <Loader2 size={32} className={styles.spinner} />
              <span>جاري تحميل المواد...</span>
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className={styles.emptyWrap}>
              <BookOpen size={48} className={styles.emptyIcon} />
              <p>{search ? 'لا توجد نتائج لبحثك' : 'لا توجد مواد منشورة حالياً'}</p>
            </div>
          )}

          {/* Colleges + Subjects */}
          {!loading && filtered.length > 0 && (
            <div className={styles.categories}>
              {filtered.map((cat) => (
                <section key={cat.id} className={styles.categorySection}>
                  <div className={styles.categoryHeader}>
                    <span className={styles.categoryIcon}>{getIcon(cat.slug, cat.icon)}</span>
                    <h2 className={styles.categoryTitle}>{cat.nameAr}</h2>
                    {cat.universityNameAr && (
                      <span className={styles.categoryUniversity}>{cat.universityNameAr}</span>
                    )}
                    <span className={styles.categoryCount}>{cat.subjects.length} مادة</span>
                  </div>

                  <div className={styles.subjectsGrid}>
                    {cat.subjects.map((sub) => {
                      // بناء الرابط الصحيح للكلية
                      const href = cat.universitySlug
                        ? `/universities/${cat.universitySlug}/${cat.slug}`
                        : `/universities`;
                      return (
                        <Link
                          key={sub.id}
                          href={href}
                          className={styles.subjectCard}
                          id={`subject-card-${sub.id}`}
                        >
                          <div className={styles.subjectName}>{sub.nameAr}</div>
                          <div className={styles.subjectFooter}>
                            {sub.isFree ? (
                              <span className={styles.badgeFree}>متاح مجاناً</span>
                            ) : (
                              <span className={styles.badgePaid}>
                                {sub.price ? `${sub.price} ج` : 'محتوى مميز'}
                              </span>
                            )}
                            <ArrowLeft size={16} className={styles.arrow} />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

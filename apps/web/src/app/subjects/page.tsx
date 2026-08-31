import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Header } from '@/components/layout/Header/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { UNIVERSITIES } from '@/lib/data/universities';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'المواد الدراسية',
  description: 'دليل المقررات والمواد الدراسية لكليات الصيدلة والطب والعلوم والهندسة في الجامعات المصرية',
};

export default function SubjectsPage() {
  // Aggregate colleges and their subjects across universities
  const collegesMap = new Map<string, { nameAr: string; icon: string; subjects: Map<string, { name: string; isFree: boolean }> }>();

  for (const uni of UNIVERSITIES) {
    for (const col of uni.colleges) {
      if (!collegesMap.has(col.slug)) {
        collegesMap.set(col.slug, {
          nameAr: col.nameAr,
          icon: col.icon,
          subjects: new Map(),
        });
      }
      const existingCol = collegesMap.get(col.slug)!;
      for (const sub of col.subjects) {
        if (!existingCol.subjects.has(sub.name)) {
          existingCol.subjects.set(sub.name, {
            name: sub.name,
            isFree: sub.isFree,
          });
        }
      }
    }
  }

  const categoryList = Array.from(collegesMap.entries()).map(([slug, data]) => ({
    slug,
    nameAr: data.nameAr,
    icon: data.icon,
    subjects: Array.from(data.subjects.values()),
  }));

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <h1 className={styles.title}>
              دليل <span className="gradient-text">المواد والمقررات</span>
            </h1>
            <p className={styles.subtitle}>
              تصفح المقررات الدراسية المشروحة والشاملة لجميع التخصصات والكليات الجامعية
            </p>
          </div>

          <div className={styles.categories}>
            {categoryList.map((cat) => (
              <section key={cat.slug} className={styles.categorySection}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryIcon}>{cat.icon}</span>
                  <h2 className={styles.categoryTitle}>{cat.nameAr}</h2>
                </div>

                <div className={styles.subjectsGrid}>
                  {cat.subjects.map((sub, idx) => (
                    <Link
                      key={idx}
                      href={`/universities`}
                      className={styles.subjectCard}
                    >
                      <div className={styles.subjectName}>{sub.name}</div>
                      <div className={styles.subjectFooter}>
                        {sub.isFree ? (
                          <span className={styles.badgeFree}>متاح مجاناً</span>
                        ) : (
                          <span className={styles.badgePaid}>محتوى مميز</span>
                        )}
                        <ArrowLeft size={16} className={styles.arrow} />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

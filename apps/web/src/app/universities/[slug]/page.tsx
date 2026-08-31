import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BookOpen, GraduationCap } from 'lucide-react';
import { getUniversity } from '@/lib/data/universities';
import { Header } from '@/components/layout/Header/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import styles from './page.module.css';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const uni = getUniversity(params.slug);
  if (!uni) return { title: 'الجامعة غير موجودة' };
  
  return {
    title: uni.nameAr,
    description: uni.description,
  };
}

export default async function UniversityPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const uni = getUniversity(params.slug);
  
  if (!uni) notFound();

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* University Header */}
        <div className={styles.hero} style={{ '--u-color': uni.color } as React.CSSProperties}>
          <div className="container">
            <div className={styles.heroInner}>
              <div className={styles.emojiWrap}>
                {uni.logo ? (
                  <Image src={uni.logo} alt={uni.nameAr} width={64} height={64} className={styles.logoImg} />
                ) : (
                  uni.emoji
                )}
              </div>
              <div>
                <h1 className={styles.title}>{uni.nameAr}</h1>
                <p className={styles.subtitle}>{uni.description}</p>
                <div className={styles.meta}>
                  <div className={styles.metaItem}>
                    <GraduationCap size={16} />
                    {uni.established && `تأسست ${uni.established}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colleges Grid */}
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>الكليات المتاحة</h2>
            <p className={styles.sectionDesc}>اختر كليتك لعرض المواد الدراسية الخاصة بها</p>
          </div>

          <div className={styles.grid}>
            {uni.colleges.map((college) => (
              <Link 
                key={college.slug} 
                href={`/universities/${uni.slug}/${college.slug}`}
                className={styles.card}
              >
                <div className={styles.cardTop}>
                  <div className={styles.collegeIcon}>{college.icon}</div>
                  <h3 className={styles.collegeName}>{college.nameAr}</h3>
                </div>
                
                <div className={styles.cardBottom}>
                  <div className={styles.subjectCount}>
                    <BookOpen size={14} />
                    <span>{college.subjects.length} مواد</span>
                  </div>
                  <ArrowLeft size={16} className={styles.arrow} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

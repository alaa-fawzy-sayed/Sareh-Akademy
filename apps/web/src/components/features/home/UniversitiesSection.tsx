import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
import { UNIVERSITIES } from '@/lib/data/universities';
import styles from './UniversitiesSection.module.css';

export function UniversitiesSection() {
  // Only show the first 3 universities on the homepage
  const featuredUniversities = UNIVERSITIES.slice(0, 3);
  return (
    <section className={styles.section} id="universities-section">
      <div className="container">
        <div className={styles.header}>
          <div className={styles.tag}>الجامعات المشتركة</div>
          <h2 className={styles.title}>تغطية شاملة <span className="gradient-text">للجامعات المصرية</span></h2>
          <p className={styles.subtitle}>محتوى تعليمي لكل كليات وتخصصات الجامعات الكبرى في مصر</p>
        </div>

        <div className={styles.grid}>
          {featuredUniversities.map((uni) => (
            <Link key={uni.slug} href={`/universities/${uni.slug}`} className={styles.card} id={`uni-card-${uni.slug}`}>
              <div className={styles.cardTop}>
                <div className={styles.uniEmoji} style={{ '--uni-color': uni.color } as React.CSSProperties}>
                  {uni.logo ? (
                    <Image src={uni.logo} alt={uni.nameAr} width={40} height={40} className={styles.logoImg} />
                  ) : (
                    uni.emoji
                  )}
                </div>
                <div className={styles.uniInfo}>
                  <h3 className={styles.uniName}>{uni.nameAr}</h3>
                  <span className={styles.uniNameEn}>{uni.nameEn}</span>
                </div>
              </div>
              <div className={styles.uniLocation}>
                <MapPin size={12} />
                {uni.location}
              </div>
              <div className={styles.uniStats}>
                <span>{uni.colleges.length} كلية</span>
              </div>
              <div className={styles.cardArrow}>
                <ArrowLeft size={16} />
              </div>
            </Link>
          ))}
        </div>

        <div className={styles.more}>
          <Link href="/universities" className={styles.moreLink} id="universities-view-all">
            عرض جميع الجامعات
            <ArrowLeft size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin, GraduationCap } from 'lucide-react';
import { fetchUniversities, type University } from '@/lib/api/services';
import { UNIVERSITIES as FALLBACK_UNIS } from '@/lib/data/universities';
import styles from './UniversitiesSection.module.css';

const COLORS = ['#6C63FF', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'];

export const UNIVERSITY_LOGOS: Record<string, string> = {
  sphinx: '/images/logos/sphinx.jpg',
  assiut: '/images/logos/assiut.jpg',
  'new-assiut': '/images/logos/new-assiut.jpg',
  badr: '/images/logos/badr.jpg',
  azhar: '/images/logos/azhar.jpg',
};

export function UniversitiesSection() {
  const [universities, setUniversities] = useState<University[]>(() =>
    FALLBACK_UNIS.map((u) => ({
      id: u.slug,
      nameAr: u.nameAr,
      nameEn: u.nameEn,
      slug: u.slug,
      location: u.location,
      description: u.description,
      logoUrl: u.logo || UNIVERSITY_LOGOS[u.slug] || null,
      isActive: true,
      _count: { colleges: u.colleges?.length ?? 10 },
    }))
  );

  useEffect(() => {
    fetchUniversities()
      .then((data) => {
        if (data && data.length > 0) {
          setUniversities(data);
        }
      })
      .catch(() => {
        /* Fallback data already present */
      });
  }, []);

  return (
    <section className={styles.section} id="universities-section">
      <div className="container">
        <div className={styles.header}>
          <div className={styles.tag}>الجامعات المعتمدة</div>
          <h2 className={styles.title}>
            تغطية شاملة <span className="gradient-text">للجامعات المعتمدة في أسيوط</span>
          </h2>
          <p className={styles.subtitle}>
            محتوى تعليمي ومناهج أكاديمية متكاملة لجامعات أسيوط الكبرى وكلياتها
          </p>
        </div>

        <div className={styles.grid}>
          {universities.map((uni, idx) => {
            const color = COLORS[idx % COLORS.length];
            const logo = uni.logoUrl || UNIVERSITY_LOGOS[uni.slug] || '/images/logos/new-assiut.jpg';
            return (
              <Link
                key={uni.slug}
                href={`/universities/${uni.slug}`}
                className={styles.card}
                id={`uni-card-${uni.slug}`}
              >
                <div className={styles.cardTop}>
                  <div
                    className={styles.uniEmoji}
                    style={{ '--uni-color': color } as React.CSSProperties}
                  >
                    <Image
                      src={logo}
                      alt={uni.nameAr}
                      width={48}
                      height={48}
                      className={styles.logoImg}
                    />
                  </div>
                  <div className={styles.uniInfo}>
                    <h3 className={styles.uniName}>{uni.nameAr}</h3>
                    <span className={styles.uniNameEn}>{uni.nameEn}</span>
                  </div>
                </div>

                <div className={styles.uniLocation}>
                  <MapPin size={13} />
                  <span>{uni.location || 'أسيوط، مصر'}</span>
                </div>

                <div className={styles.uniStats}>
                  <GraduationCap size={13} />
                  <span>{uni._count?.colleges ?? 10} كليات معتمدة</span>
                </div>

                <div className={styles.cardArrow}>
                  <span>استعراض الكليات</span>
                  <ArrowLeft size={16} />
                </div>
              </Link>
            );
          })}
        </div>

        <div className={styles.more}>
          <Link href="/universities" className={styles.moreLink} id="universities-view-all">
            عرض جميع الجامعات والكليات
            <ArrowLeft size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

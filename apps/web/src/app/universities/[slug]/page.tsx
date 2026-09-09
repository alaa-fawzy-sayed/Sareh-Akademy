'use client';

import { use, useState, useEffect, useMemo } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  GraduationCap,
  MapPin,
  Loader2,
  Search,
  BookOpen,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  fetchUniversityBySlug,
  fetchCollegesByUniversity,
  type UniversityDetail,
  type College,
} from '@/lib/api/services';
import { Header } from '@/components/layout/Header/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import styles from './page.module.css';

interface FacultyMeta {
  icon: string;
  badge: string;
  color: string;
  bgGlow: string;
  englishDefault: string;
}

const FACULTY_META: Record<string, FacultyMeta> = {
  medicine: {
    icon: '🩺',
    badge: 'القطاع الطبي البشري',
    color: '#3B82F6',
    bgGlow: 'rgba(59, 130, 246, 0.12)',
    englishDefault: 'Faculty of Medicine',
  },
  dentistry: {
    icon: '🦷',
    badge: 'طب وجراحة الفم والأسنان',
    color: '#06B6D4',
    bgGlow: 'rgba(6, 182, 212, 0.12)',
    englishDefault: 'Faculty of Dentistry',
  },
  pharmacy: {
    icon: '💊',
    badge: 'العلوم الصيدلية والسريرية',
    color: '#10B981',
    bgGlow: 'rgba(16, 185, 129, 0.12)',
    englishDefault: 'Faculty of Pharmacy',
  },
  pt: {
    icon: '🏃‍♂️',
    badge: 'العلاج الطبيعي والتأهيل الحركي',
    color: '#F59E0B',
    bgGlow: 'rgba(245, 158, 11, 0.12)',
    englishDefault: 'Faculty of Physical Therapy',
  },
  veterinary: {
    icon: '🐾',
    badge: 'الطب والعلوم البيطرية',
    color: '#EC4899',
    bgGlow: 'rgba(236, 72, 153, 0.12)',
    englishDefault: 'Faculty of Veterinary Medicine',
  },
  nursing: {
    icon: '👩‍⚕️',
    badge: 'التمريض والرعاية الصحية',
    color: '#8B5CF6',
    bgGlow: 'rgba(139, 92, 246, 0.12)',
    englishDefault: 'Faculty of Nursing',
  },
  'health-sciences': {
    icon: '🔬',
    badge: 'تكنولوجيا العلوم الصحية التطبيقية',
    color: '#14B8A6',
    bgGlow: 'rgba(20, 184, 166, 0.12)',
    englishDefault: 'Faculty of Applied Health Sciences',
  },
  science: {
    icon: '🧪',
    badge: 'العلوم الأساسية والبحثية',
    color: '#6366F1',
    bgGlow: 'rgba(99, 102, 241, 0.12)',
    englishDefault: 'Faculty of Science',
  },
  engineering: {
    icon: '⚙️',
    badge: 'العلوم الهندسية والتكنولوجيا',
    color: '#F97316',
    bgGlow: 'rgba(249, 115, 22, 0.12)',
    englishDefault: 'Faculty of Engineering',
  },
  cs: {
    icon: '💻',
    badge: 'الحاسبات والذكاء الاصطناعي',
    color: '#38BDF8',
    bgGlow: 'rgba(56, 189, 248, 0.12)',
    englishDefault: 'Faculty of Computers & AI',
  },
};

function getFacultyMeta(slug: string): FacultyMeta {
  const s = slug.toLowerCase();
  if (s.includes('health-sciences') || s.includes('health')) return FACULTY_META['health-sciences'];
  if (s.includes('dentistry') || s.includes('dental')) return FACULTY_META['dentistry'];
  if (s.includes('medicine') || s.includes('medical')) return FACULTY_META['medicine'];
  if (s.includes('pharmacy') || s.includes('pharma')) return FACULTY_META['pharmacy'];
  if (s.includes('pt') || s.includes('physical-therapy')) return FACULTY_META['pt'];
  if (s.includes('veterinary') || s.includes('vet')) return FACULTY_META['veterinary'];
  if (s.includes('nursing')) return FACULTY_META['nursing'];
  if (s.includes('engineering') || s.includes('eng')) return FACULTY_META['engineering'];
  if (s.includes('cs') || s.includes('computer')) return FACULTY_META['cs'];
  if (s.includes('science')) return FACULTY_META['science'];
  return {
    icon: '📚',
    badge: 'برنامج أكاديمي معتمد',
    color: '#6C63FF',
    bgGlow: 'rgba(108, 99, 255, 0.12)',
    englishDefault: 'Academic Faculty',
  };
}

const UNIVERSITY_LOGOS: Record<string, string> = {
  sphinx: '/images/logos/sphinx.jpg',
  assiut: '/images/logos/assiut.jpg',
  'new-assiut': '/images/logos/new-assiut.jpg',
  badr: '/images/logos/badr.jpg',
  azhar: '/images/logos/azhar.jpg',
};

const UNI_COLORS = ['#6C63FF', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#EC4899'];

export default function UniversityPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);

  const [uni, setUni] = useState<UniversityDetail | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const uniData = await fetchUniversityBySlug(params.slug);
        if (!uniData) {
          setNotFoundFlag(true);
          return;
        }
        setUni(uniData);

        const includedColleges = (uniData as any).colleges as College[] | undefined;
        if (includedColleges && includedColleges.length > 0) {
          setColleges(includedColleges);
        } else {
          const cols = await fetchCollegesByUniversity(uniData.id);
          setColleges(cols);
        }
      } catch {
        setNotFoundFlag(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.slug]);

  const filteredColleges = useMemo(() => {
    if (!search.trim()) return colleges;
    const q = search.toLowerCase().trim();
    return colleges.filter(
      (c) =>
        c.nameAr.toLowerCase().includes(q) ||
        c.nameEn?.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q),
    );
  }, [colleges, search]);

  if (notFoundFlag) notFound();

  const uniColor = UNI_COLORS[0];

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* Loading State */}
        {loading && (
          <div className={styles.loaderWrap}>
            <Loader2 size={32} className={styles.spin} />
            <span>جاري تحميل بيانات الكليات...</span>
          </div>
        )}

        {!loading && uni && (
          <>
            {/* University Hero Header */}
            <section className={styles.hero} style={{ '--u-color': uniColor } as React.CSSProperties}>
              <div className="container">
                <nav className={styles.breadcrumbs}>
                  <Link href="/universities" className={styles.breadcrumbLink}>
                    <ChevronRight size={14} />
                    <span>جميع الجامعات</span>
                  </Link>
                  <span className={styles.breadcrumbDivider}>/</span>
                  <span className={styles.breadcrumbCurrent}>{uni.nameAr}</span>
                </nav>

                <div className={styles.heroInner}>
                  <div className={styles.emojiWrap}>
                    {(() => {
                      const logo = uni.logoUrl || UNIVERSITY_LOGOS[uni.slug] || '/images/logos/new-assiut.jpg';
                      return (
                        <Image
                          src={logo}
                          alt={uni.nameAr}
                          width={84}
                          height={84}
                          className={styles.logoImg}
                        />
                      );
                    })()}
                  </div>
                  <div className={styles.heroInfo}>
                    <div className={styles.titleRow}>
                      <h1 className={styles.title}>{uni.nameAr}</h1>
                      <span className={styles.statusBadge}>
                        <Sparkles size={13} />
                        معتمدة في المنصة
                      </span>
                    </div>
                    <p className={styles.subtitle}>{uni.description ?? uni.nameEn}</p>
                    <div className={styles.meta}>
                      {uni.location && (
                        <div className={styles.metaItem}>
                          <MapPin size={15} />
                          <span>{uni.location}</span>
                        </div>
                      )}
                      <div className={styles.metaItem}>
                        <GraduationCap size={15} />
                        <span>{colleges.length} كليات رسمية مفعّلة</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Colleges Section */}
            <div className="container">
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>الكليات والتخصصات المتاحة</h2>
                  <p className={styles.sectionDesc}>
                    اختر كليتك لعرض المواد الدراسية والمناهج المخصصة لها
                  </p>
                </div>

                {/* Instant Real-Time College Filter */}
                {colleges.length > 0 && (
                  <div className={styles.searchBox}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                      type="text"
                      placeholder="ابحث عن كلية أو تخصص..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={styles.searchInput}
                    />
                  </div>
                )}
              </div>

              {filteredColleges.length === 0 ? (
                <div className={styles.emptyState}>
                  {search ? (
                    <>
                      <p>لا توجد كليات تطابق البحث: &ldquo;{search}&rdquo;</p>
                      <button onClick={() => setSearch('')} className={styles.resetBtn}>
                        إلغاء البحث
                      </button>
                    </>
                  ) : (
                    <p>لا توجد كليات مضافة لهذه الجامعة حالياً</p>
                  )}
                </div>
              ) : (
                <div className={styles.grid}>
                  {filteredColleges.map((college) => {
                    const meta = getFacultyMeta(college.slug);
                    return (
                      <Link
                        key={college.id}
                        href={`/universities/${uni.slug}/${college.slug}`}
                        className={styles.card}
                        id={`college-card-${college.slug}`}
                        style={{ '--faculty-color': meta.color, '--faculty-glow': meta.bgGlow } as React.CSSProperties}
                      >
                        <div className={styles.cardHeader}>
                          <div className={styles.collegeIcon}>
                            <span>{college.icon || meta.icon}</span>
                          </div>
                          <span className={styles.facultyBadge}>{meta.badge}</span>
                        </div>

                        <div className={styles.cardBody}>
                          <h3 className={styles.collegeName}>{college.nameAr}</h3>
                          <span className={styles.collegeNameEn}>
                            {college.nameEn || meta.englishDefault}
                          </span>
                        </div>

                        <div className={styles.cardFooter}>
                          <div className={styles.metaCount}>
                            <BookOpen size={14} />
                            <span>
                              {college._count?.academicYears ?? 1} سنة دراسية
                            </span>
                          </div>
                          <div className={styles.actionPrompt}>
                            <span>دخول الكلية</span>
                            <ArrowLeft size={15} className={styles.arrowIcon} />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

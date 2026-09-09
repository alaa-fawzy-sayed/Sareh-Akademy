'use client';

import { use, useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Lock,
  Unlock,
  PlayCircle,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import {
  fetchCollegeBySlug,
  type CollegeDetail,
  type Subject,
} from '@/lib/api/services';
import { useIsAdmin } from '@/lib/hooks/useIsAdmin';
import { Header } from '@/components/layout/Header/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { Button } from '@/components/ui/Button/Button';
import { PaymentModal } from '@/components/features/payment/PaymentModal';
import styles from './page.module.css';

const COLLEGE_ICONS: Record<string, string> = {
  pharmacy: '⚗️', dentistry: '🦷', medicine: '🩺',
  science: '🔬', engineering: '⚙️', law: '⚖️',
  arts: '🎨', commerce: '💼', default: '📚',
};

function getIcon(slug: string, icon?: string | null): string {
  if (icon) return icon;
  const key = Object.keys(COLLEGE_ICONS).find((k) => slug.toLowerCase().includes(k));
  return COLLEGE_ICONS[key ?? 'default'];
}

export default function CollegePage(props: { params: Promise<{ slug: string; college: string }> }) {
  const params = use(props.params);
  const isAdmin = useIsAdmin();

  const [college, setCollege] = useState<CollegeDetail | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [paymentSubject, setPaymentSubject] = useState<{ id: string; name: string; price: number } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCollegeBySlug(params.slug, params.college);
        if (!data) { setNotFoundFlag(true); return; }
        setCollege(data);

        // Subjects may be nested inside the college detail
        const nested = (data as any).subjects as Subject[] | undefined;
        setSubjects(nested ?? []);
      } catch {
        setNotFoundFlag(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.slug, params.college]);

  if (notFoundFlag) notFound();

  const handleSubjectClick = (subject: Subject) => {
    // Navigate directly to the subject details / player
    const targetUrl = `/universities/${params.slug}/${params.college}/${subject.slug}`;
    window.location.href = targetUrl;
  };

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* Loading */}
        {loading && (
          <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 12, color: 'var(--text-muted)' }}>
            <Loader2 size={28} style={{ animation: 'spin 0.8s linear infinite' }} />
            <span>جاري التحميل...</span>
          </div>
        )}

        {!loading && college && (
          <div className="container">
            {/* Breadcrumbs */}
            <div className={styles.breadcrumbs}>
              <Link href="/universities">الجامعات</Link>
              <span className={styles.separator}>/</span>
              <Link href={`/universities/${college.university.slug}`}>
                {college.university.nameAr}
              </Link>
              <span className={styles.separator}>/</span>
              <span className={styles.current}>{college.nameAr}</span>
            </div>

            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerTitle}>
                <div className={styles.iconWrap}>
                  {getIcon(college.slug, college.icon)}
                </div>
                <div>
                  <h1 className={styles.title}>{college.nameAr}</h1>
                  <p className={styles.subtitle}>
                    <GraduationCap size={14} style={{ display: 'inline', marginLeft: 4 }} />
                    {college.university.nameAr}
                  </p>
                </div>
              </div>
            </div>

            {/* Subjects Grid */}
            {subjects.length === 0 ? (
              <div className={styles.empty}>
                <BookOpen size={48} className={styles.emptyIcon} />
                <p>لا توجد مواد مضافة في هذه الكلية حالياً.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {subjects.map((subject) => {
                  const hasContent = (subject._count?.chapters ?? 0) > 0 || !!subject.introVideoUrl;
                  const subjectHref = `/universities/${params.slug}/${params.college}/${subject.slug}`;
                  return (
                    <div key={subject.id} className={styles.card} id={`subject-${subject.id}`}>
                      <div className={styles.cardTop}>
                        <div className={styles.subjectIcon}>
                          <BookOpen size={20} />
                        </div>
                        <div className={styles.badges}>
                          {subject.isFree ? (
                            <span className={`${styles.badge} ${styles.badgeFree}`}>
                              <Unlock size={12} /> مجاني
                            </span>
                          ) : (
                            <span className={`${styles.badge} ${styles.badgePaid}`}>
                              <Lock size={12} /> {subject.price ? `${subject.price} ج` : 'مدفوع'}
                            </span>
                          )}
                          {!hasContent && (
                            <span
                              className={styles.badge}
                              style={{ background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8' }}
                            >
                              قيد التجهيز
                            </span>
                          )}
                        </div>
                      </div>

                      <Link href={subjectHref} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3 className={styles.subjectName}>{subject.nameAr}</h3>
                      </Link>
                      <p className={styles.subjectDesc}>
                        {subject.description ?? 'مقرر دراسي متخصص لطلاب الكلية.'}
                      </p>

                      <div className={styles.cardBottom}>
                        <Link href={subjectHref} style={{ width: '100%', textDecoration: 'none' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            fullWidth
                            leftIcon={<PlayCircle size={16} />}
                          >
                            {hasContent
                              ? (subject.isFree || isAdmin ? 'تصفح المحتوى' : 'استعراض واشتراك')
                              : 'تفاصيل المادة'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={!!paymentSubject}
        onClose={() => setPaymentSubject(null)}
        subjectId={paymentSubject?.id ?? ''}
        subjectName={paymentSubject?.name ?? ''}
        price={paymentSubject?.price ?? 0}
      />
    </>
  );
}

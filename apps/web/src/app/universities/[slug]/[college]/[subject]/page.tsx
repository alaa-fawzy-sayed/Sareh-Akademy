'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import {
  Play,
  Lock,
  Unlock,
  FileText,
  CheckCircle2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Layers,
  ShieldCheck,
  Video,
  Download,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Header } from '@/components/layout/Header/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { PaymentModal } from '@/components/features/payment/PaymentModal';
import { fetchSubjectBySlugOrId, type SubjectDetail } from '@/lib/api/services';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api/client';
import { Clock } from 'lucide-react';
import styles from './page.module.css';

function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
  );
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  }
  return null;
}

export default function StudentSubjectDetailPage() {
  const params = useParams() as { slug: string; college: string; subject: string };
  const { isAuthenticated } = useAuthStore();
  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [isPendingReview, setIsPendingReview] = useState(false);

  // Video Player state
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>('الفيديو التعريفي للمادة');

  // Accordion state
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Payment modal state
  const [paymentOpen, setPaymentOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchSubjectBySlugOrId(params.subject);
        if (!data) {
          setNotFoundFlag(true);
          return;
        }
        setSubject(data);

        // Check if student already has access or has pending payment
        if (isAuthenticated) {
          try {
            const [mySubRes, ordersRes] = await Promise.all([
              api.get('/subjects/my').catch(() => null),
              api.get('/payments/orders?limit=20').catch(() => null),
            ]);

            if (mySubRes?.data) {
              const mySubs = mySubRes.data?.data ?? mySubRes.data ?? [];
              const enrolled = Array.isArray(mySubs) && mySubs.some(
                (item: any) => item.subjectId === data.id || item.subject?.id === data.id
              );
              if (enrolled) setHasAccess(true);
            }

            if (ordersRes?.data) {
              const orders = ordersRes.data?.data?.data ?? ordersRes.data?.data ?? ordersRes.data ?? [];
              const pending = Array.isArray(orders) && orders.some(
                (o: any) => o.status === 'PENDING' && o.items?.some((i: any) => i.subjectId === data.id)
              );
              if (pending) setIsPendingReview(true);
            }
          } catch {
            // Ignore background access check errors
          }
        }

        // Set initial video (either introVideoUrl or first free video from chapters)
        if (data.introVideoUrl) {
          setCurrentVideoUrl(data.introVideoUrl);
          setCurrentVideoTitle('الفيديو التعريفي للمادة');
        } else {
          // Check if there is any free video in chapters
          const firstFree = data.chapters
            ?.flatMap((c) => c.contents)
            .find((cnt) => cnt.type === 'VIDEO' && cnt.isFree);
          if (firstFree) {
            // we can set title
            setCurrentVideoTitle(firstFree.titleAr);
          }
        }

        // Expand first chapter by default
        if (data.chapters && data.chapters.length > 0) {
          setExpandedChapters({ [data.chapters[0].id]: true });
        }
      } catch {
        setNotFoundFlag(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.subject]);

  if (notFoundFlag) notFound();

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const handlePlayFreeLesson = (content: any) => {
    // If the content has a video, set it
    setCurrentVideoTitle(content.titleAr);
    // If we have content.video or url
    if (content.video?.storageKey) {
      setCurrentVideoUrl(content.video.storageKey);
    } else if (subject?.introVideoUrl) {
      setCurrentVideoUrl(subject.introVideoUrl);
    }
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const totalLessons =
    subject?.chapters?.reduce((acc, c) => acc + (c.contents?.length || 0), 0) || 0;
  const isFreeSubject = subject?.isFree;
  const youtubeEmbed = getYouTubeEmbedUrl(currentVideoUrl);

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          {/* Loading */}
          {loading && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
                gap: 12,
                color: 'var(--text-muted)',
              }}
            >
              <Loader2 size={30} style={{ animation: 'spin 0.8s linear infinite' }} />
              <span>جاري تحميل المادة التعليمية...</span>
            </div>
          )}

          {!loading && subject && (
            <>
              {/* Breadcrumbs */}
              <div className={styles.breadcrumbs}>
                <Link href="/universities">الجامعات</Link>
                <span className={styles.separator}>/</span>
                <Link href={`/universities/${params.slug}`}>
                  {subject.semester?.academicYear?.college?.university?.nameAr || 'الجامعة'}
                </Link>
                <span className={styles.separator}>/</span>
                <Link href={`/universities/${params.slug}/${params.college}`}>
                  {subject.semester?.academicYear?.college?.nameAr || 'الكلية'}
                </Link>
                <span className={styles.separator}>/</span>
                <span className={styles.current}>{subject.nameAr}</span>
              </div>

              {/* Main Layout */}
              <div className={styles.layoutGrid}>
                {/* Left Column: Player, Description & Chapters */}
                <div className={styles.contentArea}>
                  {/* Subject Title & Badges */}
                  <div className={styles.subjectHeader}>
                    <div className={styles.badgesRow}>
                      <span className={`${styles.badge} ${styles.badgeCollege}`}>
                        <BookOpen size={13} /> {subject.semester?.academicYear?.college?.nameAr}
                      </span>
                      {isFreeSubject ? (
                        <span className={`${styles.badge} ${styles.badgeFree}`}>
                          <Unlock size={13} /> مادة مجانية بالكامل
                        </span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgePaid}`}>
                          <Lock size={13} /> {subject.price ? `${subject.price} ج.م` : 'مدفوع'}
                        </span>
                      )}
                      {totalLessons > 0 ? (
                        <span className={`${styles.badge} ${styles.badgeFree}`}>
                          <Layers size={13} /> {subject.chapters?.length} فصول — {totalLessons} درس
                        </span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeDraft}`}>
                          قيد إعداد المحتوى
                        </span>
                      )}
                    </div>

                    <h1 className={styles.title}>{subject.nameAr}</h1>
                    <p className={styles.subTitle}>{subject.nameEn}</p>
                  </div>

                  {/* Video Player */}
                  <div className={styles.playerWrapper} id="subject-player">
                    {youtubeEmbed ? (
                      <iframe
                        src={youtubeEmbed}
                        title={currentVideoTitle}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className={styles.videoIframe}
                      />
                    ) : currentVideoUrl ? (
                      <video
                        src={currentVideoUrl}
                        controls
                        controlsList="nodownload"
                        playsInline
                        className={styles.htmlVideo}
                      />
                    ) : (
                      <div className={styles.videoPlaceholder}>
                        <div className={styles.placeholderPlayBtn}>
                          <Video size={28} />
                        </div>
                        <div>
                          <h3 style={{ color: '#fff', fontSize: 17, marginBottom: 6 }}>
                            الفيديو التعريفي قيد التجهيز
                          </h3>
                          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                            سيقوم المحاضر برفع برومو المادة ومحاضرات المعاينة المجانية قريباً
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description Box */}
                  <div className={styles.box}>
                    <div className={styles.boxTitle}>
                      <Sparkles size={18} style={{ color: 'var(--primary)' }} />
                      نبذة عن المقرر الدراسي
                    </div>
                    <p className={styles.descriptionText}>
                      {subject.description ||
                        'مقرر دراسي شامل يغطي كافة الجوانب النظرية والتطبيقية، مع شروحات تفصيلية لأهم موضوعات وتطبيقات المادة لطلاب الكلية.'}
                    </p>
                  </div>

                  {/* Chapters & Curriculum */}
                  <div className={styles.box}>
                    <div className={styles.boxTitle}>
                      <Layers size={18} style={{ color: 'var(--primary)' }} />
                      محتويات ومنهج المادة ({subject.chapters?.length || 0} فصول)
                    </div>

                    {subject.chapters && subject.chapters.length > 0 ? (
                      <div className={styles.chaptersList}>
                        {subject.chapters.map((chapter, idx) => {
                          const isExpanded = !!expandedChapters[chapter.id];
                          const contents = chapter.contents || [];
                          return (
                            <div key={chapter.id} className={styles.chapterItem}>
                              <button
                                className={styles.chapterHeader}
                                onClick={() => toggleChapter(chapter.id)}
                                type="button"
                              >
                                <div className={styles.chapterTitleWrap}>
                                  <span className={styles.chapterIndex}>{idx + 1}</span>
                                  <span className={styles.chapterTitle}>{chapter.titleAr}</span>
                                </div>
                                <div className={styles.chapterMeta}>
                                  <span>{contents.length} دروس / ملفات</span>
                                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </div>
                              </button>

                              {isExpanded && (
                                <div className={styles.lessonsList}>
                                  {contents.length > 0 ? (
                                    contents.map((item) => (
                                      <div key={item.id} className={styles.lessonRow}>
                                        <div className={styles.lessonLeft}>
                                          <div className={styles.lessonIcon}>
                                            {item.type === 'VIDEO' ? (
                                              <Video size={16} />
                                            ) : (
                                              <FileText size={16} />
                                            )}
                                          </div>
                                          <span className={styles.lessonTitle}>{item.titleAr}</span>
                                        </div>

                                        <div className={styles.lessonRight}>
                                          {item.isFree || isFreeSubject || hasAccess ? (
                                            <Link
                                              href={`/universities/${params.slug}/${params.college}/${params.subject}/watch?lesson=${item.id}`}
                                              className={styles.btnPlayPreview}
                                              style={{ textDecoration: 'none' }}
                                            >
                                              <Play size={11} /> {hasAccess ? 'مشاهدة الدرس' : 'معاينة مجانية'}
                                            </Link>
                                          ) : (
                                            <span className={styles.lockedTag}>
                                              <Lock size={12} /> مقفل
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div
                                      style={{
                                        padding: '14px 20px',
                                        fontSize: 13,
                                        color: 'var(--text-muted)',
                                      }}
                                    >
                                      جاري رفع دروس هذا الفصل...
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={styles.emptyState}>
                        <BookOpen size={40} style={{ opacity: 0.4, marginBottom: 10 }} />
                        <p style={{ margin: 0, fontSize: 14 }}>
                          الفصول والمحاضرات قيد الإعداد والرفع بواسطة هيئة التدريس.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Sticky Pricing & Action Card */}
                <div className={styles.sidebar}>
                  <div className={styles.priceCard}>
                    <div className={styles.priceHeader}>
                      <div>
                        <span className={styles.priceAmount}>
                          {isFreeSubject ? 'مجاناً' : subject.price || 0}
                        </span>
                        {!isFreeSubject && <span className={styles.priceCurrency}>ج.م</span>}
                      </div>
                      <span
                        className={`${styles.badge} ${hasAccess || isFreeSubject ? styles.badgeFree : styles.badgePaid}`}
                      >
                        {hasAccess ? 'مشترك ومفعل ✅' : isFreeSubject ? 'وصول مفتوح' : isPendingReview ? 'قيد المراجعة ⏳' : 'اشتراك كامل'}
                      </span>
                    </div>

                    <div className={styles.featuresList}>
                      <div className={styles.featureItem}>
                        <CheckCircle2 size={16} className={styles.featureCheck} />
                        <span>مشاهدة كافة المحاضرات بجودة Full HD</span>
                      </div>
                      <div className={styles.featureItem}>
                        <CheckCircle2 size={16} className={styles.featureCheck} />
                        <span>تحميل المذكرات والملخصات بتنسيق PDF</span>
                      </div>
                      <div className={styles.featureItem}>
                        <CheckCircle2 size={16} className={styles.featureCheck} />
                        <span>بنك أسئلة واختبارات تفاعلية دورية</span>
                      </div>
                      <div className={styles.featureItem}>
                        <CheckCircle2 size={16} className={styles.featureCheck} />
                        <span>وصول دائم ومستمر طوال العام الدراسي</span>
                      </div>
                      <div className={styles.featureItem}>
                        <ShieldCheck size={16} className={styles.featureCheck} />
                        <span>معتمد ومطابق للائحة الكلية</span>
                      </div>
                    </div>

                    {hasAccess || isFreeSubject ? (
                      <Link
                        href={`/universities/${params.slug}/${params.college}/${params.subject}/watch`}
                        className={styles.actionBtn}
                        style={{
                          background: 'linear-gradient(135deg, #10B981, #059669)',
                          border: 'none',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                        id="subject-start-learning-btn"
                      >
                        <Play size={16} /> {hasAccess ? 'ابدأ التعلم والمشاهدة الآن' : 'ابدأ المشاهدة المجانية'}
                      </Link>
                    ) : isPendingReview ? (
                      <button
                        className={styles.actionBtn}
                        style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid #f59e0b', cursor: 'default' }}
                        disabled
                        id="subject-pending-review-btn"
                      >
                        <Clock size={16} /> طلبك قيد المراجعة والتحقق بواسطة الإدارة
                      </button>
                    ) : (
                      <button
                        className={styles.actionBtn}
                        onClick={() => setPaymentOpen(true)}
                        id="subject-subscribe-btn"
                      >
                        <Lock size={16} /> اشترك في المادة الآن
                      </button>
                    )}

                    <div style={{ marginTop: 12 }}>
                      <Link
                        href={`/universities/${params.slug}/${params.college}`}
                        className={styles.actionBtnOutline}
                      >
                        <ArrowRight size={14} /> العودة لمقررات الكلية
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />

      {/* Payment Modal */}
      {subject && (
        <PaymentModal
          isOpen={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          subjectId={subject.id}
          subjectName={subject.nameAr}
          price={subject.price ?? 150}
          onSuccess={() => {
            setPaymentOpen(false);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}

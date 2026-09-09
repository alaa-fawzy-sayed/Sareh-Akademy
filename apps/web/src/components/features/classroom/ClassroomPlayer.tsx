'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Sliders,
  CheckCircle2,
  Lock,
  Unlock,
  BookOpen,
  FileText,
  Video,
  Award,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search,
  Download,
  ShieldAlert,
  Loader2,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
  Settings,
  Upload,
  X,
  Plus,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth.store';
import { useIsAdmin } from '@/lib/hooks/useIsAdmin';
import { QuizView, type QuizDetails } from './QuizView';
import styles from './ClassroomPlayer.module.css';

export interface LessonContent {
  id: string;
  titleAr: string;
  titleEn?: string | null;
  description?: string | null;
  type: 'VIDEO' | 'FILE' | 'QUIZ';
  isFree: boolean;
  isPublished: boolean;
  displayOrder: number;
  video?: {
    duration?: number;
    storageKey?: string;
    viewCount?: number;
    qualities?: any;
  } | null;
  file?: {
    storageKey?: string;
    fileType?: string;
    originalName?: string;
    sizeBytes?: string | number;
    downloadCount?: number;
  } | null;
  quiz?: QuizDetails | null;
}

export interface Chapter {
  id: string;
  titleAr: string;
  titleEn?: string | null;
  displayOrder: number;
  contents: LessonContent[];
}

export interface ClassroomSubject {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  description?: string | null;
  isFree: boolean;
  price?: number | null;
  chapters: Chapter[];
  semester?: {
    nameAr: string;
    academicYear?: {
      nameAr: string;
      college?: {
        nameAr: string;
        slug: string;
        university?: {
          nameAr: string;
          slug: string;
        };
      };
    };
  };
}

interface ClassroomPlayerProps {
  subject: ClassroomSubject;
  initialLessonId?: string;
  hasAccess: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function ClassroomPlayer({
  subject,
  initialLessonId,
  hasAccess,
}: ClassroomPlayerProps) {
  const { user } = useAuthStore();
  const isAdmin = useIsAdmin();

  // Flatten all lessons across chapters
  const allLessons = useMemo(() => {
    return (subject.chapters || []).flatMap((c) =>
      (c.contents || []).map((cnt) => ({
        ...cnt,
        chapterId: c.id,
        chapterTitle: c.titleAr,
      }))
    );
  }, [subject.chapters]);

  // Active lesson state
  const [activeLessonId, setActiveLessonId] = useState<string>(() => {
    if (initialLessonId && allLessons.some((l) => l.id === initialLessonId)) {
      return initialLessonId;
    }
    return allLessons[0]?.id || '';
  });

  // Current active lesson details
  const activeLesson = useMemo(() => {
    return allLessons.find((l) => l.id === activeLessonId) || allLessons[0] || null;
  }, [allLessons, activeLessonId]);

  // Content detailed info from GET /content/:id
  const [contentDetail, setContentDetail] = useState<any>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  // User progress state (completed lesson IDs & positions)
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [lessonPositions, setLessonPositions] = useState<Record<string, number>>({});

  // Accordion state
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (subject.chapters && subject.chapters.length > 0) {
      subject.chapters.forEach((c, i) => {
        initial[c.id] = i === 0; // expand first chapter by default
      });
    }
    return initial;
  });

  // Sidebar search
  const [searchQuery, setSearchQuery] = useState('');

  // Theater mode (full width)
  const [theaterMode, setTheaterMode] = useState(false);

  // Active Bottom Tab: 'overview' | 'files' | 'quiz' | 'discussion'
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'quiz'>('overview');

  // Video Player states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Anti-Recording Watermark position
  const [watermarkPos, setWatermarkPos] = useState({ top: '15%', left: '20%' });

  // Anti-Screen Capture window blur overlay
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);

  // Admin Controls modal / dropdown state
  const [adminPublishState, setAdminPublishState] = useState<{
    isPublished: boolean;
    isFree: boolean;
  }>({
    isPublished: activeLesson?.isPublished ?? true,
    isFree: activeLesson?.isFree ?? false,
  });
  const [savingAdmin, setSavingAdmin] = useState(false);

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadChapterId, setUploadChapterId] = useState(subject.chapters?.[0]?.id || '');
  const [uploadMode, setUploadMode] = useState<'VIDEO_FILE' | 'VIDEO_URL' | 'FILE'>('VIDEO_FILE');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadVideoUrl, setUploadVideoUrl] = useState('');
  const [uploadDurationMins, setUploadDurationMins] = useState(25);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadIsFree, setUploadIsFree] = useState(false);
  const [uploadIsPublished, setUploadIsPublished] = useState(true);
  const [isSubmittingUpload, setIsSubmittingUpload] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      setUploadStatusMsg({ type: 'error', text: 'يرجى إدخال عنوان الدرس أو المحاضرة' });
      return;
    }
    if (!uploadChapterId) {
      setUploadStatusMsg({ type: 'error', text: 'يرجى تحديد الفصل المستهدف' });
      return;
    }

    setIsSubmittingUpload(true);
    setUploadStatusMsg(null);

    try {
      if (uploadMode === 'VIDEO_URL') {
        if (!uploadVideoUrl.trim()) {
          setUploadStatusMsg({ type: 'error', text: 'يرجى كتابة رابط الفيديو (YouTube أو مباشر)' });
          setIsSubmittingUpload(false);
          return;
        }
        await api.post('/content/create', {
          chapterId: uploadChapterId,
          type: 'VIDEO',
          titleAr: uploadTitle.trim(),
          description: uploadDesc.trim() || undefined,
          videoUrl: uploadVideoUrl.trim(),
          duration: (uploadDurationMins || 15) * 60,
          isFree: uploadIsFree,
          isPublished: uploadIsPublished,
        });
      } else {
        if (!uploadFile) {
          setUploadStatusMsg({ type: 'error', text: 'يرجى اختيار ملف لرفعه من جهازك' });
          setIsSubmittingUpload(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('chapterId', uploadChapterId);
        formData.append('titleAr', uploadTitle.trim());
        if (uploadDesc.trim()) formData.append('description', uploadDesc.trim());
        formData.append('isFree', uploadIsFree ? 'true' : 'false');
        formData.append('isPublished', uploadIsPublished ? 'true' : 'false');

        const endpoint = uploadMode === 'VIDEO_FILE' ? '/content/upload/video' : '/content/upload/file';
        await api.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setUploadStatusMsg({ type: 'success', text: '✅ تم رفع وإضافة المحتوى بنجاح! جاري التحديث...' });
      setTimeout(() => {
        setIsUploadOpen(false);
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء رفع المحتوى';
      setUploadStatusMsg({ type: 'error', text: Array.isArray(msg) ? msg[0] : msg });
    } finally {
      setIsSubmittingUpload(false);
    }
  };

  // 1. Fetch user progress for this subject
  useEffect(() => {
    async function loadProgress() {
      try {
        const res = await api.get(`/progress/my?subjectId=${subject.id}`);
        const data = res.data?.data ?? res.data;
        if (Array.isArray(data)) {
          const comp: Record<string, boolean> = {};
          const pos: Record<string, number> = {};
          data.forEach((p: any) => {
            if (p.contentId) {
              if (p.completed) comp[p.contentId] = true;
              if (p.position) pos[p.contentId] = p.position;
            }
          });
          setCompletedLessons(comp);
          setLessonPositions(pos);
        }
      } catch {
        // user may not be logged in or guest
      }
    }
    if (subject.id) {
      loadProgress();
    }
  }, [subject.id]);

  // 2. Fetch active lesson content details (playback URL, quiz questions, download URL)
  useEffect(() => {
    if (!activeLessonId) return;

    let isMounted = true;
    async function fetchLessonData() {
      setLoadingContent(true);
      try {
        const res = await api.get(`/content/${activeLessonId}`);
        const data = res.data?.data ?? res.data;
        if (isMounted) {
          setContentDetail(data);
          setAdminPublishState({
            isPublished: data.isPublished ?? true,
            isFree: data.isFree ?? false,
          });
          // Expand current lesson's chapter
          if (activeLesson?.chapterId) {
            setExpandedChapters((prev) => ({ ...prev, [activeLesson.chapterId]: true }));
          }
        }
      } catch {
        if (isMounted) setContentDetail(null);
      } finally {
        if (isMounted) setLoadingContent(false);
      }
    }

    fetchLessonData();
    return () => {
      isMounted = false;
    };
  }, [activeLessonId, activeLesson?.chapterId]);

  // 3. Move Watermark randomly every 8 seconds (Anti-screen recording)
  useEffect(() => {
    const interval = setInterval(() => {
      const top = Math.floor(Math.random() * 70 + 10) + '%';
      const left = Math.floor(Math.random() * 65 + 10) + '%';
      setWatermarkPos({ top, left });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // 4. Anti-screen capture: Detect window blur & PrintScreen interception
  useEffect(() => {
    const handleBlur = () => setIsWindowBlurred(true);
    const handleFocus = () => setIsWindowBlurred(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Intercept PrintScreen
      if (e.key === 'PrintScreen') {
        navigator.clipboard?.writeText?.('');
        setIsWindowBlurred(true);
        setTimeout(() => setIsWindowBlurred(false), 2000);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keyup', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keyup', handleKeyDown);
    };
  }, []);

  // 5. Periodic Progress Auto-Save (Every 10 seconds while playing)
  const saveProgress = useCallback(
    async (pos: number, isDone = false) => {
      if (!activeLessonId) return;
      try {
        await api.post('/progress', {
          contentId: activeLessonId,
          position: Math.floor(pos),
          completed: isDone,
        });

        if (isDone) {
          setCompletedLessons((prev) => ({ ...prev, [activeLessonId]: true }));
        }
        setLessonPositions((prev) => ({ ...prev, [activeLessonId]: Math.floor(pos) }));
      } catch {
        // Ignore progress save errors in background
      }
    },
    [activeLessonId]
  );

  useEffect(() => {
    if (!isPlaying || !videoRef.current) return;

    const interval = setInterval(() => {
      if (videoRef.current) {
        const cur = videoRef.current.currentTime;
        const dur = videoRef.current.duration;
        const completed = dur > 0 && cur / dur >= 0.85;
        saveProgress(cur, completed);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isPlaying, saveProgress]);

  // Video Playback Handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      saveProgress(videoRef.current.currentTime);
    } else {
      videoRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration;
    setCurrentTime(cur);
    setDuration(dur || 0);

    // Auto mark completed at 85%
    if (dur > 0 && cur / dur >= 0.85 && !completedLessons[activeLessonId]) {
      setCompletedLessons((prev) => ({ ...prev, [activeLessonId]: true }));
      saveProgress(cur, true);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    videoRef.current.playbackRate = playbackSpeed;

    // Resume from last position if saved
    const savedPos = lessonPositions[activeLessonId];
    if (savedPos && savedPos < videoRef.current.duration - 5) {
      videoRef.current.currentTime = savedPos;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = percent * duration;
    setCurrentTime(percent * duration);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  const skipSeconds = (secs: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(duration, videoRef.current.currentTime + secs)
    );
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const elem = document.getElementById('classroom-player-box');
    if (!elem) return;
    if (!document.fullscreenElement) {
      elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Next / Previous Lesson Navigation
  const currentLessonIndex = allLessons.findIndex((l) => l.id === activeLessonId);
  const hasNextLesson = currentLessonIndex < allLessons.length - 1;
  const hasPrevLesson = currentLessonIndex > 0;

  const goToNextLesson = () => {
    if (hasNextLesson) {
      const next = allLessons[currentLessonIndex + 1];
      setActiveLessonId(next.id);
      setIsPlaying(false);
    }
  };

  const goToPrevLesson = () => {
    if (hasPrevLesson) {
      const prev = allLessons[currentLessonIndex - 1];
      setActiveLessonId(prev.id);
      setIsPlaying(false);
    }
  };

  // Mark Active Lesson Complete manually
  const toggleCompleteActiveLesson = async () => {
    const newState = !completedLessons[activeLessonId];
    setCompletedLessons((prev) => ({ ...prev, [activeLessonId]: newState }));
    await saveProgress(currentTime, newState);
  };

  // Admin Publish & Free Status Toggle Handler
  const handleSaveAdminPublish = async (newPublished: boolean, newFree: boolean) => {
    setSavingAdmin(true);
    try {
      await api.patch(`/content/${activeLessonId}`, {
        isPublished: newPublished,
        isFree: newFree,
      });
      setAdminPublishState({ isPublished: newPublished, isFree: newFree });
      if (contentDetail) {
        setContentDetail((prev: any) => ({
          ...prev,
          isPublished: newPublished,
          isFree: newFree,
        }));
      }
    } catch (err) {
      alert('حدث خطأ أثناء تحديث إعدادات نشر المحتوى.');
    } finally {
      setSavingAdmin(false);
    }
  };

  // Overall Course Progress Calculation
  const totalLessonsCount = allLessons.length;
  const completedCount = Object.values(completedLessons).filter(Boolean).length;
  const overallPercentage =
    totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;

  // Filter lessons for sidebar
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return subject.chapters || [];
    const q = searchQuery.toLowerCase().trim();
    return (subject.chapters || [])
      .map((ch) => ({
        ...ch,
        contents: (ch.contents || []).filter((cnt) =>
          cnt.titleAr.toLowerCase().includes(q) ||
          cnt.titleEn?.toLowerCase().includes(q)
        ),
      }))
      .filter((ch) => ch.contents.length > 0);
  }, [subject.chapters, searchQuery]);

  // Video URL helper
  const playbackUrl = contentDetail?.playbackUrl || activeLesson?.video?.storageKey;
  const isYouTube = playbackUrl?.includes('youtube.com') || playbackUrl?.includes('youtu.be');
  const ytEmbed = isYouTube
    ? `https://www.youtube.com/embed/${
        playbackUrl?.match(/(?:youtu\.be\/|watch\?v=)([\w-]+)/)?.[1] || ''
      }?autoplay=1&rel=0`
    : null;

  // Lesson access check
  const isLessonAccessible =
    activeLesson?.isFree || subject.isFree || hasAccess || isAdmin;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const uniName = subject.semester?.academicYear?.college?.university?.nameAr || 'الجامعة';
  const collegeName = subject.semester?.academicYear?.college?.nameAr || 'الكلية';
  const uniSlug = subject.semester?.academicYear?.college?.university?.slug || 'assiut';
  const colSlug = subject.semester?.academicYear?.college?.slug || 'pharmacy';

  return (
    <div className={styles.classroomWrapper} id="classroom-main">
      {/* Top Classroom Bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Link
            href={`/universities/${uniSlug}/${colSlug}/${subject.slug}`}
            className={styles.backBtn}
            id="back-to-course-btn"
          >
            <ChevronRight size={16} />
            <span>نظرة عامة على المادة</span>
          </Link>

          <div className={styles.courseBreadcrumb}>
            <span className={styles.courseSubjectTitle}>{subject.nameAr}</span>
            <span className={styles.currentLessonBreadcrumb}>
              {activeLesson ? activeLesson.titleAr : 'جاري تحميل الدرس...'}
            </span>
          </div>
        </div>

        <div className={styles.topBarRight}>
          {/* Admin Publish Status Badge & Toggle */}
          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                className={`${styles.adminPublishBadge} ${adminPublishState.isPublished ? styles.badgePublished : styles.badgeDraft}`}
              >
                {adminPublishState.isPublished ? 'منشور للطلاب' : 'مسودة (مخفي)'}
              </span>
              <button
                type="button"
                className={styles.btnTopAction}
                disabled={savingAdmin}
                onClick={() =>
                  handleSaveAdminPublish(
                    !adminPublishState.isPublished,
                    adminPublishState.isFree
                  )
                }
                title="تغيير حالة النشر للمحتوى"
              >
                {adminPublishState.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{adminPublishState.isPublished ? 'إخفاء كمسودة' : 'نشر للطلاب'}</span>
              </button>
              <button
                type="button"
                className={styles.btnTopAction}
                disabled={savingAdmin}
                onClick={() =>
                  handleSaveAdminPublish(
                    adminPublishState.isPublished,
                    !adminPublishState.isFree
                  )
                }
                title="تغيير الإتاحة المجانية"
              >
                {adminPublishState.isFree ? <Lock size={13} /> : <Unlock size={13} />}
                <span>{adminPublishState.isFree ? 'جعله مدفوع' : 'معاينة مجانية'}</span>
              </button>

              {/* Upload Content Button */}
              <button
                type="button"
                className={styles.btnTopAction}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  gap: 6,
                }}
                onClick={() => setIsUploadOpen(true)}
                id="admin-upload-content-btn"
                title="رفع وإضافة محاضرة فيديو أو مذكرة PDF"
              >
                <Upload size={13} />
                <span>رفع درس جديد</span>
              </button>
            </div>
          )}

          {/* Overall Progress */}
          <div className={styles.overallProgressBox}>
            <span className={styles.overallProgressLabel}>
              إنجازك: {overallPercentage}%
            </span>
            <div className={styles.progressBarMini}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>

          {/* Next / Prev Quick Nav */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              className={styles.btnTopAction}
              disabled={!hasPrevLesson}
              onClick={goToPrevLesson}
              title="الدرس السابق"
            >
              <ChevronRight size={14} />
            </button>
            <button
              type="button"
              className={styles.btnTopAction}
              disabled={!hasNextLesson}
              onClick={goToNextLesson}
              title="الدرس التالي"
            >
              <ChevronLeft size={14} />
            </button>
          </div>

          {/* Theater Mode Toggle */}
          <button
            type="button"
            className={styles.btnTopAction}
            onClick={() => setTheaterMode(!theaterMode)}
            title={theaterMode ? 'إظهار قائمة الفصول' : 'وضع المسرح السينمائي'}
          >
            <Layers size={14} />
            <span>{theaterMode ? 'القائمة' : 'المسرح'}</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Player Stage on Left (RTL), Chapters Sidebar on Right */}
      <div
        className={`${styles.mainGrid} ${theaterMode ? styles.mainGridTheater : ''}`}
      >
        {/* Central Stage */}
        <main className={styles.classroomStage}>
          {loadingContent ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '50vh',
                gap: 10,
                color: '#94a3b8',
              }}
            >
              <Loader2 size={30} className={styles.spin} />
              <span>جاري تحميل محتوى الدرس...</span>
            </div>
          ) : !isLessonAccessible ? (
            /* Locked Content Screen */
            <div
              className={styles.playerContainer}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Lock size={32} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                هذا المحتوى يتطلب اشتراكاً مفعلاً في المادة
              </h2>
              <p
                style={{
                  color: '#94a3b8',
                  fontSize: 14,
                  maxWidth: 480,
                  margin: '0 auto 24px',
                  lineHeight: 1.6,
                }}
              >
                لمشاهدة كافة المحاضرات وحل الاختبارات وتحميل مذكرات الـ PDF، يرجى تفعيل
                الاشتراك في المقرر أو تفعيل كود السنتر.
              </p>
              <Link
                href={`/universities/${uniSlug}/${colSlug}/${subject.slug}`}
                className={styles.btnPrimary}
                style={{ textDecoration: 'none' }}
              >
                <Unlock size={16} /> تفعيل الاشتراك بمقرر {subject.nameAr}
              </Link>
            </div>
          ) : activeLesson?.type === 'QUIZ' ? (
            /* Quiz Active View */
            <QuizView
              quiz={contentDetail?.quiz || activeLesson.quiz}
              quizTitle={activeLesson.titleAr}
              onQuizComplete={() => {
                setCompletedLessons((prev) => ({ ...prev, [activeLesson.id]: true }));
              }}
              onNextLesson={hasNextLesson ? goToNextLesson : undefined}
            />
          ) : activeLesson?.type === 'VIDEO' ? (
            /* Video Player Box */
            <div
              className={styles.playerContainer}
              id="classroom-player-box"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            >
              {/* Anti-Screen Recording Blur Curtain (when window loses focus) */}
              {isWindowBlurred && (
                <div className={styles.blurCurtain}>
                  <ShieldAlert size={40} className={styles.blurCurtainIcon} />
                  <span>المحتوى محمي بحقوق النشر — انقر للعودة لمتابعة المحاضرة</span>
                </div>
              )}

              {/* Anti-Piracy Floating Watermark */}
              <div
                className={styles.antiPiracyWatermark}
                style={{ top: watermarkPos.top, left: watermarkPos.left }}
              >
                🛡️ {user?.email || user?.firstName || 'طالب صرح أكاديمي'} •{' '}
                {new Date().toLocaleTimeString('ar-EG')}
              </div>

              {/* Video Element or YouTube Embed */}
              {ytEmbed ? (
                <iframe
                  src={ytEmbed}
                  title={activeLesson.titleAr}
                  className={styles.videoIframe}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : playbackUrl ? (
                <>
                  <video
                    ref={videoRef}
                    src={playbackUrl}
                    className={styles.videoElement}
                    controlsList="nodownload"
                    disablePictureInPicture
                    playsInline
                    onClick={togglePlay}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                  />

                  {/* Custom Modern Video Controls Bar */}
                  <div className={styles.controlsBar}>
                    {/* Seek bar */}
                    <div className={styles.seekBarWrap} onClick={handleSeek}>
                      <div
                        className={styles.seekBarFill}
                        style={{
                          width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                        }}
                      />
                    </div>

                    <div className={styles.controlsRow}>
                      <div className={styles.controlsLeft}>
                        {/* Play / Pause */}
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={togglePlay}
                          title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                        >
                          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>

                        {/* Rewind 10s */}
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => skipSeconds(-10)}
                          title="رجوع 10 ثوانٍ"
                        >
                          <RotateCcw size={18} />
                        </button>

                        {/* Forward 10s */}
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => skipSeconds(10)}
                          title="تقديم 10 ثوانٍ"
                        >
                          <RotateCw size={18} />
                        </button>

                        {/* Mute */}
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={toggleMute}
                          title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                        >
                          {isMuted ? <VolumeX size={19} /> : <Volume2 size={19} />}
                        </button>

                        {/* Time Display */}
                        <span className={styles.timeDisplay}>
                          {formatSeconds(currentTime)} / {formatSeconds(duration)}
                        </span>
                      </div>

                      <div className={styles.controlsRight}>
                        {/* Playback Speed Selector */}
                        <div className={styles.speedMenuWrap}>
                          <button
                            type="button"
                            className={styles.speedBtn}
                            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                            title="سرعة التشغيل"
                          >
                            {playbackSpeed}x
                          </button>

                          {showSpeedMenu && (
                            <div className={styles.speedDropdown}>
                              {SPEED_OPTIONS.map((spd) => (
                                <button
                                  key={spd}
                                  type="button"
                                  className={`${styles.speedOption} ${playbackSpeed === spd ? styles.speedOptionActive : ''}`}
                                  onClick={() => handleSpeedChange(spd)}
                                >
                                  {spd}x
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Fullscreen */}
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={toggleFullscreen}
                          title={isFullscreen ? 'تصغير الشاشة' : 'ملء الشاشة'}
                        >
                          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#94a3b8',
                    gap: 12,
                  }}
                >
                  <Video size={48} style={{ opacity: 0.4 }} />
                  <span>الفيديو قيد الإعداد والرفع من قبل المحاضر</span>
                </div>
              )}
            </div>
          ) : (
            /* File / Document Viewer */
            <div className={styles.attachmentCard} style={{ marginTop: 0, padding: 30 }}>
              <div className={styles.attachmentInfo}>
                <div className={styles.attachmentIcon}>
                  <FileText size={28} />
                </div>
                <div>
                  <h3 className={styles.attachmentName}>{activeLesson.titleAr}</h3>
                  <p className={styles.attachmentMeta}>
                    مذكرة ومستند تعليمي جاهز للدراسة والتحميل
                  </p>
                </div>
              </div>

              {contentDetail?.downloadUrl ? (
                <a
                  href={contentDetail.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnDownload}
                  download
                >
                  <Download size={16} /> تحميل الملف
                </a>
              ) : (
                <span style={{ fontSize: 13, color: '#94a3b8' }}>
                  الملف متاح للتحميل الداخلي
                </span>
              )}
            </div>
          )}

          {/* Lesson Metadata Card */}
          {activeLesson && (
            <div className={styles.lessonMetaCard}>
              <div className={styles.lessonMetaTop}>
                <div>
                  <h1 className={styles.lessonTitle}>{activeLesson.titleAr}</h1>
                  <div className={styles.lessonTags}>
                    <span className={styles.lessonBadge}>
                      {activeLesson.type === 'VIDEO' ? (
                        <>
                          <Video size={13} /> محاضرة فيديو
                        </>
                      ) : activeLesson.type === 'QUIZ' ? (
                        <>
                          <Award size={13} /> اختبار تفاعلي
                        </>
                      ) : (
                        <>
                          <FileText size={13} /> مذكرة PDF
                        </>
                      )}
                    </span>

                    {activeLesson.isFree ? (
                      <span className={`${styles.lessonBadge} ${styles.badgeFree}`}>
                        <Unlock size={12} /> متاح مجاناً
                      </span>
                    ) : (
                      <span className={`${styles.lessonBadge} ${styles.badgePaid}`}>
                        <Lock size={12} /> مشترك فقط
                      </span>
                    )}

                    {completedLessons[activeLesson.id] && (
                      <span className={`${styles.lessonBadge} ${styles.badgeCompleted}`}>
                        <CheckCircle2 size={12} /> تم إكمال هذا الدرس
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.lessonActions}>
                  <button
                    type="button"
                    className={`${styles.btnComplete} ${completedLessons[activeLesson.id] ? styles.btnCompletedActive : ''}`}
                    onClick={toggleCompleteActiveLesson}
                  >
                    <CheckCircle2 size={15} />
                    <span>
                      {completedLessons[activeLesson.id]
                        ? 'مكتمل بنجاح'
                        : 'تحديد كمكتمل'}
                    </span>
                  </button>

                  {hasNextLesson && (
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={goToNextLesson}
                    >
                      الدرس التالي <ChevronLeft size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className={styles.tabsContainer}>
                <div className={styles.tabsHeader}>
                  <button
                    type="button"
                    className={`${styles.tabItem} ${activeTab === 'overview' ? styles.tabItemActive : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    <BookOpen size={16} /> نبذة وملاحظات
                  </button>

                  <button
                    type="button"
                    className={`${styles.tabItem} ${activeTab === 'files' ? styles.tabItemActive : ''}`}
                    onClick={() => setActiveTab('files')}
                  >
                    <FileText size={16} /> الملحقات والمذكرات PDF
                  </button>
                </div>

                {activeTab === 'overview' && (
                  <div className={styles.tabPanel}>
                    <p className={styles.descriptionParagraph}>
                      {activeLesson.description ||
                        contentDetail?.description ||
                        'شرح مفصل ومكثف يغطي كافة الجوانب العلمية للمحاضرة بالتنسيق مع المنهج المعتمد للكلية.'}
                    </p>
                  </div>
                )}

                {activeTab === 'files' && (
                  <div className={styles.tabPanel}>
                    {contentDetail?.file ? (
                      <div className={styles.attachmentCard}>
                        <div className={styles.attachmentInfo}>
                          <div className={styles.attachmentIcon}>
                            <FileText size={24} />
                          </div>
                          <div>
                            <div className={styles.attachmentName}>
                              {contentDetail.file.originalName || 'ملف المذكرة المرفق'}
                            </div>
                            <div className={styles.attachmentMeta}>
                              تنسيق {contentDetail.file.fileType || 'PDF'}
                            </div>
                          </div>
                        </div>

                        {contentDetail.downloadUrl && (
                          <a
                            href={contentDetail.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.btnDownload}
                            download
                          >
                            <Download size={15} /> تحميل
                          </a>
                        )}
                      </div>
                    ) : (
                      <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
                        لا توجد ملفات مرفقة إضافية خاصة بهذا الدرس بعينه.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar: Curriculum & Chapters Accordion */}
        {!theaterMode && (
          <aside className={styles.sidebar} id="classroom-sidebar">
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarTitleRow}>
                <span className={styles.sidebarTitle}>محتويات ومنهج المادة</span>
                <span className={styles.lessonsCount}>
                  {completedCount} من {totalLessonsCount} درس مكتمل
                </span>
              </div>

              {/* Search lessons */}
              <div className={styles.searchWrap}>
                <Search size={14} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="ابحث عن درس أو اختبار..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  id="classroom-search-input"
                />
              </div>
            </div>

            {/* Chapters Accordion */}
            <div className={styles.chaptersList}>
              {filteredChapters.map((ch, chIdx) => {
                const isExpanded = !!expandedChapters[ch.id];
                const chLessons = ch.contents || [];
                const chCompleted = chLessons.filter(
                  (l) => completedLessons[l.id]
                ).length;

                return (
                  <div key={ch.id} className={styles.chapterGroup}>
                    <button
                      type="button"
                      className={styles.chapterBtn}
                      onClick={() =>
                        setExpandedChapters((prev) => ({
                          ...prev,
                          [ch.id]: !prev[ch.id],
                        }))
                      }
                    >
                      <div>
                        <div className={styles.chapterTitle}>
                          {ch.titleAr || `الفصل ${chIdx + 1}`}
                        </div>
                        <div className={styles.chapterMeta}>
                          {chCompleted}/{chLessons.length} مكتمل
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {isExpanded && (
                      <div className={styles.lessonsUl}>
                        {chLessons.map((l) => {
                          const isActive = l.id === activeLessonId;
                          const isDone = !!completedLessons[l.id];
                          const canAccess =
                            l.isFree || subject.isFree || hasAccess || isAdmin;

                          return (
                            <div
                              key={l.id}
                              className={`${styles.lessonItem} ${isActive ? styles.lessonItemActive : ''}`}
                              onClick={() => {
                                setActiveLessonId(l.id);
                                setIsPlaying(false);
                              }}
                              id={`lesson-item-${l.id}`}
                            >
                              <div className={styles.lessonItemLeft}>
                                <div className={styles.lessonItemIcon}>
                                  {l.type === 'VIDEO' ? (
                                    <Video size={15} />
                                  ) : l.type === 'QUIZ' ? (
                                    <Award size={15} />
                                  ) : (
                                    <FileText size={15} />
                                  )}
                                </div>
                                <span className={styles.lessonItemText}>
                                  {l.titleAr}
                                </span>
                              </div>

                              <div className={styles.lessonItemRight}>
                                {isDone ? (
                                  <span className={styles.lessonCheckTag}>
                                    <CheckCircle2 size={14} />
                                  </span>
                                ) : !canAccess ? (
                                  <span className={styles.lessonLockTag}>
                                    <Lock size={13} />
                                  </span>
                                ) : l.video?.duration ? (
                                  <span className={styles.lessonDuration}>
                                    {Math.round(l.video.duration / 60)} د
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* Admin Content Upload & Lesson Creator Modal */}
      {isUploadOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setIsUploadOpen(false)}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 560,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#fff' }}>
                    رفع وإضافة درس أو محاضرة جديدة
                  </h3>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    إضافة محتوى مباشر لمقرر {subject.nameAr}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Target Chapter */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  الفصل المستهدف في المنهج
                </label>
                <select
                  value={uploadChapterId}
                  onChange={(e) => setUploadChapterId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }}
                >
                  {subject.chapters?.map((ch) => (
                    <option key={ch.id} value={ch.id} style={{ background: '#0f172a', color: '#fff' }}>
                      {ch.titleAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Type Radio Selector */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  نوع المحتوى وطريقة الإضافة
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setUploadMode('VIDEO_FILE')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 8,
                      border: uploadMode === 'VIDEO_FILE' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: uploadMode === 'VIDEO_FILE' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: uploadMode === 'VIDEO_FILE' ? '#fff' : '#94a3b8',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Video size={16} />
                    <span>رفع ملف فيديو</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadMode('VIDEO_URL')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 8,
                      border: uploadMode === 'VIDEO_URL' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: uploadMode === 'VIDEO_URL' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: uploadMode === 'VIDEO_URL' ? '#fff' : '#94a3b8',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Sparkles size={16} />
                    <span>رابط فيديو خارجي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadMode('FILE')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 8,
                      border: uploadMode === 'FILE' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: uploadMode === 'FILE' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: uploadMode === 'FILE' ? '#fff' : '#94a3b8',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <FileText size={16} />
                    <span>مذكرة / PDF</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  عنوان الدرس أو المحاضرة *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="مثال: المحاضرة 3 — تفاعلات الإضافة والاستبدال"
                  required
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }}
                />
              </div>

              {/* File Input OR Video URL */}
              {uploadMode === 'VIDEO_URL' ? (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                    رابط الفيديو (YouTube أو رابط مباشر MP4) *
                  </label>
                  <input
                    type="url"
                    value={uploadVideoUrl}
                    onChange={(e) => setUploadVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... أو https://..."
                    required
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                    اختر الملف من جهازك * ({uploadMode === 'VIDEO_FILE' ? 'فيديو MP4, WebM' : 'مستند PDF, Word'})
                  </label>
                  <input
                    type="file"
                    accept={uploadMode === 'VIDEO_FILE' ? 'video/*' : '.pdf,.doc,.docx,.ppt,.pptx'}
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    required
                    style={{ width: '100%', padding: '10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px dashed rgba(255, 255, 255, 0.2)', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer' }}
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  وصف وملخص الدرس (اختياري)
                </label>
                <textarea
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  rows={2}
                  placeholder="نبذة مختصرة وملاحظات للطلاب حول الدرس..."
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* Checkboxes: Free Preview & Published */}
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '6px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={uploadIsFree}
                    onChange={(e) => setUploadIsFree(e.target.checked)}
                  />
                  <span>معاينة مجانية (مفتوح للجميع)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={uploadIsPublished}
                    onChange={(e) => setUploadIsPublished(e.target.checked)}
                  />
                  <span>نشر فوري للطلاب</span>
                </label>
              </div>

              {/* Status Message */}
              {uploadStatusMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    background: uploadStatusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: uploadStatusMsg.type === 'success' ? '#10b981' : '#ef4444',
                    border: uploadStatusMsg.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  {uploadStatusMsg.text}
                </div>
              )}

              {/* Submit Button */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  style={{ padding: '9px 18px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, color: '#cbd5e1', fontSize: 13, cursor: 'pointer' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUpload}
                  style={{
                    padding: '9px 22px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isSubmittingUpload ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {isSubmittingUpload ? (
                    <>
                      <Loader2 size={16} className={styles.spin} /> جاري الرفع والحفظ...
                    </>
                  ) : (
                    <>
                      <Upload size={16} /> تأكيد الرفع والإضافة
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

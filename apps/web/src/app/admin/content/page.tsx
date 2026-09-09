'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Video,
  FileText,
  Award,
  Upload,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Play,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderPlus,
  ExternalLink,
  BookOpen,
  X,
  Clock,
  HelpCircle,
  Check,
  Film,
  Maximize2,
  Volume2,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import styles from './page.module.css';

interface QuizAnswerItem {
  id?: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestionItem {
  id?: string;
  text: string;
  explanation?: string | null;
  points?: number;
  answers: QuizAnswerItem[];
}

interface ContentItemDetail {
  id: string;
  titleAr: string;
  titleEn?: string | null;
  description?: string | null;
  type: 'VIDEO' | 'FILE' | 'QUIZ';
  isFree: boolean;
  isPublished: boolean;
  displayOrder: number;
  video?: { duration?: number; viewCount?: number; storageKey?: string } | null;
  file?: { fileType?: string; originalName?: string; downloadCount?: number; storageKey?: string } | null;
  quiz?: {
    passingScore?: number;
    timeLimitMinutes?: number;
    questions?: QuizQuestionItem[];
  } | null;
}

interface ChapterDetail {
  id: string;
  titleAr: string;
  titleEn?: string | null;
  displayOrder: number;
  contents: ContentItemDetail[];
}

interface FullSubject {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  isFree: boolean;
  price?: number | null;
  chapters: ChapterDetail[];
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

function AdminContentStudio() {
  const searchParams = useSearchParams();
  const initialSubjectId = searchParams.get('subjectId');

  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || '');
  const [subjectSearch, setSubjectSearch] = useState('');

  // Selected full subject details with chapters & contents
  const [currentSubject, setCurrentSubject] = useState<FullSubject | null>(null);
  const [loadingSubjectData, setLoadingSubjectData] = useState(false);

  // Content type filter for curriculum view
  const [curriculumFilter, setCurriculumFilter] = useState<'ALL' | 'VIDEO' | 'FILE' | 'QUIZ'>('ALL');

  // Upload / Add Content State
  const [targetChapterId, setTargetChapterId] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'VIDEO_FILE' | 'VIDEO_URL' | 'FILE' | 'QUIZ'>('VIDEO_FILE');
  const [titleAr, setTitleAr] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [durationMins, setDurationMins] = useState(25);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFree, setIsFree] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  // Quiz creation specific state
  const [quizQuestionText, setQuizQuestionText] = useState('');
  const [quizExplanation, setQuizExplanation] = useState('');
  const [quizOptions, setQuizOptions] = useState<string[]>([
    'الخيار الأول (مثال: صحيح)',
    'الخيار الثاني',
    'الخيار الثالث',
    'الخيار الرابع',
  ]);
  const [quizCorrectIndex, setQuizCorrectIndex] = useState<number>(0);

  const [uploading, setUploading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Chapter inline prompt
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [creatingChapter, setCreatingChapter] = useState(false);

  // Preview modals
  const [previewVideoItem, setPreviewVideoItem] = useState<ContentItemDetail | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [videoSpeed, setVideoSpeed] = useState<number>(1);
  const [previewQuizItem, setPreviewQuizItem] = useState<ContentItemDetail | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  // 1. Fetch all subjects for the dropdown selector
  useEffect(() => {
    async function loadAllSubjects() {
      try {
        const res = await api.get('/subjects?limit=300');
        const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setSubjects(list);
        if (!selectedSubjectId && list.length > 0) {
          setSelectedSubjectId(list[0].id);
        }
      } catch {
        // Fallback
      } finally {
        setLoadingSubjects(false);
      }
    }
    loadAllSubjects();
  }, []);

  // Filtered subjects based on search
  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return subjects;
    const term = subjectSearch.toLowerCase().trim();
    return subjects.filter((s) => {
      const nameAr = (s.nameAr || '').toLowerCase();
      const nameEn = (s.nameEn || '').toLowerCase();
      const col = (s.semester?.academicYear?.college?.nameAr || '').toLowerCase();
      const uni = (s.semester?.academicYear?.college?.university?.nameAr || '').toLowerCase();
      return nameAr.includes(term) || nameEn.includes(term) || col.includes(term) || uni.includes(term);
    });
  }, [subjects, subjectSearch]);

  // 2. Fetch full subject details when selection changes
  const reloadSubject = async (subjectId: string) => {
    if (!subjectId) return;
    setLoadingSubjectData(true);
    try {
      const res = await api.get(`/subjects/${subjectId}`);
      const data = res.data?.data ?? res.data;
      setCurrentSubject(data);
      if (data.chapters && data.chapters.length > 0) {
        setTargetChapterId((prev) => {
          const exists = data.chapters.some((c: any) => c.id === prev);
          return exists ? prev : data.chapters[0].id;
        });
      } else {
        setTargetChapterId('');
      }
    } catch {
      setCurrentSubject(null);
    } finally {
      setLoadingSubjectData(false);
    }
  };

  useEffect(() => {
    if (selectedSubjectId) {
      reloadSubject(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  // Handle Upload / Add Content
  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAr.trim()) {
      setActionMessage({ type: 'error', text: 'يرجى كتابة عنوان الدرس أو المحاضرة' });
      return;
    }
    if (!targetChapterId) {
      setActionMessage({ type: 'error', text: 'يرجى اختيار أو إنشاء فصل أولاً' });
      return;
    }

    setUploading(true);
    setActionMessage(null);

    try {
      if (uploadMode === 'VIDEO_URL') {
        if (!videoUrl.trim()) {
          setActionMessage({ type: 'error', text: 'يرجى إدخال رابط الفيديو (YouTube أو رابط مباشر)' });
          setUploading(false);
          return;
        }

        await api.post('/content/create', {
          chapterId: targetChapterId,
          type: 'VIDEO',
          titleAr: titleAr.trim(),
          description: description.trim() || undefined,
          videoUrl: videoUrl.trim(),
          duration: (durationMins || 20) * 60,
          isFree,
          isPublished,
        });
      } else if (uploadMode === 'QUIZ') {
        if (!quizQuestionText.trim()) {
          setActionMessage({ type: 'error', text: 'يرجى كتابة نص السؤال' });
          setUploading(false);
          return;
        }

        await api.post('/content/create', {
          chapterId: targetChapterId,
          type: 'QUIZ',
          titleAr: titleAr.trim(),
          description: description.trim() || undefined,
          isFree,
          isPublished,
          passingScore: 60,
          timeLimitMinutes: 15,
          questions: [
            {
              text: quizQuestionText.trim(),
              explanation: quizExplanation.trim() || undefined,
              points: 1,
              answers: quizOptions.map((opt, idx) => ({
                text: opt.trim() || `الخيار ${idx + 1}`,
                isCorrect: idx === quizCorrectIndex,
              })),
            },
          ],
        });
      } else {
        // File or Video Upload via multipart
        if (!selectedFile) {
          setActionMessage({ type: 'error', text: 'يرجى اختيار ملف من جهازك' });
          setUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('chapterId', targetChapterId);
        formData.append('titleAr', titleAr.trim());
        if (description.trim()) formData.append('description', description.trim());
        formData.append('isFree', isFree ? 'true' : 'false');
        formData.append('isPublished', isPublished ? 'true' : 'false');

        const endpoint = uploadMode === 'VIDEO_FILE' ? '/content/upload/video' : '/content/upload/file';
        await api.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setActionMessage({ type: 'success', text: '🎉 تم رفع وحفظ المحتوى بنجاح في المقرر!' });
      setTitleAr('');
      setDescription('');
      setVideoUrl('');
      setSelectedFile(null);
      setQuizQuestionText('');
      setQuizExplanation('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload subject data
      if (selectedSubjectId) {
        await reloadSubject(selectedSubjectId);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء رفع المحتوى';
      setActionMessage({ type: 'error', text: Array.isArray(msg) ? msg[0] : msg });
    } finally {
      setUploading(false);
    }
  };

  // Create new chapter on the fly
  const handleCreateChapter = async () => {
    if (!newChapterTitle.trim() || !selectedSubjectId) return;
    setCreatingChapter(true);
    try {
      await api.post('/chapters', {
        subjectId: selectedSubjectId,
        titleAr: newChapterTitle.trim(),
        displayOrder: (currentSubject?.chapters?.length || 0) + 1,
      });
      setNewChapterTitle('');
      await reloadSubject(selectedSubjectId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'تعذر إنشاء الفصل');
    } finally {
      setCreatingChapter(false);
    }
  };

  // Quick Toggle Status (Publish / Draft)
  const togglePublish = async (contentId: string, currentVal: boolean) => {
    try {
      await api.patch(`/content/${contentId}`, { isPublished: !currentVal });
      if (selectedSubjectId) reloadSubject(selectedSubjectId);
      if (previewVideoItem && previewVideoItem.id === contentId) {
        setPreviewVideoItem({ ...previewVideoItem, isPublished: !currentVal });
      }
    } catch {
      alert('تعذر تحديث حالة النشر');
    }
  };

  // Quick Toggle Free / Paid
  const toggleFree = async (contentId: string, currentVal: boolean) => {
    try {
      await api.patch(`/content/${contentId}`, { isFree: !currentVal });
      if (selectedSubjectId) reloadSubject(selectedSubjectId);
      if (previewVideoItem && previewVideoItem.id === contentId) {
        setPreviewVideoItem({ ...previewVideoItem, isFree: !currentVal });
      }
    } catch {
      alert('تعذر تحديث حالة الإتاحة المجانية');
    }
  };

  // Delete Content
  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس نهائياً؟')) return;
    try {
      await api.delete(`/content/${contentId}`);
      if (selectedSubjectId) reloadSubject(selectedSubjectId);
      if (previewVideoItem?.id === contentId) setPreviewVideoItem(null);
    } catch {
      alert('تعذر حذف الدرس');
    }
  };

  // Open Direct In-Dashboard Video Preview Modal
  const handleOpenVideoPreview = async (lesson: ContentItemDetail) => {
    setPreviewVideoItem(lesson);
    setPreviewVideoUrl(null);
    try {
      const res = await api.get(`/content/${lesson.id}`);
      const data = res.data?.data ?? res.data;
      const url = data.playbackUrl || data.video?.storageKey || 'https://www.w3schools.com/html/mov_bbb.mp4';
      setPreviewVideoUrl(url);
    } catch {
      // Fallback
      setPreviewVideoUrl(lesson.video?.storageKey || 'https://www.w3schools.com/html/mov_bbb.mp4');
    }
  };

  // Open Direct Quiz Preview Modal
  const handleOpenQuizPreview = async (lesson: ContentItemDetail) => {
    setPreviewQuizItem(lesson);
    try {
      const res = await api.get(`/content/${lesson.id}`);
      const data = res.data?.data ?? res.data;
      if (data.quiz) {
        setPreviewQuizItem({ ...lesson, quiz: data.quiz });
      }
    } catch {
      // Keep existing
    }
  };

  // Summary counts
  const allContents = useMemo(() => {
    return currentSubject?.chapters?.flatMap((c) => c.contents || []) || [];
  }, [currentSubject]);

  const videoCount = allContents.filter((c) => c.type === 'VIDEO').length;
  const fileCount = allContents.filter((c) => c.type === 'FILE').length;
  const quizCount = allContents.filter((c) => c.type === 'QUIZ').length;

  const uniSlug = currentSubject?.semester?.academicYear?.college?.university?.slug || 'assiut';
  const colSlug = currentSubject?.semester?.academicYear?.college?.slug || 'pharmacy';

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>استوديو رفع وإدارة الفيديوهات والمحتوى التعليمي 🎬</h1>
          <p className={styles.subtitle}>
            مركز تحكم موحد للأدمن لرفع المحاضرات، إضافة المذكرات، وضبط النشر والإتاحة المجانية لكل مقرر بسهولة
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Link
            href="/admin"
            className={styles.btnAction}
            style={{ padding: '8px 14px', fontSize: 13 }}
          >
            العودة للوحة الإدارة
          </Link>

          {currentSubject && (
            <Link
              href={`/universities/${uniSlug}/${colSlug}/${currentSubject.slug}/watch`}
              target="_blank"
              className={styles.btnAction}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                border: 'none',
                padding: '9px 16px',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Play size={16} /> فتح مشغل الطلاب (Classroom) <ExternalLink size={14} />
            </Link>
          )}
        </div>
      </div>

      {/* Subject Selector & Live Search */}
      <div className={styles.selectorCard}>
        <div className={styles.selectorRow}>
          {/* Quick Search */}
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={16} style={{ position: 'absolute', right: 12, top: 12, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="ابحث عن مقرر أو كلية..."
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
              className={styles.input}
              style={{ paddingRight: 36, width: '100%' }}
            />
          </div>

          <label style={{ fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
            المقرر المستهدف:
          </label>

          {loadingSubjects ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
              <Loader2 size={18} className="animate-spin" /> جاري تحميل قائمة المواد...
            </div>
          ) : (
            <select
              className={styles.selectorSelect}
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              id="admin-subject-select"
            >
              {filteredSubjects.length === 0 ? (
                <option value="">لا توجد نتائج مطابقة لبحثك</option>
              ) : (
                filteredSubjects.map((sub) => {
                  const col = sub.semester?.academicYear?.college?.nameAr || 'الكلية';
                  const uni = sub.semester?.academicYear?.college?.university?.nameAr || 'الجامعة';
                  return (
                    <option key={sub.id} value={sub.id}>
                      {sub.nameAr} — ({col} / {uni})
                    </option>
                  );
                })
              )}
            </select>
          )}
        </div>
      </div>

      {/* Stats of Selected Subject */}
      {currentSubject && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIconWrap} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <Layers size={22} />
            </div>
            <div>
              <div className={styles.statVal}>{currentSubject.chapters?.length || 0}</div>
              <div className={styles.statLabel}>إجمالي الفصول</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrap} style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Video size={22} />
            </div>
            <div>
              <div className={styles.statVal}>{videoCount}</div>
              <div className={styles.statLabel}>محاضرات فيديو</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrap} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <FileText size={22} />
            </div>
            <div>
              <div className={styles.statVal}>{fileCount}</div>
              <div className={styles.statLabel}>مذكرات وملفات PDF</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrap} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <Award size={22} />
            </div>
            <div>
              <div className={styles.statVal}>{quizCount}</div>
              <div className={styles.statLabel}>اختبارات تفاعلية (Quizzes)</div>
            </div>
          </div>
        </div>
      )}

      {/* Direct Upload & Add Content Form */}
      <div className={styles.uploadCard} id="upload">
        <div className={styles.uploadCardHeader}>
          <h2 className={styles.uploadTitle}>
            <Upload size={20} style={{ color: '#6366f1' }} />
            رفع وإضافة درس / محتوى جديد
          </h2>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>
            المقرر النشط: <strong style={{ color: '#fff' }}>{currentSubject?.nameAr || 'اختر مقرراً أعلاه'}</strong>
          </span>
        </div>

        {/* Create Chapter Quick Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 10,
            border: '1px dashed rgba(255, 255, 255, 0.12)',
          }}
        >
          <FolderPlus size={18} style={{ color: '#818cf8', flexShrink: 0 }} />
          <input
            type="text"
            className={styles.input}
            placeholder="اسم فصل جديد إذا أردت إضافته (مثال: الفصل الرابع: المراجعة والتدريبات)..."
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className={styles.btnAction}
            onClick={handleCreateChapter}
            disabled={creatingChapter || !newChapterTitle.trim()}
            style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '9px 16px', fontWeight: 600 }}
          >
            {creatingChapter ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            <span>إضافة الفصل الآن</span>
          </button>
        </div>

        {/* Content Type Selector */}
        <div className={styles.typeTabs}>
          <button
            type="button"
            className={`${styles.typeTab} ${uploadMode === 'VIDEO_FILE' ? styles.typeTabActive : ''}`}
            onClick={() => setUploadMode('VIDEO_FILE')}
          >
            <Video size={16} /> رفع ملف فيديو (MP4, WebM)
          </button>

          <button
            type="button"
            className={`${styles.typeTab} ${uploadMode === 'VIDEO_URL' ? styles.typeTabActive : ''}`}
            onClick={() => setUploadMode('VIDEO_URL')}
          >
            <Sparkles size={16} /> رابط فيديو خارجي (YouTube / CDN)
          </button>

          <button
            type="button"
            className={`${styles.typeTab} ${uploadMode === 'FILE' ? styles.typeTabActive : ''}`}
            onClick={() => setUploadMode('FILE')}
          >
            <FileText size={16} /> مذكرة / ملخص PDF
          </button>

          <button
            type="button"
            className={`${styles.typeTab} ${uploadMode === 'QUIZ' ? styles.typeTabActive : ''}`}
            onClick={() => setUploadMode('QUIZ')}
          >
            <Award size={16} /> كويز واختبار تفاعلي
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleCreateContent} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>الفصل المستهدف *</label>
              {currentSubject?.chapters && currentSubject.chapters.length > 0 ? (
                <select
                  className={styles.select}
                  value={targetChapterId}
                  onChange={(e) => setTargetChapterId(e.target.value)}
                  required
                >
                  {currentSubject.chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.titleAr}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ color: '#f59e0b', fontSize: 13, padding: '10px 0' }}>
                  ⚠️ لا توجد فصول بعد. يرجى كتابة اسم فصل والضغط على &quot;إضافة الفصل الآن&quot; أعلاه أولاً.
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                {uploadMode === 'QUIZ' ? 'عنوان الاختبار التفاعلي *' : 'عنوان الدرس أو المحاضرة *'}
              </label>
              <input
                type="text"
                className={styles.input}
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder={
                  uploadMode === 'QUIZ'
                    ? 'مثال: اختبار تقييمي على الفصل الأول'
                    : 'مثال: المحاضرة 3 — التفاعلات الصيدلانية المتقدمة'
                }
                required
              />
            </div>
          </div>

          {/* Conditional Input based on Mode */}
          {uploadMode === 'VIDEO_URL' && (
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>رابط الفيديو (YouTube أو رابط مباشر MP4) *</label>
                <input
                  type="url"
                  className={styles.input}
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... أو https://example.com/video.mp4"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>المدة التقديرية بالدقائق</label>
                <input
                  type="number"
                  className={styles.input}
                  value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                  min={1}
                />
              </div>
            </div>
          )}

          {(uploadMode === 'VIDEO_FILE' || uploadMode === 'FILE') && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                اختر ملف {uploadMode === 'VIDEO_FILE' ? 'فيديو (MP4, WebM)' : 'مستند (PDF, Word)'} من جهازك *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                className={styles.input}
                accept={uploadMode === 'VIDEO_FILE' ? 'video/*' : '.pdf,.doc,.docx,.ppt,.pptx'}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                required
              />
            </div>
          )}

          {uploadMode === 'QUIZ' && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div className={styles.formGroup}>
                <label className={styles.label}>نص السؤال *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={quizQuestionText}
                  onChange={(e) => setQuizQuestionText(e.target.value)}
                  placeholder="مثال: ما هو الإنزيم الرئيسي المسؤول عن أيض مركبات الستيرويد في الكبد؟"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>الخيارات (اختر الإجابة الصحيحة بالضغط على الدائرة):</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {quizOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '6px 12px',
                        background: idx === quizCorrectIndex ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        border: idx === quizCorrectIndex ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 8,
                      }}
                    >
                      <input
                        type="radio"
                        name="quizCorrectOption"
                        checked={idx === quizCorrectIndex}
                        onChange={() => setQuizCorrectIndex(idx)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 12, fontWeight: 700, color: idx === quizCorrectIndex ? '#10b981' : '#94a3b8' }}>
                        خيار {idx + 1} {idx === quizCorrectIndex ? '(الصحيح ✅)' : ''}
                      </span>
                      <input
                        type="text"
                        className={styles.input}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...quizOptions];
                          updated[idx] = e.target.value;
                          setQuizOptions(updated);
                        }}
                        style={{ flex: 1, padding: '6px 10px', fontSize: 13 }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>التفسير العلمي للإجابة الصحيحة (يظهر للطالب بعد الحل):</label>
                <input
                  type="text"
                  className={styles.input}
                  value={quizExplanation}
                  onChange={(e) => setQuizExplanation(e.target.value)}
                  placeholder="مثال: إنزيم CYP3A4 هو المسؤول الأساسي بنسبة تفوق 50%..."
                />
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>وصف وملخص إضافي (اختياري)</label>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="اكتب ملاحظات أو إرشادات للطلاب حول هذا الدرس..."
            />
          </div>

          {/* Visibility and Free Options */}
          <div className={styles.checkboxRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
              />
              <span>متاح مجاناً للجميع (معاينة مفتوحة بدون اشتراك)</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              <span>منشور للطلاب فوراً (إذا أردت حفظه كمسودة غير ظاهرة ألغِ التحديد)</span>
            </label>
          </div>

          {/* Status Alert */}
          {actionMessage && (
            <div className={actionMessage.type === 'success' ? styles.alertSuccess : styles.alertError}>
              {actionMessage.text}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.btnSubmit}
            disabled={uploading || !currentSubject?.chapters?.length}
            id="admin-submit-content-btn"
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> جاري حفظ المحتوى في المنهج...
              </>
            ) : (
              <>
                <Upload size={18} /> حفظ وإضافة المحتوى الآن
              </>
            )}
          </button>
        </form>
      </div>

      {/* Curriculum Manager: Chapters & Lessons List */}
      <div className={styles.curriculumCard}>
        <div className={styles.curriculumHeader}>
          <div>
            <h2 className={styles.uploadTitle}>
              <BookOpen size={20} style={{ color: '#10b981' }} />
              فصول ومحتويات المقرر المعتمدة ({currentSubject?.chapters?.length || 0} فصول)
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              تحكم بضغطة واحدة في النشر، الإتاحة المجانية، أو تشغيل ومعاينة أي فيديو واختبار مباشرة
            </p>
          </div>

          {/* Type Filter Pills */}
          <div className={styles.filterTabs}>
            <button
              type="button"
              className={`${styles.filterTab} ${curriculumFilter === 'ALL' ? styles.filterTabActive : ''}`}
              onClick={() => setCurriculumFilter('ALL')}
            >
              الكل ({allContents.length})
            </button>
            <button
              type="button"
              className={`${styles.filterTab} ${curriculumFilter === 'VIDEO' ? styles.filterTabActive : ''}`}
              onClick={() => setCurriculumFilter('VIDEO')}
            >
              <Video size={13} style={{ display: 'inline', marginLeft: 4 }} /> فيديوهات ({videoCount})
            </button>
            <button
              type="button"
              className={`${styles.filterTab} ${curriculumFilter === 'FILE' ? styles.filterTabActive : ''}`}
              onClick={() => setCurriculumFilter('FILE')}
            >
              <FileText size={13} style={{ display: 'inline', marginLeft: 4 }} /> مذكرات ({fileCount})
            </button>
            <button
              type="button"
              className={`${styles.filterTab} ${curriculumFilter === 'QUIZ' ? styles.filterTabActive : ''}`}
              onClick={() => setCurriculumFilter('QUIZ')}
            >
              <Award size={13} style={{ display: 'inline', marginLeft: 4 }} /> اختبارات ({quizCount})
            </button>
          </div>
        </div>

        {loadingSubjectData ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 10px' }} />
            <span>جاري استرجاع فصول ومحتويات المادة...</span>
          </div>
        ) : !currentSubject?.chapters || currentSubject.chapters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            لا توجد فصول مضافة بعد في هذا المقرر. يمكنك إضافة الفصل الأول عبر شريط الإضافة أعلاه.
          </div>
        ) : (
          <div>
            {currentSubject.chapters.map((ch, idx) => {
              const allLessons = ch.contents || [];
              const lessons = allLessons.filter((l) => {
                if (curriculumFilter === 'ALL') return true;
                return l.type === curriculumFilter;
              });

              return (
                <div key={ch.id} className={styles.chapterItem}>
                  <div className={styles.chapterTop}>
                    <div className={styles.chapterTitleWrap}>
                      <span className={styles.chapterIndex}>الفصل {idx + 1}</span>
                      <span className={styles.chapterTitle}>{ch.titleAr}</span>
                      <span className={styles.chapterMeta}>({allLessons.length} دروس ومحتويات)</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        className={styles.btnAction}
                        onClick={() => {
                          setTargetChapterId(ch.id);
                          const el = document.getElementById('upload');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        title="إضافة محتوى لهذا الفصل"
                      >
                        <Plus size={14} /> إضافة محتوى هنا
                      </button>
                    </div>
                  </div>

                  <div className={styles.lessonsList}>
                    {lessons.length === 0 ? (
                      <div style={{ padding: '16px 20px', color: '#64748b', fontSize: 13 }}>
                        لا توجد عناصر مطابقة في هذا الفصل.
                      </div>
                    ) : (
                      lessons.map((lesson) => (
                        <div key={lesson.id} className={styles.lessonRow}>
                          <div className={styles.lessonLeft}>
                            <div className={styles.lessonIcon}>
                              {lesson.type === 'VIDEO' ? (
                                <Video size={16} />
                              ) : lesson.type === 'QUIZ' ? (
                                <Award size={16} />
                              ) : (
                                <FileText size={16} />
                              )}
                            </div>
                            <div>
                              <div className={styles.lessonName}>{lesson.titleAr}</div>
                              <div className={styles.lessonMetaDetails}>
                                <span>{lesson.type === 'VIDEO' ? 'محاضرة فيديو' : lesson.type === 'QUIZ' ? 'اختبار تفاعلي' : 'مذكرة PDF'}</span>
                                {lesson.video?.duration && (
                                  <span>• {Math.round(lesson.video.duration / 60)} دقيقة</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className={styles.lessonRight}>
                            {/* 1-Click Toggle: Published vs Draft */}
                            <button
                              type="button"
                              className={`${styles.btnToggleStatus} ${lesson.isPublished ? styles.statusPublished : styles.statusDraft}`}
                              onClick={() => togglePublish(lesson.id, lesson.isPublished)}
                              title="اضغط للتبديل الفوري بين منشور ومسودة"
                            >
                              {lesson.isPublished ? (
                                <>
                                  <Eye size={12} /> منشور للطلاب
                                </>
                              ) : (
                                <>
                                  <EyeOff size={12} /> مسودة مخفية
                                </>
                              )}
                            </button>

                            {/* 1-Click Toggle: Free vs Paid */}
                            <button
                              type="button"
                              className={`${styles.btnToggleStatus} ${lesson.isFree ? styles.statusFree : styles.statusPaid}`}
                              onClick={() => toggleFree(lesson.id, lesson.isFree)}
                              title="اضغط للتبديل بين متاح مجاناً أو يتطلب اشتراك"
                            >
                              {lesson.isFree ? (
                                <>
                                  <Unlock size={12} /> مجاني للجميع
                                </>
                              ) : (
                                <>
                                  <Lock size={12} /> يتطلب اشتراك
                                </>
                              )}
                            </button>

                            {/* Instant Admin In-Dashboard Preview */}
                            {lesson.type === 'VIDEO' && (
                              <button
                                type="button"
                                className={styles.btnAction}
                                onClick={() => handleOpenVideoPreview(lesson)}
                                style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderColor: '#6366f1' }}
                                title="تشغيل ومعاينة فورية للفيديو هنا"
                              >
                                <Play size={13} /> تشغيل فوري
                              </button>
                            )}

                            {lesson.type === 'QUIZ' && (
                              <button
                                type="button"
                                className={styles.btnAction}
                                onClick={() => handleOpenQuizPreview(lesson)}
                                style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderColor: '#f59e0b' }}
                                title="استعراض أسئلة وإجابات الكويز"
                              >
                                <HelpCircle size={13} /> استعراض الأسئلة
                              </button>
                            )}

                            {/* Open in Classroom Watch Player */}
                            <Link
                              href={`/universities/${uniSlug}/${colSlug}/${currentSubject.slug}/watch?lesson=${lesson.id}`}
                              target="_blank"
                              className={styles.btnAction}
                              title="معاينة في مشغل الطالب الكامل"
                            >
                              <ExternalLink size={12} /> واجهة الطالب
                            </Link>

                            {/* Delete button */}
                            <button
                              type="button"
                              className={`${styles.btnAction} ${styles.btnDelete}`}
                              onClick={() => handleDeleteContent(lesson.id)}
                              title="حذف هذا الدرس نهائياً"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: In-Dashboard Video Preview Player
      ───────────────────────────────────────────────────────────── */}
      {previewVideoItem && (
        <div className={styles.modalOverlay} onClick={() => setPreviewVideoItem(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <Film size={20} style={{ color: '#818cf8' }} />
                <span>معاينة فورية للفيديو: {previewVideoItem.titleAr}</span>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setPreviewVideoItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Video Player */}
              <div className={styles.videoWrapper}>
                {previewVideoUrl ? (
                  previewVideoUrl.includes('youtube.com') || previewVideoUrl.includes('youtu.be') ? (
                    <iframe
                      src={
                        previewVideoUrl.includes('watch?v=')
                          ? previewVideoUrl.replace('watch?v=', 'embed/')
                          : previewVideoUrl
                      }
                      title="YouTube Preview"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      ref={modalVideoRef}
                      src={previewVideoUrl}
                      controls
                      autoPlay
                      className={styles.videoPlayer}
                      onPlay={() => {
                        if (modalVideoRef.current) modalVideoRef.current.playbackRate = videoSpeed;
                      }}
                    />
                  )
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                )}
              </div>

              {/* Speed Controls for Admin Testing */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} style={{ color: '#818cf8' }} />
                  <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>اختبار سرعة التشغيل:</span>
                  {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => {
                        setVideoSpeed(spd);
                        if (modalVideoRef.current) modalVideoRef.current.playbackRate = spd;
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: videoSpeed === spd ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: videoSpeed === spd ? '#6366f1' : 'rgba(255, 255, 255, 0.04)',
                        color: '#fff',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Quick Toggle Inside Modal */}
                  <button
                    type="button"
                    className={`${styles.btnToggleStatus} ${previewVideoItem.isPublished ? styles.statusPublished : styles.statusDraft}`}
                    onClick={() => togglePublish(previewVideoItem.id, previewVideoItem.isPublished)}
                  >
                    {previewVideoItem.isPublished ? 'منشور للطلاب' : 'مسودة مخفية'}
                  </button>

                  <button
                    type="button"
                    className={`${styles.btnToggleStatus} ${previewVideoItem.isFree ? styles.statusFree : styles.statusPaid}`}
                    onClick={() => toggleFree(previewVideoItem.id, previewVideoItem.isFree)}
                  >
                    {previewVideoItem.isFree ? 'مجاني للجميع' : 'يتطلب اشتراك'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: In-Dashboard Quiz Previewer
      ───────────────────────────────────────────────────────────── */}
      {previewQuizItem && (
        <div className={styles.modalOverlay} onClick={() => setPreviewQuizItem(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <Award size={20} style={{ color: '#f59e0b' }} />
                <span>معاينة أسئلة الاختبار: {previewQuizItem.titleAr}</span>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setPreviewQuizItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {previewQuizItem.quiz?.questions && previewQuizItem.quiz.questions.length > 0 ? (
                previewQuizItem.quiz.questions.map((q, qIdx) => (
                  <div key={q.id || qIdx} className={styles.quizQuestionCard}>
                    <div className={styles.quizQuestionText}>
                      السؤال {qIdx + 1}: {q.text}
                    </div>

                    <div className={styles.quizAnswersList}>
                      {q.answers?.map((ans, aIdx) => (
                        <div
                          key={ans.id || aIdx}
                          className={`${styles.quizAnswerRow} ${ans.isCorrect ? styles.quizAnswerCorrect : ''}`}
                        >
                          <span>{ans.text}</span>
                          {ans.isCorrect && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                              <Check size={14} /> الإجابة الصحيحة
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div
                        style={{
                          background: 'rgba(99, 102, 241, 0.1)',
                          borderRight: '3px solid #6366f1',
                          padding: '10px 14px',
                          borderRadius: 6,
                          fontSize: 13,
                          color: '#cbd5e1',
                        }}
                      >
                        💡 <strong>التفسير العلمي:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  لا توجد تفاصيل أسئلة مضافة في هذا الاختبار بعد.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminContentStudioPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#fff' }}>جاري تحميل استوديو المحتوى...</div>}>
      <AdminContentStudio />
    </Suspense>
  );
}

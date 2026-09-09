'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Award,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import styles from './ClassroomPlayer.module.css';

export interface QuizQuestion {
  id: string;
  text: string;
  explanation?: string | null;
  points?: number;
  answers: Array<{
    id: string;
    text: string;
    explanation?: string | null;
  }>;
}

export interface QuizDetails {
  id: string;
  contentId: string;
  passingScore: number;
  timeLimitMinutes?: number | null;
  questions: QuizQuestion[];
}

interface QuizViewProps {
  quiz: QuizDetails;
  quizTitle: string;
  onQuizComplete?: (result: { score: number; passed: boolean; percentage: number }) => void;
  onNextLesson?: () => void;
}

export function QuizView({
  quiz,
  quizTitle,
  onQuizComplete,
  onNextLesson,
}: QuizViewProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<{
    attemptId: string;
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    passingScore: number;
    results: Array<{
      questionId: string;
      questionText: string;
      explanation?: string;
      points: number;
      earnedPoints: number;
      userAnswerId?: string;
      userAnswerText?: string;
      correctAnswerId?: string;
      correctAnswerText?: string;
      isCorrect: boolean;
      answers: Array<{ id: string; text: string; isCorrect: boolean; explanation?: string }>;
    }>;
  } | null>(null);

  // Timer countdown state
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : null,
  );

  const questions = quiz.questions || [];
  const currentQ = questions[currentIndex];

  const handleSelectAnswer = (questionId: string, answerId: string) => {
    if (result) return; // cannot change after submission
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || result) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const answersPayload = Object.entries(selectedAnswers).map(
        ([questionId, answerId]) => ({ questionId, answerId }),
      );

      const res = await api.post(`/content/quiz/${quiz.id}/attempt`, {
        answers: answersPayload,
      });

      const data = res.data?.data ?? res.data;
      setResult(data);
      if (onQuizComplete) {
        onQuizComplete({
          score: data.score,
          passed: data.passed,
          percentage: data.percentage,
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'تعذر إرسال الاختبار، يرجى المحاولة مرة أخرى.';
      setSubmitError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, result, selectedAnswers, quiz.id, onQuizComplete]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, result, handleSubmit]);

  const handleReset = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setSubmitError('');
    setTimeLeft(quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : null);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const isAllAnswered = questions.length > 0 && answeredCount === questions.length;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={styles.quizContainer}>
      {/* Quiz Header */}
      <div className={styles.quizHeader}>
        <div className={styles.quizHeaderInfo}>
          <div className={styles.quizBadge}>
            <Award size={14} />
            <span>اختبار تفاعلي معتمد</span>
          </div>
          <h2 className={styles.quizTitle}>{quizTitle}</h2>
          <p className={styles.quizMeta}>
            درجة النجاح المطلوبة: {quiz.passingScore}% • عدد الأسئلة: {questions.length} أسئلة
          </p>
        </div>

        {timeLeft !== null && !result && (
          <div
            className={`${styles.quizTimer} ${timeLeft < 120 ? styles.quizTimerUrgent : ''}`}
          >
            <Clock size={16} />
            <span>الوقت المتبقي: {formatTimer(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* When Quiz is Submitted: Result View */}
      {result ? (
        <div className={styles.quizResultBox}>
          <div
            className={`${styles.resultBanner} ${result.passed ? styles.resultPass : styles.resultFail}`}
          >
            <div className={styles.resultIconWrap}>
              {result.passed ? (
                <CheckCircle2 size={44} className={styles.passIcon} />
              ) : (
                <XCircle size={44} className={styles.failIcon} />
              )}
            </div>
            <div className={styles.resultBannerText}>
              <h3>
                {result.passed
                  ? '🎉 مبارك! لقد اجتزت الاختبار بنجاح'
                  : '⚠️ لم تجتز درجة النجاح المطلوبة هذه المرة'}
              </h3>
              <p>
                {result.passed
                  ? 'تم تسجيل نتيجتك وحفظ التقدم بنجاح ضمن سجلك الدراسي للمادة.'
                  : `درجة النجاح المطلوبة هي ${result.passingScore}%. يمكنك مراجعة الأسئلة بالأسفل وإعادة المحاولة.`}
              </p>
            </div>

            <div className={styles.scoreCircle}>
              <span className={styles.scorePercent}>{result.percentage}%</span>
              <span className={styles.scoreFraction}>
                {result.score} / {result.maxScore} درجة
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className={styles.resultActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleReset}
            >
              <RotateCcw size={16} /> إعادة المحاولة
            </button>
            {onNextLesson && (
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={onNextLesson}
              >
                الدرس التالي <ChevronLeft size={16} />
              </button>
            )}
          </div>

          {/* Review Questions Breakdown */}
          <div className={styles.reviewSection}>
            <h4 className={styles.reviewHeading}>
              <HelpCircle size={18} /> مراجعة وتصحيح الأسئلة مع التفسير العلمي:
            </h4>
            <div className={styles.reviewList}>
              {result.results.map((r, idx) => (
                <div
                  key={r.questionId}
                  className={`${styles.reviewCard} ${r.isCorrect ? styles.reviewCorrect : styles.reviewWrong}`}
                >
                  <div className={styles.reviewCardHeader}>
                    <span className={styles.reviewQNum}>السؤال {idx + 1}</span>
                    <span
                      className={`${styles.reviewStatusTag} ${r.isCorrect ? styles.tagSuccess : styles.tagError}`}
                    >
                      {r.isCorrect ? 'إجابة صحيحة (+ ' + r.points + ')' : 'إجابة خاطئة (0)'}
                    </span>
                  </div>
                  <div className={styles.reviewQText}>{r.questionText}</div>

                  {/* Answers review */}
                  <div className={styles.reviewOptionsList}>
                    {r.answers.map((ans) => {
                      const isUserChoice = ans.id === r.userAnswerId;
                      const isCorrect = ans.isCorrect;
                      let optionClass = styles.reviewOption;
                      if (isCorrect) optionClass += ` ${styles.reviewOptionCorrect}`;
                      if (isUserChoice && !isCorrect) optionClass += ` ${styles.reviewOptionIncorrect}`;

                      return (
                        <div key={ans.id} className={optionClass}>
                          <span className={styles.optionCheckIcon}>
                            {isCorrect ? '✅' : isUserChoice ? '❌' : '○'}
                          </span>
                          <span className={styles.optionText}>{ans.text}</span>
                          {isUserChoice && (
                            <span className={styles.userChoiceBadge}>اختيارك</span>
                          )}
                          {isCorrect && (
                            <span className={styles.correctChoiceBadge}>الإجابة الصحيحة</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Scientific Explanation */}
                  {r.explanation && (
                    <div className={styles.explanationBox}>
                      <span className={styles.explanationTitle}>💡 التفسير العلمي:</span>
                      <p className={styles.explanationText}>{r.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Quiz Active Form */
        <div className={styles.quizActiveBody}>
          {/* Progress bar */}
          <div className={styles.quizProgressBarWrap}>
            <div
              className={styles.quizProgressBar}
              style={{
                width: `${questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0}%`,
              }}
            />
          </div>

          <div className={styles.quizProgressMeta}>
            <span>
              السؤال {currentIndex + 1} من {questions.length}
            </span>
            <span>تمت الإجابة على: {answeredCount} من {questions.length}</span>
          </div>

          {currentQ && (
            <div className={styles.questionCard}>
              <div className={styles.questionTitle}>
                <span className={styles.qIndexBadge}>س{currentIndex + 1}</span>
                <span className={styles.qText}>{currentQ.text}</span>
              </div>

              {/* Options */}
              <div className={styles.optionsGrid}>
                {currentQ.answers.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[currentQ.id] === opt.id;
                  const letter = ['أ', 'ب', 'ج', 'د', 'هـ'][oIdx] || `${oIdx + 1}`;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`${styles.optionBtn} ${isSelected ? styles.optionSelected : ''}`}
                      onClick={() => handleSelectAnswer(currentQ.id, opt.id)}
                    >
                      <span className={styles.optionLetter}>{letter}</span>
                      <span className={styles.optionContent}>{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {submitError && (
            <div className={styles.errorMessage}>
              <AlertCircle size={16} />
              <span>{submitError}</span>
            </div>
          )}

          {/* Navigation and Submission Buttons */}
          <div className={styles.quizNavRow}>
            <button
              type="button"
              className={styles.btnNav}
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            >
              <ChevronRight size={16} /> السابق
            </button>

            <div className={styles.quizQuestionsDots}>
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`${styles.qDot} ${currentIndex === idx ? styles.qDotActive : ''} ${selectedAnswers[q.id] ? styles.qDotAnswered : ''}`}
                  title={`السؤال ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              >
                التالي <ChevronLeft size={16} />
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.btnPrimary} ${styles.btnSubmitQuiz}`}
                onClick={handleSubmit}
                disabled={isSubmitting || !isAllAnswered}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className={styles.spin} /> جاري التصحيح...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> تسليم الاختبار وعرض النتيجة
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

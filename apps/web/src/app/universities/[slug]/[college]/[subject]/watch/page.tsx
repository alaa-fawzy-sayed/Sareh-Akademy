'use client';

import { use, useState, useEffect } from 'react';
import { notFound, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { fetchSubjectBySlugOrId, type SubjectDetail } from '@/lib/api/services';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api/client';
import { ClassroomPlayer } from '@/components/features/classroom/ClassroomPlayer';

interface WatchPageProps {
  params: Promise<{
    slug: string;
    college: string;
    subject: string;
  }>;
}

export default function WatchPage(props: WatchPageProps) {
  const params = use(props.params);
  const searchParams = useSearchParams();
  const initialLesson = searchParams.get('lesson') || undefined;

  const { isAuthenticated, user } = useAuthStore();
  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

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

        // Check if student has access or is enrolled
        if (data.isFree) {
          setHasAccess(true);
        } else if (isAuthenticated) {
          try {
            const mySubRes = await api.get('/subjects/my').catch(() => null);
            if (mySubRes?.data) {
              const mySubs = mySubRes.data?.data ?? mySubRes.data ?? [];
              const enrolled =
                Array.isArray(mySubs) &&
                mySubs.some(
                  (item: any) =>
                    item.subjectId === data.id ||
                    item.subject?.id === data.id ||
                    item.id === data.id
                );
              if (enrolled) setHasAccess(true);
            }
          } catch {
            // Ignore access check error
          }
        }
      } catch {
        setNotFoundFlag(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.subject, isAuthenticated]);

  if (notFoundFlag) notFound();

  if (loading || !subject) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#090d16',
          color: '#94a3b8',
          gap: 12,
        }}
      >
        <Loader2 size={36} style={{ animation: 'spin 0.8s linear infinite', color: '#6366f1' }} />
        <span style={{ fontSize: 15, fontWeight: 500 }}>جاري تجهيز مشغل المحاضرات والفصول...</span>
      </div>
    );
  }

  return (
    <ClassroomPlayer
      subject={subject as any}
      initialLessonId={initialLesson}
      hasAccess={hasAccess}
    />
  );
}

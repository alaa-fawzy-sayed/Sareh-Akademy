'use client';

import { use, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { fetchSubjectBySlugOrId } from '@/lib/api/services';

export default function SubjectRedirectPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function resolveSubject() {
      try {
        const subject = await fetchSubjectBySlugOrId(params.slug);
        if (subject) {
          const uniSlug = subject.semester?.academicYear?.college?.university?.slug || 'assiut';
          const colSlug = subject.semester?.academicYear?.college?.slug || 'pharmacy';
          const q = searchParams.toString();
          const targetUrl = `/universities/${uniSlug}/${colSlug}/${subject.slug || params.slug}/watch${q ? `?${q}` : ''}`;
          router.replace(targetUrl);
        } else {
          router.replace('/subjects');
        }
      } catch {
        router.replace('/subjects');
      }
    }
    resolveSubject();
  }, [params.slug, router, searchParams]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        gap: 16,
        background: '#0a0d14',
        color: '#94a3b8',
        fontFamily: 'inherit',
      }}
    >
      <Loader2 size={36} style={{ animation: 'spin 0.8s linear infinite', color: '#6366f1' }} />
      <span style={{ fontSize: 15, fontWeight: 500 }}>جاري توجيهك إلى صفحة المادة ومشغل المحتوى...</span>
    </div>
  );
}

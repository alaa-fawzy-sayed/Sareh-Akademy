import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import Script from 'next/script';

export const metadata: Metadata = {
  title: {
    default: 'صرح أكاديمي | Sarh Academy — منصة التعليم الجامعي',
    template: '%s | صرح أكاديمي — Sarh Academy',
  },
  description: 'منصة صرح أكاديمي (Sarh Academy) للتعليم الجامعي — محتوى تعليمي عالي الجودة لطلاب الجامعات المصرية',
  keywords: ['صرح أكاديمي', 'Sarh Academy', 'تعليم جامعي', 'كيمياء', 'صيدلة', 'طب', 'مصر', 'محاضرات'],
  authors: [{ name: 'صرح أكاديمي — Sarh Academy' }],
  openGraph: {
    title: 'صرح أكاديمي | Sarh Academy — منصة التعليم الجامعي',
    description: 'تعلم بذكاء مع أفضل المحتوى التعليمي الجامعي في صرح أكاديمي',
    type: 'website',
    locale: 'ar_EG',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('top_pharma_theme')||'dark';document.documentElement.setAttribute('data-theme',t);document.body&&document.body.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: {
    default: 'Top-Pharma | منصة التعليم الجامعي',
    template: '%s | Top-Pharma',
  },
  description: 'منصة Top-Pharma للتعليم الجامعي — محتوى تعليمي عالي الجودة لطلاب الجامعات المصرية',
  keywords: ['تعليم', 'جامعة', 'كيمياء', 'فارماسيوتيكال', 'مصر', 'محاضرات'],
  authors: [{ name: 'Top-Pharma' }],
  openGraph: {
    title: 'Top-Pharma | منصة التعليم الجامعي',
    description: 'تعلم بذكاء مع أفضل المحتوى التعليمي الجامعي',
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
    <html lang="ar" dir="rtl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

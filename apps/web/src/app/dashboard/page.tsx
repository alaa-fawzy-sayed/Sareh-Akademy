import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header/Header';
import { DashboardView } from '@/components/features/dashboard/DashboardView';

export const metadata: Metadata = {
  title: 'لوحتي الدراسية',
  description: 'تابع تقدمك الدراسي ومحتواك في صرح أكاديمي (Sarh Academy)',
};

export default function DashboardPage() {
  return (
    <>
      <Header />
      <DashboardView />
    </>
  );
}

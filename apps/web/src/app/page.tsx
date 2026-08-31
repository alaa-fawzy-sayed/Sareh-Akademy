import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { HeroSection } from '@/components/features/home/HeroSection';
import { StatsSection } from '@/components/features/home/StatsSection';
import { UniversitiesSection } from '@/components/features/home/UniversitiesSection';
import { HowItWorks } from '@/components/features/home/HowItWorks';
import { FeaturesSection } from '@/components/features/home/FeaturesSection';
import { CtaSection } from '@/components/features/home/CtaSection';

export const metadata: Metadata = {
  title: 'Top-Pharma | منصة التعليم الجامعي الأولى في مصر',
  description: 'تعلم مع أفضل الأساتذة، وصول فوري لمحاضرات الجامعات المصرية — فيديوهات، ملفات، كويزات',
};

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <HeroSection />
        <StatsSection />
        <UniversitiesSection />
        <FeaturesSection />
        <HowItWorks />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}

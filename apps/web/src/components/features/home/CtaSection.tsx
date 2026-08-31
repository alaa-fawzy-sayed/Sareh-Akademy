import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { ArrowLeft } from 'lucide-react';
import styles from './CtaSection.module.css';

export function CtaSection() {
  return (
    <section className={styles.section} id="cta-section">
      <div className="container">
        <div className={styles.card}>
          <div className={styles.bg} aria-hidden="true">
            <div className={styles.orb1} />
            <div className={styles.orb2} />
          </div>
          <div className={styles.content}>
            <div className={styles.emoji}>🚀</div>
            <h2 className={styles.title}>ابدأ رحلتك التعليمية اليوم</h2>
            <p className={styles.subtitle}>
              انضم لأكثر من 15,000 طالب يتعلمون مع Top-Pharma.
              سجّل مجاناً وابدأ فوراً.
            </p>
            <div className={styles.actions}>
              <Link href="/register">
                <Button size="lg" id="cta-register-btn">
                  ابدأ مجاناً
                  <ArrowLeft size={18} />
                </Button>
              </Link>
              <Link href="/universities">
                <Button variant="secondary" size="lg" id="cta-explore-btn">
                  استكشف الجامعات
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

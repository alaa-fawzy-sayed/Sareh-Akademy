'use client';

import Link from 'next/link';
import { Search, Play, ChevronLeft, Star, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import styles from './HeroSection.module.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HeroSection() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <section className={styles.hero} id="hero-section">
      {/* Animated Background */}
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
        <div className={styles.grid} />
      </div>

      <div className={`container ${styles.inner}`}>
        <div className={styles.content}>
          {/* Badge */}
          <div className={`${styles.badge} animate-fade-in-up`} id="hero-badge">
            <Star size={12} fill="currentColor" />
            <span>المنصة التعليمية الأولى لطلاب الجامعات المصرية</span>
          </div>

          {/* Headline */}
          <h1 className={`${styles.title} animate-fade-in-up`}>
            تعلّم بذكاء
            <br />
            <span className="gradient-text">وانجح بثقة</span>
          </h1>

          <p className={`${styles.subtitle} animate-fade-in-up`}>
            وصول فوري لأفضل المحاضرات الجامعية — فيديوهات، ملفات، كويزات تفاعلية.
            <br />كل ما تحتاجه في مكان واحد.
          </p>

          {/* Search */}
          <form className={`${styles.searchBar} animate-fade-in-up`} onSubmit={handleSearch} id="hero-search-form">
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="ابحث عن مادة، جامعة، أو أستاذ..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
              id="hero-search-input"
            />
            <button type="submit" className={styles.searchBtn} id="hero-search-submit">بحث</button>
          </form>

          {/* Popular tags */}
          <div className={`${styles.tags} animate-fade-in-up`}>
            <span className={styles.tagsLabel}>الأكثر بحثاً:</span>
            {['الكيمياء', 'الفيزياء', 'الأحياء', 'الرياضيات', 'الطب'].map((tag) => (
              <button key={tag} className={styles.tag} id={`hero-tag-${tag}`}>
                {tag}
              </button>
            ))}
          </div>

          {/* CTAs */}
          <div className={`${styles.ctas} animate-fade-in-up`}>
            <Link href="/register">
              <Button size="lg" id="hero-cta-register">
                ابدأ مجاناً الآن
                <ChevronLeft size={18} />
              </Button>
            </Link>
            <button className={styles.watchDemo} id="hero-cta-demo">
              <div className={styles.playBtn}>
                <Play size={14} fill="currentColor" />
              </div>
              شاهد كيف تعمل المنصة
            </button>
          </div>

          {/* Social proof */}
          <div className={`${styles.socialProof} animate-fade-in-up`}>
            <div className={styles.avatars}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.proofAvatar} style={{ background: `hsl(${i * 60 + 240}, 60%, 55%)` }}>
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div>
              <div className={styles.proofStars}>
                {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#F59E0B" color="#F59E0B" />)}
              </div>
              <p className={styles.proofText}>+15,000 طالب يثقون بنا</p>
            </div>
          </div>
        </div>

        {/* Visual Cards */}
        <div className={`${styles.visuals} animate-float`} aria-hidden="true">
          <div className={styles.card1}>
            <div className={styles.cardHeader}>
              <div className={styles.cardDot} style={{ background: '#10B981' }} />
              <span>محاضرة مباشرة</span>
            </div>
            <div className={styles.cardTitle}>الكيمياء العضوية — الفصل الثالث</div>
            <div className={styles.cardBar}>
              <div className={styles.cardProgress} style={{ width: '68%' }} />
            </div>
            <div className={styles.cardMeta}>
              <Users size={12} /> <span>342 طالب</span>
              <BookOpen size={12} style={{ marginRight: 8 }} /> <span>24 درس</span>
            </div>
          </div>

          <div className={styles.card2}>
            <div className={styles.card2Icon}>🎯</div>
            <div className={styles.card2Info}>
              <strong>اجتزت الاختبار!</strong>
              <span>درجة 92% — ممتاز</span>
            </div>
          </div>

          <div className={styles.card3}>
            <div className={styles.card3Icon}>📚</div>
            <div className={styles.card3Text}>+500 مادة دراسية</div>
          </div>
        </div>
      </div>
    </section>
  );
}

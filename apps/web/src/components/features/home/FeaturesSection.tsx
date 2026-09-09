import { Video, FileText, Target, Trophy, Shield, Zap } from 'lucide-react';
import styles from './FeaturesSection.module.css';

const features = [
  {
    icon: Video,
    title: 'فيديوهات عالية الجودة',
    desc: 'محاضرات مسجلة بجودة HD مع إمكانية التحكم في السرعة والتكرار',
    color: '#6C63FF',
  },
  {
    icon: FileText,
    title: 'ملفات ومذكرات PDF',
    desc: 'تحميل الملفات والمذكرات الدراسية في أي وقت بدون انقطاع',
    color: '#F59E0B',
  },
  {
    icon: Target,
    title: 'كويزات تفاعلية',
    desc: 'اختبر نفسك مع كويزات وامتحانات تفاعلية بنظام التصحيح الفوري',
    color: '#10B981',
  },
  {
    icon: Trophy,
    title: 'تتبع تقدمك',
    desc: 'راقب تقدمك الدراسي ودرجاتك في مكان واحد بصريا',
    color: '#EF4444',
  },
  {
    icon: Shield,
    title: 'محتوى موثوق',
    desc: 'محتوى مراجَع من أساتذة الجامعات وخبراء مجالهم',
    color: '#8B5CF6',
  },
  {
    icon: Zap,
    title: 'وصول فوري',
    desc: 'ابدأ التعلم فور الاشتراك — لا تأخير ولا انتظار',
    color: '#06B6D4',
  },
];

export function FeaturesSection() {
  return (
    <section className={styles.section} id="features-section">
      <div className="container">
        <div className={styles.header}>
          <div className={styles.tag}>لماذا صرح أكاديمي؟</div>
          <h2 className={styles.title}>كل ما تحتاجه <span className="gradient-text">في مكان واحد</span></h2>
        </div>
        <div className={styles.grid}>
          {features.map((f, i) => (
            <div key={i} className={styles.card} id={`feature-card-${i}`}>
              <div className={styles.iconWrap} style={{ '--f-color': f.color } as React.CSSProperties}>
                <f.icon size={22} />
              </div>
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={styles.cardDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import styles from './HowItWorks.module.css';

const steps = [
  { num: '01', title: 'سجّل حسابك', desc: 'أنشئ حسابك مجاناً في دقيقة واحدة', emoji: '👤' },
  { num: '02', title: 'اختر جامعتك وكليتك', desc: 'ابحث عن مادتك ضمن هيكل جامعتك', emoji: '🏛️' },
  { num: '03', title: 'اشترك في المادة', desc: 'ادفع مرة واحدة وصول غير محدود طوال الفصل', emoji: '💳' },
  { num: '04', title: 'تعلّم وانجح', desc: 'شاهد المحاضرات وادرس الملفات واجتز الاختبارات', emoji: '🎯' },
];

export function HowItWorks() {
  return (
    <section className={styles.section} id="how-it-works-section">
      <div className="container">
        <div className={styles.header}>
          <div className={styles.tag}>خطوات بسيطة</div>
          <h2 className={styles.title}>كيف <span className="gradient-text">تبدأ؟</span></h2>
        </div>
        <div className={styles.steps}>
          {steps.map((step, i) => (
            <div key={i} className={styles.step} id={`step-${i}`}>
              <div className={styles.stepNum}>{step.num}</div>
              {i < steps.length - 1 && <div className={styles.connector} aria-hidden="true" />}
              <div className={styles.stepEmoji}>{step.emoji}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import { use, useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Plus, Edit2, Trash2, Tag, Lock, Unlock, PlayCircle } from 'lucide-react';
import { getUniversity, getCollege } from '@/lib/data/universities';
import { useIsAdmin } from '@/lib/hooks/useIsAdmin';
import { Header } from '@/components/layout/Header/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { Button } from '@/components/ui/Button/Button';
import { PaymentModal } from '@/components/features/payment/PaymentModal';
import styles from './page.module.css';

export default function CollegePage(props: { params: Promise<{ slug: string; college: string }> }) {
  const params = use(props.params);
  const uni = getUniversity(params.slug);
  const college = getCollege(params.slug, params.college);
  
  const isAdmin = useIsAdmin();

  if (!uni || !college) notFound();

  // For demonstration, we'll use local state to simulate admin actions
  const [subjects, setSubjects] = useState(college.subjects);
  
  // Payment Modal state
  const [paymentSubject, setPaymentSubject] = useState<{name: string, price: number} | null>(null);

  const handleAddSubject = () => {
    alert('سيتم فتح نافذة إضافة مادة جديدة (محاكاة)');
  };

  const handleEditSubject = (id: string) => {
    alert(`سيتم فتح نافذة تعديل المادة ${id} (محاكاة)`);
  };

  const handleDeleteSubject = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المادة؟')) {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  const handleSubjectClick = (subject: any) => {
    if (subject.isFree || isAdmin) {
      // Navigate to course content
      alert(`سيتم تحويلك إلى محتوى مادة: ${subject.name}`);
    } else {
      // Open Payment Modal
      setPaymentSubject({
        name: subject.name,
        price: subject.price || 150 // default price if not set
      });
    }
  };

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          {/* Breadcrumbs */}
          <div className={styles.breadcrumbs}>
            <Link href="/universities">الجامعات</Link>
            <span className={styles.separator}>/</span>
            <Link href={`/universities/${uni.slug}`}>{uni.nameAr}</Link>
            <span className={styles.separator}>/</span>
            <span className={styles.current}>{college.nameAr}</span>
          </div>

          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <div className={styles.iconWrap}>{college.icon}</div>
              <div>
                <h1 className={styles.title}>{college.nameAr}</h1>
                <p className={styles.subtitle}>{uni.nameAr}</p>
              </div>
            </div>
            
            {isAdmin && (
              <Button onClick={handleAddSubject} leftIcon={<Plus size={16} />}>
                إضافة مادة
              </Button>
            )}
          </div>

          {subjects.length === 0 ? (
            <div className={styles.empty}>
              <BookOpen size={48} className={styles.emptyIcon} />
              <p>لا توجد مواد مضافة في هذه الكلية حالياً.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {subjects.map((subject) => (
                <div key={subject.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.subjectIcon}>
                      <BookOpen size={20} />
                    </div>
                    <div className={styles.badges}>
                      {subject.isFree ? (
                        <span className={`${styles.badge} ${styles.badgeFree}`}>
                          <Unlock size={12} /> مجاني
                        </span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgePaid}`}>
                          <Lock size={12} /> مدفوع
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <h3 className={styles.subjectName}>{subject.name}</h3>
                  <p className={styles.subjectDesc}>
                    {subject.description || 'لا يوجد وصف متاح لهذه المادة حالياً.'}
                  </p>

                  <div className={styles.cardBottom}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      fullWidth 
                      leftIcon={<PlayCircle size={16} />}
                      onClick={() => handleSubjectClick(subject)}
                    >
                      {subject.isFree || isAdmin ? 'تصفح المحتوى' : 'اشترك الآن'}
                    </Button>
                  </div>

                  {/* Admin Controls Overlay */}
                  {isAdmin && (
                    <div className={styles.adminControls}>
                      <button 
                        className={`${styles.adminBtn} ${styles.editBtn}`} 
                        onClick={() => handleEditSubject(subject.id)}
                        title="تعديل المادة"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className={`${styles.adminBtn} ${styles.deleteBtn}`} 
                        onClick={() => handleDeleteSubject(subject.id)}
                        title="حذف المادة"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      
      {/* Payment Modal */}
      <PaymentModal 
        isOpen={!!paymentSubject} 
        onClose={() => setPaymentSubject(null)} 
        subjectName={paymentSubject?.name || ''} 
        price={paymentSubject?.price || 0} 
      />
    </>
  );
}

import { useState } from 'react';
import { X, UploadCloud, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import styles from './PaymentModal.module.css';

interface PaymentModalProps {
  subjectName: string;
  price: number;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentModal({ subjectName, price, isOpen, onClose }: PaymentModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!file) return;
    setIsSubmitting(true);
    // Simulate API upload
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(2);
    }, 1500);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        {step === 1 ? (
          <>
            <h2 className={styles.title}>تأكيد الدفع</h2>
            <p className={styles.subtitle}>الاشتراك في: <strong>{subjectName}</strong></p>
            
            <div className={styles.priceBox}>
              <span className={styles.priceLabel}>قيمة الاشتراك:</span>
              <span className={styles.priceValue}>{price} جنيه</span>
            </div>

            <div className={styles.instructions}>
              <div className={styles.infoIcon}><Info size={20} /></div>
              <div>
                <h4 className={styles.instTitle}>كيفية الدفع عبر فودافون كاش:</h4>
                <ol className={styles.instList}>
                  <li>قم بتحويل المبلغ إلى الرقم التالي: <strong dir="ltr" className={styles.vCashNumber}>01012345678</strong></li>
                  <li>خذ لقطة شاشة (Screenshot) لرسالة تأكيد التحويل.</li>
                  <li>قم برفع الصورة هنا لمراجعتها وتفعيل اشتراكك.</li>
                </ol>
              </div>
            </div>

            <div className={styles.uploadArea}>
              <input 
                type="file" 
                id="receipt-upload" 
                className={styles.fileInput} 
                accept="image/*"
                onChange={handleFileChange}
              />
              <label htmlFor="receipt-upload" className={styles.uploadLabel}>
                <UploadCloud size={32} className={styles.uploadIcon} />
                <span className={styles.uploadText}>
                  {file ? file.name : 'اضغط هنا لرفع صورة الإيصال'}
                </span>
                <span className={styles.uploadHint}>JPG, PNG أو PDF</span>
              </label>
            </div>

            <Button 
              fullWidth 
              size="lg" 
              onClick={handleSubmit} 
              disabled={!file || isSubmitting}
              loading={isSubmitting}
            >
              تأكيد الدفع وإرسال للمراجعة
            </Button>
          </>
        ) : (
          <div className={styles.successState}>
            <div className={styles.successIconWrap}>
              <CheckCircle size={48} />
            </div>
            <h2 className={styles.title}>تم إرسال طلبك بنجاح!</h2>
            <p className={styles.subtitle} style={{ marginBottom: '24px' }}>
              سيتم مراجعة الإيصال من قبل الإدارة وتفعيل اشتراكك في أقرب وقت. ستصلك رسالة تأكيد عند التفعيل.
            </p>
            <Button onClick={onClose} fullWidth>حسناً، فهمت</Button>
          </div>
        )}
      </div>
    </div>
  );
}

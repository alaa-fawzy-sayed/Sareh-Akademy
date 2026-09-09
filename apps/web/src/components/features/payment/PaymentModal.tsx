'use client';

import { useState, useRef } from 'react';
import {
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  UploadCloud,
  FileImage,
  Sparkles,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { submitManualPayment } from '@/lib/api/services';
import styles from './PaymentModal.module.css';

interface PaymentModalProps {
  subjectId: string;
  subjectName: string;
  price: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'form' | 'submitting' | 'success' | 'error';

const VODAFONE_NUMBER = '01044599072';

export function PaymentModal({
  subjectId,
  subjectName,
  price,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [step, setStep] = useState<Step>('form');
  const [copied, setCopied] = useState(false);

  // Form fields
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setStep('form');
    setSenderNumber('');
    setTransactionRef('');
    setNotes('');
    setReceiptImage(null);
    setReceiptFileName('');
    setErrorMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(VODAFONE_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('يرجى رفع صورة إيصال صحيحة (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('حجم الصورة كبير جداً، يرجى رفع صورة أقل من 8 ميجابايت');
      return;
    }

    setReceiptFileName(file.name);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!senderNumber.trim()) {
      setErrorMsg('يرجى كتابة رقم المحفظة أو الحساب المحول منه');
      return;
    }

    if (!receiptImage) {
      setErrorMsg('يرجى رفع صورة إيصال التحويل أو سكرين شوت العملية');
      return;
    }

    setStep('submitting');
    setErrorMsg('');

    try {
      await submitManualPayment({
        subjectIds: [subjectId],
        senderNumber: senderNumber.trim(),
        paymentMethod: 'VODAFONE_CASH',
        receiptUrl: receiptImage,
        transactionRef: transactionRef.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setStep('success');
      onSuccess?.();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء إرسال إيصال الدفع';
      setErrorMsg(Array.isArray(msg) ? msg[0] : msg);
      setStep('form');
    }
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        id="payment-receipt-modal"
        style={{ maxWidth: 540, maxHeight: '92vh', overflowY: 'auto' }}
      >
        <button className={styles.closeBtn} onClick={handleClose} aria-label="إغلاق">
          <X size={20} />
        </button>

        {/* ══════════════════════════════════════════
            STEP 1: Form / Submission
        ══════════════════════════════════════════ */}
        {step === 'form' && (
          <form onSubmit={handleSubmit}>
            <div className={styles.title}>الاشتراك في المقرر الدراسي</div>
            <div className={styles.subtitle}>
              مادة: <strong style={{ color: 'var(--text-primary)' }}>{subjectName}</strong>
            </div>

            {/* Price Box */}
            <div className={styles.priceBox}>
              <div className={styles.priceLabel}>المبلغ المطلوب تحويله:</div>
              <div className={styles.priceValue}>{price} ج.م</div>
            </div>

            {/* Vodafone Cash Box */}
            <div className={styles.vodafoneBox}>
              <div className={styles.vodafoneHeader}>
                <span className={styles.vodafoneBadge}>فودافون كاش / محافظ إلكترونية</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  رقم التحويل المعتمد للمنصة
                </span>
              </div>

              <div className={styles.vodafoneNumberRow}>
                <div className={styles.vodafoneNumber}>{VODAFONE_NUMBER}</div>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={handleCopyNumber}
                  title="نسخ الرقم"
                >
                  {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                  <span>{copied ? 'تم النسخ!' : 'نسخ الرقم'}</span>
                </button>
              </div>

              <div className={styles.instructionsList}>
                <div className={styles.instructionItem}>
                  <span className={styles.stepNum}>1</span>
                  <span>حوّل مبلغ {price} ج.م إلى رقم فودافون كاش أعلاه من محفظتك أو تطبيق إنستاباي.</span>
                </div>
                <div className={styles.instructionItem}>
                  <span className={styles.stepNum}>2</span>
                  <span>التقط سكرين شوت لرسالة أو إشعار التحويل وارفعها بالأسفل.</span>
                </div>
                <div className={styles.instructionItem}>
                  <span className={styles.stepNum}>3</span>
                  <span>سيتم تدقيق الإيصال من الإدارة وتفعيل المادة في حسابك مباشرة.</span>
                </div>
              </div>
            </div>

            {/* Sender Number Input */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                رقم المحفظة / الهاتف المحول منه <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="مثال: 010xxxxxxxx"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                required
                id="sender-number-input"
              />
            </div>

            {/* Receipt Image Upload */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                صورة إيصال التحويل (سكرين شوت) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
                id="receipt-file-input"
              />

              {!receiptImage ? (
                <div
                  className={styles.uploadDropzone}
                  onClick={() => fileInputRef.current?.click()}
                  id="receipt-upload-dropzone"
                >
                  <UploadCloud size={32} className={styles.uploadIcon} />
                  <div className={styles.uploadText}>اضغط هنا لرفع صورة أو سكرين شوت الإيصال</div>
                  <div className={styles.uploadHint}>JPG, PNG, WebP (بحد أقصى 8 ميجابايت)</div>
                </div>
              ) : (
                <div className={styles.previewContainer}>
                  <img src={receiptImage} alt="إيصال التحويل" className={styles.previewImg} />
                  <button
                    type="button"
                    className={styles.removeImgBtn}
                    onClick={() => {
                      setReceiptImage(null);
                      setReceiptFileName('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    title="حذف الصورة"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Transaction Ref (Optional) */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                رقم العملية المرجعي <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(اختياري من رسالة فودافون كاش)</span>
              </label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="مثال: 987654321"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                id="transaction-ref-input"
              />
            </div>

            {errorMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#f87171',
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              id="submit-receipt-btn"
            >
              إرسال إيصال التحويل وتأكيد الطلب
            </Button>
          </form>
        )}

        {/* ══════════════════════════════════════════
            STEP 2: Submitting
        ══════════════════════════════════════════ */}
        {step === 'submitting' && (
          <div className={styles.centeredState}>
            <Loader2 size={40} className={styles.spinner} />
            <div className={styles.processingText}>جاري رفع إيصال التحويل وتسجيل طلبك...</div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP 3: Success — Pending Admin Review
        ══════════════════════════════════════════ */}
        {step === 'success' && (
          <div className={styles.successState}>
            <div className={styles.successIconWrap}>
              <CheckCircle size={56} style={{ color: '#10b981' }} />
            </div>
            <div className={styles.title} style={{ color: '#10b981' }}>
              تم استلام إيصال التحويل بنجاح!
            </div>
            <p className={styles.subtitle} style={{ lineHeight: 1.8 }}>
              طلب اشتراكك في مادة <strong style={{ color: 'var(--text-primary)' }}>{subjectName}</strong> قيد المراجعة والتدقيق بواسطة الإدارة.
              <br />
              سيتم التحقق من التحويل على رقم فودافون كاش <strong>{VODAFONE_NUMBER}</strong> وتفعيل المقرر في حسابك فوراً.
            </p>

            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 10,
                padding: '14px',
                fontSize: 13,
                color: '#34d399',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={18} />
              <span>ستصلك رسالة تأكيد في لوحتك الدراسية فور تفعيل المادة.</span>
            </div>

            <Button variant="primary" size="md" fullWidth onClick={handleClose}>
              متابعة لوحتي الدراسية
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

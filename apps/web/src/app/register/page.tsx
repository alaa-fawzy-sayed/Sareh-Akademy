import type { Metadata } from 'next';
import { RegisterForm } from '@/components/features/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'إنشاء حساب جديد',
  description: 'انضم إلى Top-Pharma وابدأ التعلم اليوم',
};

export default function RegisterPage() {
  return <RegisterForm />;
}

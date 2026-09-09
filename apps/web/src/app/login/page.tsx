import type { Metadata } from 'next';
import { LoginForm } from '@/components/features/auth/LoginForm';

export const metadata: Metadata = {
  title: 'تسجيل الدخول',
  description: 'سجّل دخولك إلى منصة صرح أكاديمي (Sarh Academy) التعليمية',
};

export default function LoginPage() {
  return <LoginForm />;
}

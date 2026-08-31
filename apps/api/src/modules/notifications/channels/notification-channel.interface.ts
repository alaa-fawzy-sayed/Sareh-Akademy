import { NotificationType } from '@top-pharma/types';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  fcmToken?: string;
  userEmail?: string;
  userName?: string;
}

export interface NotificationChannel {
  name: string;
  send(payload: NotificationPayload): Promise<boolean>;
}

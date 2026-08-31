import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getMessaging, Message } from 'firebase-admin/messaging';
import * as fs from 'fs';
import * as path from 'path';
import { NotificationChannel, NotificationPayload } from './notification-channel.interface';

@Injectable()
export class FcmChannel implements NotificationChannel {
  readonly name = 'FCM';
  private readonly logger = new Logger(FcmChannel.name);
  private app: App | null = null;
  private isInitialized = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    const serviceAccountPath = this.configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_PATH',
      '',
    );

    if (!serviceAccountPath) {
      this.logger.warn(
        'FIREBASE_SERVICE_ACCOUNT_PATH not set. FCM push notifications disabled.',
      );
      return;
    }

    try {
      const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
      if (!fs.existsSync(resolvedPath)) {
        this.logger.warn(`Firebase service account file not found at ${resolvedPath}`);
        return;
      }

      const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));

      const existingApps = getApps();
      if (existingApps.length === 0) {
        this.app = initializeApp({
          credential: cert(serviceAccount),
        });
      } else {
        this.app = existingApps[0];
      }

      this.isInitialized = true;
      this.logger.log('Firebase Admin initialized successfully for FCM');
    } catch (error) {
      this.logger.error(
        `Failed to initialize Firebase Admin: ${(error as Error).message}`,
      );
    }
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    if (!this.isInitialized || !payload.fcmToken || !this.app) {
      return false;
    }

    try {
      const message: Message = {
        token: payload.fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.metadata
          ? Object.fromEntries(
              Object.entries(payload.metadata).map(([k, v]) => [k, String(v)]),
            )
          : {},
      };

      const response = await getMessaging(this.app).send(message);
      this.logger.log(`FCM message sent successfully: ${response}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send FCM push notification: ${(error as Error).message}`,
      );
      return false;
    }
  }
}

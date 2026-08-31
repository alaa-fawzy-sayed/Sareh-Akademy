import { Injectable } from '@nestjs/common';
import { MailService } from '../../../infrastructure/mail/mail.service';
import { NotificationChannel, NotificationPayload } from './notification-channel.interface';

@Injectable()
export class EmailChannel implements NotificationChannel {
  readonly name = 'EMAIL';

  constructor(private readonly mailService: MailService) {}

  async send(payload: NotificationPayload): Promise<boolean> {
    if (!payload.userEmail) {
      return false;
    }

    return this.mailService.sendNotificationEmail(
      payload.userEmail,
      payload.userName || 'عزيزي الطالب',
      payload.title,
      payload.body,
    );
  }
}

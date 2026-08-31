import { Global, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FcmChannel } from './channels/fcm.channel';
import { EmailChannel } from './channels/email.channel';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, FcmChannel, EmailChannel],
  exports: [NotificationsService],
})
export class NotificationsModule {}

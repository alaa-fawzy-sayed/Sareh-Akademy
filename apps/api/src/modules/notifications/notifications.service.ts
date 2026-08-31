import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { FcmChannel } from './channels/fcm.channel';
import { EmailChannel } from './channels/email.channel';
import { NotificationType } from '@top-pharma/types';
import { RegisterDeviceDto } from './dto/register-device.dto';

// In-memory or cache device tokens store (keyed by userId)
const userDeviceTokens = new Map<string, { fcmToken: string; platform: string; updatedAt: Date }>();

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fcmChannel: FcmChannel,
    private readonly emailChannel: EmailChannel,
  ) {}

  /**
   * Register a user's FCM device token
   */
  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    userDeviceTokens.set(userId, {
      fcmToken: dto.fcmToken,
      platform: dto.platform || 'web',
      updatedAt: new Date(),
    });

    this.logger.log(`FCM token registered for user: ${userId}`);
    return { success: true, message: 'Device registered for push notifications' };
  }

  /**
   * Dispatch a notification to a user across multiple channels (In-App DB + FCM + Email)
   */
  async notify(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    metadata?: Record<string, unknown>,
    options?: { sendPush?: boolean; sendEmail?: boolean },
  ) {
    // 1. Create In-App Notification in DB
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: type as any,
        title,
        body,
        metadata: metadata as any,
      },
    });

    // Fetch user details if needed for external channels
    if (options?.sendPush || options?.sendEmail) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true },
      });

      const device = userDeviceTokens.get(userId);

      // 2. Send Push Notification if requested and token exists
      if (options?.sendPush && device?.fcmToken) {
        this.fcmChannel
          .send({
            userId,
            type,
            title,
            body,
            metadata,
            fcmToken: device.fcmToken,
          })
          .catch((err) => this.logger.error(`Push notification failed: ${err.message}`));
      }

      // 3. Send Email Notification if requested
      if (options?.sendEmail && user?.email) {
        this.emailChannel
          .send({
            userId,
            type,
            title,
            body,
            metadata,
            userEmail: user.email,
            userName: user.firstName,
          })
          .catch((err) => this.logger.error(`Email notification failed: ${err.message}`));
      }
    }

    return notification;
  }

  /**
   * Dispatch a notification to multiple users
   */
  async notifyMany(
    userIds: string[],
    type: NotificationType,
    title: string,
    body: string,
    metadata?: Record<string, unknown>,
  ) {
    if (userIds.length === 0) return { count: 0 };

    const notificationsData = userIds.map((userId) => ({
      userId,
      type: type as any,
      title,
      body,
      metadata: metadata as any,
    }));

    const result = await this.prisma.notification.createMany({
      data: notificationsData,
    });

    // Fire FCM push in background for registered devices
    for (const userId of userIds) {
      const device = userDeviceTokens.get(userId);
      if (device?.fcmToken) {
        this.fcmChannel
          .send({
            userId,
            type,
            title,
            body,
            metadata,
            fcmToken: device.fcmToken,
          })
          .catch((err) => this.logger.error(`Push notifyMany failed: ${err.message}`));
      }
    }

    return { count: result.count };
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [total, unreadCount, items] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        unreadCount,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Cannot modify notifications of other users');
    }

    if (notification.isRead) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { updatedCount: result.count, message: 'All notifications marked as read' };
  }
}

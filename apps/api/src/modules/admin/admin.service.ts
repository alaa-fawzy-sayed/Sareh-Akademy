import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface AnalyticsQuery {
  from: Date;
  to: Date;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      usersCount,
      universitiesCount,
      subjectsCount,
      payments,
      videosCount,
      quizzesCount,
      filesCount,
      chaptersCount,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.university.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.subject.count({ where: { deletedAt: null } }),
      this.prisma.payment.findMany({
        where: { status: 'VERIFIED' },
        select: { amount: true },
      }),
      this.prisma.video.count(),
      this.prisma.quiz.count(),
      this.prisma.file.count(),
      this.prisma.chapter.count(),
    ]);

    const totalRevenue = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);

    // Get 5 recent users
    const recentUsers = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get 5 recent payments
    const recentPayments = await this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        order: {
          include: {
            user: true,
          },
        },
      },
    });

    return {
      stats: {
        users: usersCount,
        universities: universitiesCount,
        subjects: subjectsCount,
        revenue: totalRevenue,
        videos: videosCount,
        quizzes: quizzesCount,
        files: filesCount,
        chapters: chaptersCount,
      },
      recentUsers: recentUsers.map(u => ({
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        createdAt: u.createdAt,
      })),
      recentPayments: recentPayments.map(p => ({
        user: `${p.order.user.firstName} ${p.order.user.lastName}`,
        amount: Number(p.amount),
        status: p.status,
        createdAt: p.createdAt,
      })),
    };
  }

  /**
   * Get analytics data filtered by a date range.
   * Returns daily breakdowns + aggregated stats for the selected period.
   */
  async getAnalytics(query: AnalyticsQuery) {
    const { from, to } = query;

    // Run all queries in parallel
    const [
      newUsers,
      activeUsers,
      payments,
      watchHistory,
      topSubjects,
      topUniversities,
    ] = await Promise.all([
      // New registrations in the period
      this.prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: from, lte: to },
        },
      }),

      // Users who watched something in the period
      this.prisma.watchHistory.groupBy({
        by: ['userId'],
        where: { watchedAt: { gte: from, lte: to } },
      }),

      // Payments in the period
      this.prisma.payment.findMany({
        where: {
          status: 'VERIFIED',
          createdAt: { gte: from, lte: to },
        },
        select: { amount: true, createdAt: true },
      }),

      // Watch history events in the period (for daily chart)
      this.prisma.watchHistory.findMany({
        where: { watchedAt: { gte: from, lte: to } },
        select: { watchedAt: true },
        orderBy: { watchedAt: 'asc' },
      }),

      // Top 5 subjects by watch count
      this.prisma.watchHistory.groupBy({
        by: ['contentId'],
        where: { watchedAt: { gte: from, lte: to } },
        _count: { contentId: true },
        orderBy: { _count: { contentId: 'desc' } },
        take: 20,
      }).then(async (rows) => {
        // Resolve content → chapter → subject
        const contentIds = rows.map(r => r.contentId);
        const contents = await this.prisma.content.findMany({
          where: { id: { in: contentIds } },
          select: {
            id: true,
            chapter: {
              select: {
                subject: { select: { id: true, nameAr: true, nameEn: true } },
              },
            },
          },
        });

        // Aggregate by subject
        const subjectMap = new Map<string, { nameAr: string; nameEn: string; views: number }>();
        for (const row of rows) {
          const content = contents.find(c => c.id === row.contentId);
          const subject = content?.chapter?.subject;
          if (!subject) continue;
          const existing = subjectMap.get(subject.id) ?? { nameAr: subject.nameAr, nameEn: subject.nameEn, views: 0 };
          existing.views += row._count.contentId;
          subjectMap.set(subject.id, existing);
        }

        return Array.from(subjectMap.values())
          .sort((a, b) => b.views - a.views)
          .slice(0, 5);
      }),

      // Top 5 universities by college count (since User has no universityId)
      this.prisma.university.findMany({
        where: { isActive: true, deletedAt: null },
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          _count: { select: { colleges: true } },
        },
        orderBy: { colleges: { _count: 'desc' } },
        take: 5,
      }).then((unis) =>
        unis.map(u => ({
          nameAr: u.nameAr,
          nameEn: u.nameEn,
          students: u._count.colleges,
        }))
      ),
    ]);

    // ── Daily breakdown ──────────────────────────────────────────
    // Build a map of date → watch count
    const dailyMap = new Map<string, number>();
    for (const row of watchHistory) {
      const day = row.watchedAt.toISOString().split('T')[0]; // "2025-01-15"
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
    }

    // Fill every day in the range (even with 0)
    const dailyLabels: string[] = [];
    const dailyValues: number[] = [];
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    while (cursor <= end) {
      const key = cursor.toISOString().split('T')[0];
      dailyLabels.push(key);
      dailyValues.push(dailyMap.get(key) ?? 0);
      cursor.setDate(cursor.getDate() + 1);
    }

    const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);

    // Conversion rate = paying users / new signups (rough)
    const payingUsers = new Set(payments.map(p => p.createdAt.toISOString().split('T')[0])).size;
    const conversionRate = newUsers > 0 ? Math.round((payingUsers / newUsers) * 100 * 10) / 10 : 0;

    // Normalise top subjects for the chart
    const maxViews = topSubjects[0]?.views ?? 1;
    const topSubjectsNorm = topSubjects.map(s => ({
      name: s.nameAr,
      views: s.views,
      pct: Math.round((s.views / maxViews) * 100),
    }));

    const maxStudents = topUniversities[0]?.students ?? 1;
    const topUniversitiesNorm = topUniversities.map(u => ({
      name: u.nameAr,
      students: u.students,
      pct: Math.round((u.students / maxStudents) * 100),
    }));

    return {
      period: { from, to },
      stats: {
        newUsers,
        activeUsers: activeUsers.length,
        revenue: totalRevenue,
        contentViews: watchHistory.length,
        conversionRate,
      },
      chart: {
        labels: dailyLabels,
        values: dailyValues,
      },
      topSubjects: topSubjectsNorm,
      topUniversities: topUniversitiesNorm,
    };
  }

  /**
   * GET /admin/orders
   * Returns paginated list of all orders with user, items, and payment info
   */
  async getOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const page  = Math.max(1, params.page  ?? 1);
    const limit = Math.min(100, params.limit ?? 10);
    const skip  = (page - 1) * limit;

    const where: any = {};

    if (params.status && params.status !== 'الكل') {
      where.status = params.status;
    }

    if (params.search?.trim()) {
      where.OR = [
        { user: { firstName: { contains: params.search, mode: 'insensitive' } } },
        { user: { lastName:  { contains: params.search, mode: 'insensitive' } } },
        { user: { email:     { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user:    { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          items:   true,
          payment: { select: { id: true, provider: true, providerRef: true, status: true, verifiedAt: true, metadata: true, amount: true } },
          discount:{ select: { code: true, type: true, value: true } },
        },
      }),
    ]);

    // Revenue stats (paid orders only)
    const [paidCount, pendingCount, failedCount, revenueAgg] = await Promise.all([
      this.prisma.order.count({ where: { status: 'PAID' } }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { status: 'FAILED' } }),
      this.prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { totalAmount: true } }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        paidCount,
        pendingCount,
        failedCount,
        totalRevenue: Number(revenueAgg._sum.totalAmount ?? 0),
      },
    };
  }

  /**
   * Approve a pending order and grant user access
   */
  async approveOrder(orderId: string, adminId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payment: true },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (order.status === 'PAID') {
      return { success: true, message: 'الطلب مفعل بالفعل' };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });

      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: 'VERIFIED',
            verifiedAt: new Date(),
          },
        });
      }

      for (const item of order.items) {
        const existing = await tx.userAccess.findFirst({
          where: {
            userId: order.userId,
            subjectId: item.subjectId,
            revokedAt: null,
          },
        });

        if (!existing) {
          await tx.userAccess.create({
            data: {
              userId: order.userId,
              subjectId: item.subjectId,
              source: 'PURCHASE',
              grantedAt: new Date(),
              grantedBy: adminId,
              metadata: { orderId: order.id, approvedBy: adminId },
            },
          });
        }
      }

      await tx.notification.create({
        data: {
          userId: order.userId,
          type: 'PAYMENT_CONFIRMED',
          title: 'تم تأكيد الدفع وتفعيل الاشتراك!',
          body: `تم مراجعة إيصال التحويل وتفعيل المادة في حسابك بنجاح. يمكنك الآن بدء المشاهدة.`,
          metadata: { orderId: order.id },
        },
      });
    });

    return {
      success: true,
      message: 'تم اعتماد الطلب وتفعيل اشتراك الطالب بنجاح',
    };
  }

  /**
   * Reject a pending order with reason
   */
  async rejectOrder(orderId: string, adminId: string, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });

      if (order.payment) {
        const meta = (order.payment.metadata as any) || {};
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            metadata: {
              ...meta,
              rejectionReason: reason || 'لم يتم تأكيد وصول التحويل',
              rejectedBy: adminId,
            },
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: order.userId,
          type: 'SYSTEM',
          title: 'تم رفض طلب الاشتراك',
          body: `تعذر تأكيد الدفع: ${reason || 'يرجى مراجعة إيصال التحويل وإعادة المحاولة أو التواصل مع الدعم'}.`,
          metadata: { orderId: order.id },
        },
      });
    });

    return {
      success: true,
      message: 'تم رفض الطلب وإشعار الطالب',
    };
  }

  /**
   * Send notification / message from admin to all users or specific user
   */
  async sendBroadcastNotification(
    adminId: string,
    dto: {
      targetType: 'all' | 'admins' | 'college' | 'subject' | 'user';
      userId?: string;
      collegeId?: string;
      subjectId?: string;
      title: string;
      body: string;
      type?: string;
    },
  ) {
    if (!dto.title?.trim() || !dto.body?.trim()) {
      throw new BadRequestException('عنوان ونص الرسالة مطلوبان');
    }

    const notifType = (dto.type || 'SYSTEM') as any;
    const metadata = {
      sender: 'ADMIN',
      adminId,
      sentAt: new Date().toISOString(),
      targetType: dto.targetType,
      replyable: false, // User cannot reply directly
    };

    let targetUserIds: string[] = [];
    let targetLabel = 'المستخدمين';

    if (dto.targetType === 'user') {
      if (!dto.userId) {
        throw new BadRequestException('يجب تحديد المستخدم المستهدف');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new NotFoundException('المستخدم غير موجود');
      }

      const created = await this.prisma.notification.create({
        data: {
          userId: dto.userId,
          type: notifType,
          title: dto.title.trim(),
          body: dto.body.trim(),
          metadata,
        },
      });

      return {
        success: true,
        message: `تم إرسال الرسالة إلى ${user.firstName} ${user.lastName} بنجاح`,
        count: 1,
        notification: created,
      };
    } else if (dto.targetType === 'admins') {
      targetLabel = 'المشرفين والمدراء';
      const adminUsers = await this.prisma.user.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          userRoles: {
            some: {
              role: {
                name: { in: ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'] },
              },
            },
          },
        },
        select: { id: true },
      });
      targetUserIds = adminUsers.map((u) => u.id);
    } else if (dto.targetType === 'college' && dto.collegeId) {
      targetLabel = 'طلاب الكلية';
      const subjectsInCollege = await this.prisma.subject.findMany({
        where: {
          deletedAt: null,
          semester: { academicYear: { collegeId: dto.collegeId } },
        },
        select: { id: true },
      });
      const subIds = subjectsInCollege.map((s) => s.id);
      const accesses = await this.prisma.userAccess.findMany({
        where: { subjectId: { in: subIds }, revokedAt: null },
        select: { userId: true },
        distinct: ['userId'],
      });
      targetUserIds = accesses.map((a) => a.userId);
    } else if (dto.targetType === 'subject' && dto.subjectId) {
      targetLabel = 'مشتركي المادة';
      const accesses = await this.prisma.userAccess.findMany({
        where: { subjectId: dto.subjectId, revokedAt: null },
        select: { userId: true },
        distinct: ['userId'],
      });
      targetUserIds = accesses.map((a) => a.userId);
    } else {
      targetLabel = 'جميع الطلاب';
      const users = await this.prisma.user.findMany({
        where: { isActive: true, deletedAt: null },
        select: { id: true },
      });
      targetUserIds = users.map((u) => u.id);
    }

    if (targetUserIds.length === 0) {
      return { success: true, message: `لا يوجد مستخدمين مسجلين في الفئة المحددة (${targetLabel})`, count: 0 };
    }

    await this.prisma.notification.createMany({
      data: targetUserIds.map((uid) => ({
        userId: uid,
        type: notifType,
        title: dto.title.trim(),
        body: dto.body.trim(),
        metadata,
      })),
    });

    return {
      success: true,
      message: `تم إرسال الرسالة بنجاح إلى ${targetLabel} (${targetUserIds.length} مستخدم)`,
      count: targetUserIds.length,
    };
  }

  /**
   * Search users for direct messaging
   */
  async searchUsers(query?: string) {
    const where: any = { isActive: true, deletedAt: null };
    if (query?.trim()) {
      where.OR = [
        { firstName: { contains: query.trim(), mode: 'insensitive' } },
        { lastName:  { contains: query.trim(), mode: 'insensitive' } },
        { email:     { contains: query.trim(), mode: 'insensitive' } },
        { phone:     { contains: query.trim(), mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    return users;
  }

  /**
   * Get recent admin sent notifications
   */
  async getNotificationHistory() {
    const notifs = await this.prisma.notification.findMany({
      where: {
        metadata: {
          path: ['sender'],
          equals: 'ADMIN',
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return notifs;
  }

  /**
   * Submit a student/visitor contact message (strictly in-platform)
   */
  async submitContactMessage(dto: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
    userId?: string;
  }) {
    if (!dto.name?.trim() || !dto.message?.trim()) {
      throw new BadRequestException('الاسم والرسالة مطلوبان');
    }

    let linkedUserId = dto.userId || null;
    if (!linkedUserId && dto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email: { equals: dto.email.trim(), mode: 'insensitive' }, deletedAt: null },
      });
      if (existingUser) {
        linkedUserId = existingUser.id;
      }
    }

    const created = await this.prisma.contactMessage.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim(),
        phone: dto.phone?.trim() || null,
        subject: dto.subject?.trim() || 'استفسار من طالب',
        message: dto.message.trim(),
        userId: linkedUserId,
      },
    });

    return {
      success: true,
      message: 'تم إرسال رسالتك إلى إدارة المنصة بنجاح وسيتم الرد عليك عبر إشعارات المنصة.',
      id: created.id,
    };
  }

  /**
   * List contact messages with search and unread stats
   */
  async getContactMessages(page = 1, limit = 20, status?: 'all' | 'unread' | 'replied') {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status === 'unread') where.isRead = false;
    if (status === 'replied') where.reply = { not: null };

    const [total, unreadCount, messages] = await Promise.all([
      this.prisma.contactMessage.count(),
      this.prisma.contactMessage.count({ where: { isRead: false } }),
      this.prisma.contactMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      messages,
      unreadCount,
      total,
      page,
      limit,
    };
  }

  /**
   * Mark contact message as read
   */
  async markContactMessageAsRead(id: string) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Reply to contact message with in-platform notification to the student
   */
  async replyToContactMessage(id: string, adminId: string, replyText: string) {
    const msg = await this.prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!msg) {
      throw new NotFoundException('الرسالة غير موجودة');
    }

    if (!replyText?.trim()) {
      throw new BadRequestException('نص الرد مطلوب');
    }

    let targetUserId = msg.userId;
    if (!targetUserId && msg.email) {
      const foundUser = await this.prisma.user.findFirst({
        where: { email: { equals: msg.email.trim(), mode: 'insensitive' }, deletedAt: null },
      });
      if (foundUser) {
        targetUserId = foundUser.id;
      }
    }

    await this.prisma.contactMessage.update({
      where: { id },
      data: {
        reply: replyText.trim(),
        repliedAt: new Date(),
        isRead: true,
        ...(targetUserId && !msg.userId ? { userId: targetUserId } : {}),
      },
    });

    if (targetUserId) {
      await this.prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'SYSTEM',
          title: `رد من إدارة المنصة: ${msg.subject || 'بخصوص استفسارك'}`,
          body: replyText.trim(),
          metadata: {
            contactMessageId: msg.id,
            repliedBy: adminId,
            replyable: false,
          },
        },
      });
    }

    return {
      success: true,
      message: 'تم تسجيل الرد وإرسال إشعار للطالب داخل المنصة بنجاح',
    };
  }

  // ──────────────────────────────────────────────
  // PLATFORM SETTINGS
  // ──────────────────────────────────────────────

  /** GET /admin/settings — return all settings as key→value object */
  async getSettings(): Promise<Record<string, string>> {
    const rows = await this.prisma.setting.findMany();
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  /** PATCH /admin/settings — upsert a batch of key→value pairs */
  async upsertSettings(
    settings: Record<string, string>,
    adminId: string,
  ): Promise<{ success: boolean; updated: number }> {
    const entries = Object.entries(settings).filter(
      ([key]) => key && key.trim().length > 0,
    );

    await Promise.all(
      entries.map(([key, value]) =>
        this.prisma.setting.upsert({
          where: { key },
          create: { key, value, updatedBy: adminId },
          update: { value, updatedBy: adminId },
        }),
      ),
    );

    return { success: true, updated: entries.length };
  }
}

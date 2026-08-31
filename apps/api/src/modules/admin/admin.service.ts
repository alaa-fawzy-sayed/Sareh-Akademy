import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [usersCount, universitiesCount, subjectsCount, payments] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.university.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.subject.count({ where: { deletedAt: null } }),
      this.prisma.payment.findMany({
        where: { status: 'VERIFIED' },
        select: { amount: true },
      }),
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
}

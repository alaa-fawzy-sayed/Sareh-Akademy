import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { UserRole } from '@top-pharma/types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { search?: string; role?: string; isActive?: boolean; page?: number; limit?: number }) {
    const { search, role, isActive, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (role && role !== 'الكل') {
      where.userRoles = {
        some: {
          role: {
            name: role,
          },
        },
      };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
          _count: {
            select: {
              userAccess: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
        isActive: u.isActive,
        createdAt: u.createdAt,
        roles: u.userRoles.map((ur) => ur.role.name),
        subscriptionsCount: u._count.userAccess,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    return user;
  }

  async updateRole(id: string, roleName: string) {
    const user = await this.findOne(id);
    const targetRole = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!targetRole) throw new BadRequestException('الدور المحدد غير صالح');

    // Remove existing roles for this user
    await this.prisma.userRole_Assignment.deleteMany({ where: { userId: id } });

    // Assign new role
    return this.prisma.userRole_Assignment.create({
      data: {
        userId: id,
        roleId: targetRole.id,
      },
    });
  }

  async toggleStatus(id: string) {
    const user = await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

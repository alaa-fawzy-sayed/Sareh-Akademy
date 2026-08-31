import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface CreateAuditLogDto {
  actorId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an audit log entry in the database.
   */
  async log(data: CreateAuditLogDto) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          actorId: data.actorId || null,
          action: data.action,
          entityType: data.entityType || null,
          entityId: data.entityId || null,
          metadata: (data.metadata as any) || undefined,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
        },
      });
    } catch (error) {
      // Audit log failures should not crash the main business logic
      this.logger.error(`Failed to create audit log for action ${data.action}:`, error);
    }
  }

  /**
   * Retrieves paginated audit logs with optional filtering.
   */
  async findAll(query: {
    page?: number;
    limit?: number;
    actorId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (query.actorId) where.actorId = query.actorId;
    if (query.action) where.action = query.action;
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

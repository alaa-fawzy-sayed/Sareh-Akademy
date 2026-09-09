import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AccessSource } from '@top-pharma/types';

export interface GrantAccessDto {
  userId: string;
  subjectId?: string;
  contentId?: string;
  source?: AccessSource;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface ActivateCodeDto {
  code: string;
  userId: string;
}

@Injectable()
export class AccessService {
  private readonly logger = new Logger(AccessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Grant access to a subject or content item
   */
  async grantAccess(dto: GrantAccessDto, actorId: string) {
    if (!dto.subjectId && !dto.contentId) {
      throw new BadRequestException('Either subjectId or contentId must be provided');
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException(`User not found: ${dto.userId}`);

    // Verify subject/content exists
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: dto.subjectId, deletedAt: null },
      });
      if (!subject) throw new NotFoundException(`Subject not found: ${dto.subjectId}`);
    }

    if (dto.contentId) {
      const content = await this.prisma.content.findUnique({
        where: { id: dto.contentId, deletedAt: null },
      });
      if (!content) throw new NotFoundException(`Content not found: ${dto.contentId}`);
    }

    const access = await this.prisma.userAccess.create({
      data: {
        userId: dto.userId,
        subjectId: dto.subjectId ?? null,
        contentId: dto.contentId ?? null,
        source: (dto.source ?? AccessSource.ADMIN) as any,
        expiresAt: dto.expiresAt ?? null,
        grantedBy: actorId,
        metadata: dto.metadata as any,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        subject: { select: { id: true, nameAr: true, nameEn: true } },
      },
    });

    await this.auditService.log({
      actorId,
      action: 'access.grant',
      entityType: 'UserAccess',
      entityId: access.id,
      metadata: {
        targetUserId: dto.userId,
        subjectId: dto.subjectId,
        contentId: dto.contentId,
        source: dto.source,
      },
    });

    return access;
  }

  /**
   * Revoke an access entry
   */
  async revokeAccess(accessId: string, actorId: string) {
    const access = await this.prisma.userAccess.findUnique({
      where: { id: accessId },
    });

    if (!access) {
      throw new NotFoundException(`Access record not found: ${accessId}`);
    }

    if (access.revokedAt) {
      throw new BadRequestException('Access is already revoked');
    }

    const updated = await this.prisma.userAccess.update({
      where: { id: accessId },
      data: { revokedAt: new Date() },
    });

    await this.auditService.log({
      actorId,
      action: 'access.revoke',
      entityType: 'UserAccess',
      entityId: accessId,
      metadata: { targetUserId: access.userId },
    });

    return updated;
  }

  /**
   * Get all access records for a user
   */
  async getUserAccess(userId: string, query: { page?: number; limit?: number; includeRevoked?: boolean }) {
    const { page = 1, limit = 20, includeRevoked = false } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (!includeRevoked) {
      where.revokedAt = null;
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.userAccess.findMany({
        where,
        include: {
          subject: { select: { id: true, nameAr: true, nameEn: true, slug: true, thumbnailUrl: true } },
          content: { select: { id: true, titleAr: true, titleEn: true, type: true } },
        },
        orderBy: { grantedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userAccess.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get current user's own active access
   */
  async getMyAccess(userId: string) {
    return this.prisma.userAccess.findMany({
      where: {
        userId,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        subject: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            slug: true,
            thumbnailUrl: true,
            semester: {
              select: {
                nameAr: true,
                academicYear: {
                  select: {
                    nameAr: true,
                    college: { select: { nameAr: true, university: { select: { nameAr: true } } } },
                  },
                },
              },
            },
          },
        },
        content: { select: { id: true, titleAr: true, titleEn: true, type: true } },
      },
      orderBy: { grantedAt: 'desc' },
    });
  }

  /**
   * Check if a user has access to a specific subject
   */
  async checkAccess(userId: string, subjectId: string): Promise<boolean> {
    const access = await this.prisma.userAccess.findFirst({
      where: {
        userId,
        subjectId,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    return !!access;
  }

  /**
   * Activate an activation code to grant access
   */
  async activateCode(dto: ActivateCodeDto) {
    const codeRecord = await this.prisma.activationCode.findUnique({
      where: { code: dto.code },
    });

    if (!codeRecord) {
      throw new NotFoundException('Invalid activation code');
    }

    if (!codeRecord.isActive) {
      throw new BadRequestException('This activation code is no longer active');
    }

    if (codeRecord.expiresAt && codeRecord.expiresAt < new Date()) {
      throw new BadRequestException('This activation code has expired');
    }

    if (codeRecord.usedCount >= codeRecord.maxUses) {
      throw new BadRequestException('This activation code has reached its maximum uses');
    }

    // Check if user already used this code
    if (codeRecord.subjectId) {
      const alreadyHasAccess = await this.checkAccess(dto.userId, codeRecord.subjectId);
      if (alreadyHasAccess) {
        throw new BadRequestException('You already have access to this subject');
      }
    }

    // Grant access + increment usage in a transaction
    const [access] = await this.prisma.$transaction([
      this.prisma.userAccess.create({
        data: {
          userId: dto.userId,
          subjectId: codeRecord.subjectId ?? null,
          source: 'CODE' as any,
          grantedBy: null,
          metadata: { code: dto.code } as any,
        },
        include: {
          subject: { select: { id: true, nameAr: true, nameEn: true } },
        },
      }),
      this.prisma.activationCode.update({
        where: { id: codeRecord.id },
        data: { usedCount: { increment: 1 } },
      }),
    ]);

    await this.auditService.log({
      actorId: dto.userId,
      action: 'access.code_activated',
      entityType: 'UserAccess',
      entityId: access.id,
      metadata: { code: dto.code, subjectId: codeRecord.subjectId },
    });

    return access;
  }

  /**
   * List all access records — Admin
   */
  async findAll(query: {
    userId?: string;
    subjectId?: string;
    page?: number;
    limit?: number;
    includeRevoked?: boolean;
  }) {
    const { userId, subjectId, page = 1, limit = 20, includeRevoked = false } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (subjectId) where.subjectId = subjectId;
    if (!includeRevoked) {
      where.revokedAt = null;
    }

    const [data, total] = await Promise.all([
      this.prisma.userAccess.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          subject: { select: { id: true, nameAr: true, nameEn: true } },
          content: { select: { id: true, titleAr: true } },
        },
        orderBy: { grantedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userAccess.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}

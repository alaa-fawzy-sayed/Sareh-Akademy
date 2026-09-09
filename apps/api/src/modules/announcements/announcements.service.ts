import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface CreateAnnouncementDto {
  titleAr: string;
  titleEn?: string;
  bodyAr: string;
  bodyEn?: string;
  universityId?: string;
  collegeId?: string;
  isPublished?: boolean;
  publishAt?: Date;
  expiresAt?: Date;
}

export interface UpdateAnnouncementDto {
  titleAr?: string;
  titleEn?: string;
  bodyAr?: string;
  bodyEn?: string;
  universityId?: string;
  collegeId?: string;
  isPublished?: boolean;
  publishAt?: Date;
  expiresAt?: Date;
}

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Find announcements - public/student view or admin management
   */
  async findAll(query: {
    universityId?: string;
    collegeId?: string;
    isPublished?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      universityId,
      collegeId,
      isPublished,
      search,
      page = 1,
      limit = 20,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (isPublished !== undefined) {
      where.isPublished = isPublished;
      if (isPublished) {
        where.OR = [
          { publishAt: null },
          { publishAt: { lte: new Date() } },
        ];
        where.AND = [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        ];
      }
    }

    if (universityId) {
      // Include platform-wide (null) or specific university
      where.OR = [
        { universityId: null },
        { universityId },
      ];
    }

    if (collegeId) {
      where.OR = [
        { collegeId: null },
        { collegeId },
      ];
    }

    if (search) {
      where.OR = [
        { titleAr: { contains: search, mode: 'insensitive' } },
        { titleEn: { contains: search, mode: 'insensitive' } },
        { bodyAr: { contains: search, mode: 'insensitive' } },
        { bodyEn: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement not found: ${id}`);
    }

    return announcement;
  }

  async create(dto: CreateAnnouncementDto, actorId: string) {
    const announcement = await this.prisma.announcement.create({
      data: {
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        bodyAr: dto.bodyAr,
        bodyEn: dto.bodyEn,
        universityId: dto.universityId ?? null,
        collegeId: dto.collegeId ?? null,
        isPublished: dto.isPublished ?? true,
        publishAt: dto.publishAt ? new Date(dto.publishAt) : new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdBy: actorId,
      },
    });

    await this.auditService.log({
      actorId,
      action: 'announcement.create',
      entityType: 'Announcement',
      entityId: announcement.id,
      metadata: { titleAr: announcement.titleAr },
    });

    return announcement;
  }

  async update(id: string, dto: UpdateAnnouncementDto, actorId: string) {
    await this.findById(id);

    const announcement = await this.prisma.announcement.update({
      where: { id },
      data: {
        ...(dto.titleAr !== undefined && { titleAr: dto.titleAr }),
        ...(dto.titleEn !== undefined && { titleEn: dto.titleEn }),
        ...(dto.bodyAr !== undefined && { bodyAr: dto.bodyAr }),
        ...(dto.bodyEn !== undefined && { bodyEn: dto.bodyEn }),
        ...(dto.universityId !== undefined && { universityId: dto.universityId }),
        ...(dto.collegeId !== undefined && { collegeId: dto.collegeId }),
        ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
        ...(dto.publishAt !== undefined && { publishAt: dto.publishAt ? new Date(dto.publishAt) : null }),
        ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }),
      },
    });

    await this.auditService.log({
      actorId,
      action: 'announcement.update',
      entityType: 'Announcement',
      entityId: id,
      metadata: { changes: Object.keys(dto) },
    });

    return announcement;
  }

  async togglePublished(id: string, actorId: string) {
    const announcement = await this.findById(id);
    const updated = await this.prisma.announcement.update({
      where: { id },
      data: { isPublished: !announcement.isPublished },
    });

    await this.auditService.log({
      actorId,
      action: announcement.isPublished ? 'announcement.unpublish' : 'announcement.publish',
      entityType: 'Announcement',
      entityId: id,
    });

    return updated;
  }

  async remove(id: string, actorId: string) {
    await this.findById(id);

    await this.prisma.announcement.delete({
      where: { id },
    });

    await this.auditService.log({
      actorId,
      action: 'announcement.delete',
      entityType: 'Announcement',
      entityId: id,
    });

    return { message: 'Announcement deleted successfully' };
  }
}

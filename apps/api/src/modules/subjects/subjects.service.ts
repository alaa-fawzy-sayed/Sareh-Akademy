import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface CreateSubjectDto {
  nameAr: string;
  nameEn: string;
  slug: string;
  semesterId: string;
  isFree?: boolean;
  isPublished?: boolean;
  price?: number;
  description?: string;
  thumbnailUrl?: string;
  introVideoUrl?: string;
}

export interface UpdateSubjectDto {
  nameAr?: string;
  nameEn?: string;
  slug?: string;
  semesterId?: string;
  isFree?: boolean;
  isPublished?: boolean;
  price?: number;
  description?: string;
  thumbnailUrl?: string;
  introVideoUrl?: string;
}

@Injectable()
export class SubjectsService {
  private readonly logger = new Logger(SubjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * List all subjects with semester/academicYear/college included
   */
  async findAll(params?: {
    semesterId?: string;
    collegeId?: string;
    universityId?: string;
    isPublished?: boolean;
    isFree?: boolean;
    search?: string;
    limit?: number;
  }) {
    const where: Record<string, any> = { deletedAt: null };

    if (params?.semesterId) where.semesterId = params.semesterId;
    if (params?.isPublished !== undefined) where.isPublished = params.isPublished;
    if (params?.isFree !== undefined) where.isFree = params.isFree;

    // Filter by college: Subject → Semester → AcademicYear → College
    if (params?.collegeId) {
      where.semester = {
        academicYear: { collegeId: params.collegeId },
      };
    }

    // Filter by university: Subject → Semester → AcademicYear → College → University
    if (params?.universityId && !params?.collegeId) {
      where.semester = {
        academicYear: {
          college: { universityId: params.universityId },
        },
      };
    }

    if (params?.search) {
      where.OR = [
        { nameAr: { contains: params.search, mode: 'insensitive' } },
        { nameEn: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.subject.findMany({
      where,
      orderBy: [{ nameAr: 'asc' }],
      take: params?.limit ?? 200,
      include: {
        semester: {
          include: {
            academicYear: {
              include: {
                college: {
                  select: {
                    id: true,
                    nameAr: true,
                    slug: true,
                    universityId: true,
                    university: {
                      select: { id: true, nameAr: true, slug: true },
                    },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { chapters: true },
        },
      },
    });
  }

  /**
   * Get a single subject by ID or Slug with chapters and content
   */
  async findOne(idOrSlug: string) {
    let subject = await this.prisma.subject.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
        deletedAt: null,
      },
      include: {
        semester: {
          include: {
            academicYear: {
              include: {
                college: { include: { university: true } },
              },
            },
          },
        },
        chapters: {
          where: {},
          orderBy: { displayOrder: 'asc' },
          include: {
            contents: {
              where: { deletedAt: null, isPublished: true },
              orderBy: { displayOrder: 'asc' },
              select: {
                id: true,
                titleAr: true,
                titleEn: true,
                type: true,
                isFree: true,
                displayOrder: true,
                video: { select: { duration: true, viewCount: true } },
                file: { select: { fileType: true, originalName: true, downloadCount: true } },
              },
            },
          },
        },
      },
    });

    // Resilient fallback: search by partial slug or name
    if (!subject && idOrSlug) {
      subject = await this.prisma.subject.findFirst({
        where: {
          OR: [
            { slug: { contains: idOrSlug, mode: 'insensitive' } },
            { nameAr: { contains: idOrSlug, mode: 'insensitive' } },
            { nameEn: { contains: idOrSlug, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
        include: {
          semester: {
            include: {
              academicYear: {
                include: {
                  college: { include: { university: true } },
                },
              },
            },
          },
          chapters: {
            where: {},
            orderBy: { displayOrder: 'asc' },
            include: {
              contents: {
                where: { deletedAt: null, isPublished: true },
                orderBy: { displayOrder: 'asc' },
                select: {
                  id: true,
                  titleAr: true,
                  titleEn: true,
                  type: true,
                  isFree: true,
                  displayOrder: true,
                  video: { select: { duration: true, viewCount: true } },
                  file: { select: { fileType: true, originalName: true, downloadCount: true } },
                },
              },
            },
          },
        },
      });
    }

    if (!subject) {
      throw new NotFoundException(`Subject not found: ${idOrSlug}`);
    }

    return subject;
  }

  /**
   * Create a new subject
   */
  async create(dto: CreateSubjectDto, actorId?: string) {
    const subject = await this.prisma.subject.create({
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        slug: dto.slug,
        semesterId: dto.semesterId,
        isFree: dto.isFree ?? false,
        price: dto.price,
        description: dto.description,
        thumbnailUrl: dto.thumbnailUrl,
        introVideoUrl: dto.introVideoUrl,
        isPublished: dto.isPublished ?? true,
      },
    });

    if (actorId) {
      await this.auditService.log({
        actorId,
        action: 'subject.create',
        entityType: 'Subject',
        entityId: subject.id,
        metadata: { nameEn: subject.nameEn, slug: subject.slug },
      });
    }

    return subject;
  }

  /**
   * Update subject info
   */
  async update(id: string, dto: UpdateSubjectDto, actorId?: string) {
    const existing = await this.findOne(id);
    const updated = await this.prisma.subject.update({
      where: { id: existing.id },
      data: {
        ...(dto.nameAr !== undefined && { nameAr: dto.nameAr }),
        ...(dto.nameEn !== undefined && { nameEn: dto.nameEn }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.semesterId !== undefined && { semesterId: dto.semesterId }),
        ...(dto.isFree !== undefined && { isFree: dto.isFree }),
        ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.thumbnailUrl !== undefined && { thumbnailUrl: dto.thumbnailUrl }),
        ...(dto.introVideoUrl !== undefined && { introVideoUrl: dto.introVideoUrl }),
      },
    });

    if (actorId) {
      await this.auditService.log({
        actorId,
        action: 'subject.update',
        entityType: 'Subject',
        entityId: id,
        metadata: { changes: Object.keys(dto) },
      });
    }

    return updated;
  }

  /**
   * Soft-delete a subject
   */
  async remove(id: string, actorId?: string) {
    await this.findOne(id);
    const deleted = await this.prisma.subject.update({
      where: { id },
      data: { deletedAt: new Date(), isPublished: false },
    });

    if (actorId) {
      await this.auditService.log({
        actorId,
        action: 'subject.delete',
        entityType: 'Subject',
        entityId: id,
      });
    }

    return deleted;
  }

  /**
   * Toggle published status
   */
  async togglePublished(id: string, actorId?: string) {
    const subject = await this.findOne(id);
    const updated = await this.update(id, { isPublished: !subject.isPublished }, actorId);

    if (actorId) {
      await this.auditService.log({
        actorId,
        action: updated.isPublished ? 'subject.publish' : 'subject.unpublish',
        entityType: 'Subject',
        entityId: id,
      });
    }

    return updated;
  }

  /**
   * Get subjects the current user has access to
   */
  async getMySubjects(userId: string) {
    const accessList = await this.prisma.userAccess.findMany({
      where: {
        userId,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
        subjectId: { not: null },
      },
      include: {
        subject: {
          include: {
            semester: {
              include: {
                academicYear: {
                  include: {
                    college: {
                      include: { university: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return accessList.map((a) => a.subject);
  }
}

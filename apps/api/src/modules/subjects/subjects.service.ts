import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface CreateSubjectDto {
  nameAr: string;
  nameEn: string;
  slug: string;
  semesterId: string;
  isFree?: boolean;
  price?: number;
  description?: string;
  thumbnailUrl?: string;
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
}

@Injectable()
export class SubjectsService {
  private readonly logger = new Logger(SubjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all subjects with semester/academicYear/college included
   */
  async findAll(params?: {
    semesterId?: string;
    isPublished?: boolean;
    isFree?: boolean;
    search?: string;
  }) {
    const where: Record<string, any> = { deletedAt: null };

    if (params?.semesterId) where.semesterId = params.semesterId;
    if (params?.isPublished !== undefined) where.isPublished = params.isPublished;
    if (params?.isFree !== undefined) where.isFree = params.isFree;
    if (params?.search) {
      where.OR = [
        { nameAr: { contains: params.search } },
        { nameEn: { contains: params.search } },
      ];
    }

    return this.prisma.subject.findMany({
      where,
      orderBy: [{ nameAr: 'asc' }],
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
        _count: {
          select: { chapters: true },
        },
      },
    });
  }

  /**
   * Get a single subject by ID with chapters and content
   */
  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
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
              },
            },
          },
        },
      },
    });

    if (!subject || subject.deletedAt) {
      throw new NotFoundException(`Subject not found: ${id}`);
    }

    return subject;
  }

  /**
   * Create a new subject
   */
  async create(dto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        slug: dto.slug,
        semesterId: dto.semesterId,
        isFree: dto.isFree ?? false,
        price: dto.price,
        description: dto.description,
        thumbnailUrl: dto.thumbnailUrl,
        isPublished: true,
      },
    });
  }

  /**
   * Update subject info
   */
  async update(id: string, dto: UpdateSubjectDto) {
    await this.findOne(id);
    return this.prisma.subject.update({
      where: { id },
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
      },
    });
  }

  /**
   * Soft-delete a subject
   */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.subject.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Toggle published status
   */
  async togglePublished(id: string) {
    const subject = await this.findOne(id);
    return this.update(id, { isPublished: !subject.isPublished });
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

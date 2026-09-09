import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface CreateChapterDto {
  titleAr: string;
  titleEn?: string;
  subjectId: string;
  displayOrder?: number;
}

export interface UpdateChapterDto {
  titleAr?: string;
  titleEn?: string;
  displayOrder?: number;
}

@Injectable()
export class ChaptersService {
  private readonly logger = new Logger(ChaptersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: {
    subjectId?: string;
    includeContents?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { subjectId, includeContents = false, page = 1, limit = 100 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (subjectId) where.subjectId = subjectId;

    const [data, total] = await Promise.all([
      this.prisma.chapter.findMany({
        where,
        include: {
          subject: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
          _count: { select: { contents: true } },
          ...(includeContents && {
            contents: {
              where: { deletedAt: null },
              orderBy: { displayOrder: 'asc' },
              select: {
                id: true,
                titleAr: true,
                titleEn: true,
                type: true,
                isFree: true,
                isPublished: true,
                displayOrder: true,
              },
            },
          }),
        },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.chapter.count({ where }),
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

  async findById(id: string) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
        contents: {
          where: { deletedAt: null },
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            type: true,
            isFree: true,
            isPublished: true,
            displayOrder: true,
            createdAt: true,
            video: { select: { duration: true, viewCount: true } },
            file: { select: { fileType: true, originalName: true, downloadCount: true } },
          },
        },
        _count: { select: { contents: true } },
      },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter not found: ${id}`);
    }

    return chapter;
  }

  async create(dto: CreateChapterDto, actorId: string) {
    // Validate subject exists
    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId, deletedAt: null },
    });
    if (!subject) {
      throw new NotFoundException(`Subject not found: ${dto.subjectId}`);
    }

    // Auto-assign displayOrder if not provided
    let displayOrder = dto.displayOrder;
    if (displayOrder === undefined) {
      const lastChapter = await this.prisma.chapter.findFirst({
        where: { subjectId: dto.subjectId },
        orderBy: { displayOrder: 'desc' },
      });
      displayOrder = (lastChapter?.displayOrder ?? -1) + 1;
    }

    const chapter = await this.prisma.chapter.create({
      data: {
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        subjectId: dto.subjectId,
        displayOrder,
      },
      include: {
        subject: { select: { id: true, nameAr: true, nameEn: true } },
      },
    });

    await this.auditService.log({
      actorId,
      action: 'chapter.create',
      entityType: 'Chapter',
      entityId: chapter.id,
      metadata: { titleAr: chapter.titleAr, subjectId: chapter.subjectId },
    });

    return chapter;
  }

  async update(id: string, dto: UpdateChapterDto, actorId: string) {
    await this.findById(id);

    const chapter = await this.prisma.chapter.update({
      where: { id },
      data: {
        ...(dto.titleAr !== undefined && { titleAr: dto.titleAr }),
        ...(dto.titleEn !== undefined && { titleEn: dto.titleEn }),
        ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
      },
    });

    await this.auditService.log({
      actorId,
      action: 'chapter.update',
      entityType: 'Chapter',
      entityId: id,
      metadata: { changes: Object.keys(dto) },
    });

    return chapter;
  }

  async remove(id: string, actorId: string) {
    const chapter = await this.findById(id);

    if (chapter._count.contents > 0) {
      throw new ForbiddenException(
        'Cannot delete a chapter that has content. Delete all content items first.',
      );
    }

    await this.prisma.chapter.delete({ where: { id } });

    await this.auditService.log({
      actorId,
      action: 'chapter.delete',
      entityType: 'Chapter',
      entityId: id,
    });
  }

  async reorder(items: { id: string; displayOrder: number }[], actorId: string) {
    await Promise.all(
      items.map((item) =>
        this.prisma.chapter.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    );

    await this.auditService.log({
      actorId,
      action: 'chapter.reorder',
      entityType: 'Chapter',
      metadata: { count: items.length },
    });
  }
}

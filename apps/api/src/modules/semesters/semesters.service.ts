import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface CreateSemesterDto {
  nameAr: string;
  nameEn: string;
  academicYearId: string;
  displayOrder?: number;
}

export interface UpdateSemesterDto {
  nameAr?: string;
  nameEn?: string;
  displayOrder?: number;
}

@Injectable()
export class SemestersService {
  private readonly logger = new Logger(SemestersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: { academicYearId?: string; collegeId?: string; page?: number; limit?: number }) {
    const { academicYearId, collegeId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (academicYearId) where.academicYearId = academicYearId;
    if (collegeId) where.academicYear = { collegeId };

    const [data, total] = await Promise.all([
      this.prisma.semester.findMany({
        where,
        include: {
          academicYear: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
              college: {
                select: {
                  id: true,
                  nameAr: true,
                  nameEn: true,
                  university: { select: { id: true, nameAr: true, nameEn: true } },
                },
              },
            },
          },
          _count: { select: { subjects: true } },
        },
        orderBy: [{ displayOrder: 'asc' }, { nameAr: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.semester.count({ where }),
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
    const semester = await this.prisma.semester.findUnique({
      where: { id },
      include: {
        academicYear: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            college: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                university: { select: { id: true, nameAr: true, nameEn: true } },
              },
            },
          },
        },
        subjects: {
          where: { deletedAt: null },
          orderBy: { nameAr: 'asc' },
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            slug: true,
            isFree: true,
            isPublished: true,
            price: true,
            thumbnailUrl: true,
            _count: { select: { chapters: true } },
          },
        },
        _count: { select: { subjects: true } },
      },
    });

    if (!semester) {
      throw new NotFoundException(`Semester not found: ${id}`);
    }

    return semester;
  }

  async create(dto: CreateSemesterDto, actorId: string) {
    // Validate academic year exists
    const year = await this.prisma.academicYear.findUnique({
      where: { id: dto.academicYearId },
    });
    if (!year) {
      throw new NotFoundException(`Academic year not found: ${dto.academicYearId}`);
    }

    const semester = await this.prisma.semester.create({
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        academicYearId: dto.academicYearId,
        displayOrder: dto.displayOrder ?? 0,
      },
      include: {
        academicYear: { select: { id: true, nameAr: true, nameEn: true } },
      },
    });

    await this.auditService.log({
      actorId,
      action: 'semester.create',
      entityType: 'Semester',
      entityId: semester.id,
      metadata: { nameEn: semester.nameEn, academicYearId: semester.academicYearId },
    });

    return semester;
  }

  async update(id: string, dto: UpdateSemesterDto, actorId: string) {
    await this.findById(id);

    const semester = await this.prisma.semester.update({
      where: { id },
      data: {
        ...(dto.nameAr !== undefined && { nameAr: dto.nameAr }),
        ...(dto.nameEn !== undefined && { nameEn: dto.nameEn }),
        ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
      },
    });

    await this.auditService.log({
      actorId,
      action: 'semester.update',
      entityType: 'Semester',
      entityId: id,
      metadata: { changes: Object.keys(dto) },
    });

    return semester;
  }

  async remove(id: string, actorId: string) {
    const semester = await this.findById(id);

    // Guard: do not delete if subjects exist
    if (semester._count.subjects > 0) {
      throw new Error('Cannot delete a semester that has subjects. Remove or move subjects first.');
    }

    await this.prisma.semester.delete({ where: { id } });

    await this.auditService.log({
      actorId,
      action: 'semester.delete',
      entityType: 'Semester',
      entityId: id,
    });
  }

  async reorder(items: { id: string; displayOrder: number }[], actorId: string) {
    await Promise.all(
      items.map((item) =>
        this.prisma.semester.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    );

    await this.auditService.log({
      actorId,
      action: 'semester.reorder',
      entityType: 'Semester',
      metadata: { count: items.length },
    });
  }
}

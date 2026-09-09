import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface CreateAcademicYearDto {
  nameAr: string;
  nameEn: string;
  collegeId: string;
  displayOrder?: number;
}

export interface UpdateAcademicYearDto {
  nameAr?: string;
  nameEn?: string;
  displayOrder?: number;
}

@Injectable()
export class AcademicYearsService {
  private readonly logger = new Logger(AcademicYearsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: { collegeId?: string; page?: number; limit?: number }) {
    const { collegeId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (collegeId) where.collegeId = collegeId;

    const [data, total] = await Promise.all([
      this.prisma.academicYear.findMany({
        where,
        include: {
          college: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
              slug: true,
              university: { select: { id: true, nameAr: true, nameEn: true } },
            },
          },
          _count: { select: { semesters: true } },
        },
        orderBy: [{ displayOrder: 'asc' }, { nameAr: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.academicYear.count({ where }),
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
    const year = await this.prisma.academicYear.findUnique({
      where: { id },
      include: {
        college: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            slug: true,
            university: { select: { id: true, nameAr: true, nameEn: true } },
          },
        },
        semesters: {
          orderBy: { displayOrder: 'asc' },
          include: { _count: { select: { subjects: true } } },
        },
        _count: { select: { semesters: true } },
      },
    });

    if (!year) {
      throw new NotFoundException(`Academic year not found: ${id}`);
    }

    return year;
  }

  async create(dto: CreateAcademicYearDto, actorId: string) {
    // Validate college exists
    const college = await this.prisma.college.findUnique({
      where: { id: dto.collegeId, deletedAt: null },
    });
    if (!college) {
      throw new NotFoundException(`College not found: ${dto.collegeId}`);
    }

    const year = await this.prisma.academicYear.create({
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        collegeId: dto.collegeId,
        displayOrder: dto.displayOrder ?? 0,
      },
      include: {
        college: { select: { id: true, nameAr: true, nameEn: true } },
      },
    });

    await this.auditService.log({
      actorId,
      action: 'academic_year.create',
      entityType: 'AcademicYear',
      entityId: year.id,
      metadata: { nameEn: year.nameEn, collegeId: year.collegeId },
    });

    return year;
  }

  async update(id: string, dto: UpdateAcademicYearDto, actorId: string) {
    await this.findById(id);

    const year = await this.prisma.academicYear.update({
      where: { id },
      data: {
        ...(dto.nameAr !== undefined && { nameAr: dto.nameAr }),
        ...(dto.nameEn !== undefined && { nameEn: dto.nameEn }),
        ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
      },
    });

    await this.auditService.log({
      actorId,
      action: 'academic_year.update',
      entityType: 'AcademicYear',
      entityId: id,
      metadata: { changes: Object.keys(dto) },
    });

    return year;
  }

  async remove(id: string, actorId: string) {
    // Check if any subjects exist under this year (via semesters)
    const semestersWithSubjects = await this.prisma.semester.findFirst({
      where: {
        academicYearId: id,
        subjects: { some: { deletedAt: null } },
      },
    });

    if (semestersWithSubjects) {
      throw new Error('Cannot delete academic year with active subjects under it');
    }

    await this.prisma.academicYear.delete({ where: { id } });

    await this.auditService.log({
      actorId,
      action: 'academic_year.delete',
      entityType: 'AcademicYear',
      entityId: id,
    });
  }

  async reorder(items: { id: string; displayOrder: number }[], actorId: string) {
    await Promise.all(
      items.map((item) =>
        this.prisma.academicYear.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    );

    await this.auditService.log({
      actorId,
      action: 'academic_year.reorder',
      entityType: 'AcademicYear',
      metadata: { count: items.length },
    });
  }
}

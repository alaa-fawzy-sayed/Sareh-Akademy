import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface CreateTeacherDto {
  nameAr: string;
  nameEn: string;
  bio?: string;
  academicTitle?: string;
  avatarUrl?: string;
  isActive?: boolean;
  userId?: string; // Optional linked user account
}

export interface UpdateTeacherDto {
  nameAr?: string;
  nameEn?: string;
  bio?: string;
  academicTitle?: string;
  avatarUrl?: string;
  isActive?: boolean;
  userId?: string | null;
}

@Injectable()
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    includeDeleted?: boolean;
  }) {
    const {
      search,
      isActive,
      page = 1,
      limit = 20,
      includeDeleted = false,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: includeDeleted ? undefined : null,
    };

    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { academicTitle: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          _count: { select: { subjects: true } },
        },
        orderBy: [{ nameAr: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.teacher.count({ where }),
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
    const teacher = await this.prisma.teacher.findUnique({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } },
        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                slug: true,
                thumbnailUrl: true,
                isPublished: true,
              },
            },
          },
        },
        _count: { select: { subjects: true } },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher not found: ${id}`);
    }

    return teacher;
  }

  async create(dto: CreateTeacherDto, actorId: string) {
    // If linking to a user, check for duplicates
    if (dto.userId) {
      const existing = await this.prisma.teacher.findUnique({
        where: { userId: dto.userId },
      });
      if (existing) {
        throw new ConflictException(`User ${dto.userId} is already linked to a teacher profile`);
      }
    }

    const teacher = await this.prisma.teacher.create({
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        bio: dto.bio,
        academicTitle: dto.academicTitle,
        avatarUrl: dto.avatarUrl,
        isActive: dto.isActive ?? true,
        userId: dto.userId ?? null,
      },
    });

    await this.auditService.log({
      actorId,
      action: 'teacher.create',
      entityType: 'Teacher',
      entityId: teacher.id,
      metadata: { nameEn: teacher.nameEn },
    });

    return teacher;
  }

  async update(id: string, dto: UpdateTeacherDto, actorId: string) {
    await this.findById(id);

    const teacher = await this.prisma.teacher.update({
      where: { id },
      data: {
        ...(dto.nameAr !== undefined && { nameAr: dto.nameAr }),
        ...(dto.nameEn !== undefined && { nameEn: dto.nameEn }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.academicTitle !== undefined && { academicTitle: dto.academicTitle }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.userId !== undefined && { userId: dto.userId }),
      },
    });

    await this.auditService.log({
      actorId,
      action: 'teacher.update',
      entityType: 'Teacher',
      entityId: id,
      metadata: { changes: Object.keys(dto) },
    });

    return teacher;
  }

  async toggleActive(id: string, actorId: string) {
    const teacher = await this.findById(id);
    const updated = await this.prisma.teacher.update({
      where: { id },
      data: { isActive: !teacher.isActive },
    });

    await this.auditService.log({
      actorId,
      action: teacher.isActive ? 'teacher.disable' : 'teacher.enable',
      entityType: 'Teacher',
      entityId: id,
    });

    return updated;
  }

  async softDelete(id: string, actorId: string) {
    await this.findById(id);
    const teacher = await this.prisma.teacher.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.auditService.log({
      actorId,
      action: 'teacher.delete',
      entityType: 'Teacher',
      entityId: id,
    });

    return teacher;
  }

  async assignSubject(teacherId: string, subjectId: string, actorId: string) {
    await this.findById(teacherId);

    // Validate subject
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId, deletedAt: null },
    });
    if (!subject) {
      throw new NotFoundException(`Subject not found: ${subjectId}`);
    }

    // Upsert the assignment (idempotent)
    await this.prisma.subjectTeacher.upsert({
      where: { subjectId_teacherId: { subjectId, teacherId } },
      update: {},
      create: { subjectId, teacherId },
    });

    await this.auditService.log({
      actorId,
      action: 'teacher.assign_subject',
      entityType: 'Teacher',
      entityId: teacherId,
      metadata: { subjectId },
    });

    return { message: 'Subject assigned successfully' };
  }

  async unassignSubject(teacherId: string, subjectId: string, actorId: string) {
    await this.findById(teacherId);

    await this.prisma.subjectTeacher.deleteMany({
      where: { subjectId, teacherId },
    });

    await this.auditService.log({
      actorId,
      action: 'teacher.unassign_subject',
      entityType: 'Teacher',
      entityId: teacherId,
      metadata: { subjectId },
    });

    return { message: 'Subject unassigned successfully' };
  }
}

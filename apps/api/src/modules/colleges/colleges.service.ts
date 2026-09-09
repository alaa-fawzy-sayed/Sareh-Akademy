import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface CreateCollegeDto {
  nameAr: string;
  nameEn: string;
  slug: string;
  universityId: string;
  description?: string;
  logoUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCollegeDto {
  nameAr?: string;
  nameEn?: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}

@Injectable()
export class CollegesService {
  private readonly logger = new Logger(CollegesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: {
    universityId?: string;
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    includeDeleted?: boolean;
  }) {
    const {
      universityId,
      search,
      isActive,
      page = 1,
      limit = 50,
      includeDeleted = false,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: includeDeleted ? undefined : null,
      university: {
        deletedAt: null,
      },
    };

    if (universityId) where.universityId = universityId;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.college.findMany({
        where,
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          slug: true,
          description: true,
          logoUrl: true,
          displayOrder: true,
          isActive: true,
          universityId: true,
          university: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
          _count: { select: { academicYears: true } },
        },
        orderBy: [{ displayOrder: 'asc' }, { nameAr: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.college.count({ where }),
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
    const college = await this.prisma.college.findUnique({
      where: { id, deletedAt: null },
      include: {
        university: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
        academicYears: {
          where: {},
          orderBy: { displayOrder: 'asc' },
          include: {
            _count: { select: { semesters: true } },
          },
        },
        _count: { select: { academicYears: true } },
      },
    });

    if (!college) {
      throw new NotFoundException(`College not found: ${id}`);
    }

    return college;
  }

  async findBySlug(slug: string) {
    const college = await this.prisma.college.findUnique({
      where: { slug, deletedAt: null },
      include: {
        university: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
        academicYears: {
          orderBy: { displayOrder: 'asc' },
          include: {
            semesters: {
              orderBy: { displayOrder: 'asc' },
              include: { _count: { select: { subjects: true } } },
            },
          },
        },
      },
    });

    if (!college) {
      throw new NotFoundException(`College "${slug}" not found`);
    }

    return college;
  }

  async create(dto: CreateCollegeDto, actorId: string) {
    const existing = await this.prisma.college.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`A college with slug "${dto.slug}" already exists`);
    }

    const college = await this.prisma.college.create({
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        slug: dto.slug,
        universityId: dto.universityId,
        description: dto.description,
        logoUrl: dto.logoUrl,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: {
        university: { select: { id: true, nameAr: true, nameEn: true } },
      },
    });

    await this.auditService.log({
      actorId,
      action: 'college.create',
      entityType: 'College',
      entityId: college.id,
      metadata: { nameEn: college.nameEn, slug: college.slug, universityId: college.universityId },
    });

    return college;
  }

  async update(id: string, dto: UpdateCollegeDto, actorId: string) {
    await this.findById(id);

    if (dto.slug) {
      const existing = await this.prisma.college.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Slug "${dto.slug}" is already taken`);
      }
    }

    const college = await this.prisma.college.update({
      where: { id },
      data: {
        ...(dto.nameAr !== undefined && { nameAr: dto.nameAr }),
        ...(dto.nameEn !== undefined && { nameEn: dto.nameEn }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    await this.auditService.log({
      actorId,
      action: 'college.update',
      entityType: 'College',
      entityId: id,
      metadata: { changes: Object.keys(dto) },
    });

    return college;
  }

  async toggleActive(id: string, actorId: string) {
    const college = await this.findById(id);
    const updated = await this.prisma.college.update({
      where: { id },
      data: { isActive: !college.isActive },
    });

    await this.auditService.log({
      actorId,
      action: college.isActive ? 'college.disable' : 'college.enable',
      entityType: 'College',
      entityId: id,
    });

    return updated;
  }

  async softDelete(id: string, actorId: string) {
    await this.findById(id);

    const college = await this.prisma.college.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.auditService.log({
      actorId,
      action: 'college.delete',
      entityType: 'College',
      entityId: id,
    });

    return college;
  }

  async reorder(items: { id: string; displayOrder: number }[], actorId: string) {
    await Promise.all(
      items.map((item) =>
        this.prisma.college.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    );

    await this.auditService.log({
      actorId,
      action: 'college.reorder',
      entityType: 'College',
      metadata: { count: items.length },
    });
  }
}

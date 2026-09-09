import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUniversityDto, UpdateUniversityDto } from '@top-pharma/validation';

@Injectable()
export class UniversitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    includeDeleted?: boolean;
  }) {
    const { page = 1, limit = 20, search, isActive, includeDeleted = false } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: includeDeleted ? undefined : null,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.university.findMany({
        where,
        include: {
          _count: { select: { colleges: true } },
        },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.university.count({ where }),
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

  async findBySlug(slug: string) {
    const university = await this.prisma.university.findUnique({
      where: { slug, deletedAt: null },
      include: {
        colleges: {
          where: { isActive: true, deletedAt: null },
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            slug: true,

            description: true,
            logoUrl: true,
            displayOrder: true,
            _count: {
              select: {
                academicYears: true,
              },
            },
          },
        },
        _count: { select: { colleges: true } },
      },
    });


    if (!university) {
      throw new NotFoundException(`University "${slug}" not found`);
    }

    return university;
  }

  async findById(id: string) {
    const university = await this.prisma.university.findUnique({
      where: { id, deletedAt: null },
    });

    if (!university) {
      throw new NotFoundException('University not found');
    }

    return university;
  }

  async create(dto: CreateUniversityDto, actorId: string) {
    const existing = await this.prisma.university.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`A university with slug "${dto.slug}" already exists`);
    }

    const university = await this.prisma.university.create({
      data: {
        slug: dto.slug,
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        description: dto.description,
        location: dto.location,
        website: dto.website || null,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
        metadata: dto.metadata as any,
      },
    });

    await this.auditService.log({
      actorId,
      action: 'university.create',
      entityType: 'University',
      entityId: university.id,
      metadata: { nameEn: university.nameEn, slug: university.slug },
    });

    return university;
  }

  async update(id: string, dto: UpdateUniversityDto, actorId: string) {
    await this.findById(id);

    if (dto.slug) {
      const existing = await this.prisma.university.findUnique({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Slug "${dto.slug}" is already taken`);
      }
    }

    const university = await this.prisma.university.update({
      where: { id },
      data: {
        slug: dto.slug,
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        description: dto.description,
        location: dto.location,
        website: dto.website,
        displayOrder: dto.displayOrder,
        isActive: dto.isActive,
        metadata: dto.metadata as any,
      },
    });

    await this.auditService.log({
      actorId,
      action: 'university.update',
      entityType: 'University',
      entityId: id,
      metadata: { changes: Object.keys(dto) },
    });

    return university;
  }

  async updateLogo(id: string, logoUrl: string, actorId: string) {
    await this.findById(id);
    return this.prisma.university.update({
      where: { id },
      data: { logoUrl },
    });
  }

  async updateCover(id: string, coverUrl: string, actorId: string) {
    await this.findById(id);
    return this.prisma.university.update({
      where: { id },
      data: { coverUrl },
    });
  }

  async toggleActive(id: string, actorId: string) {
    const university = await this.findById(id);
    const updated = await this.prisma.university.update({
      where: { id },
      data: { isActive: !university.isActive },
    });

    await this.auditService.log({
      actorId,
      action: university.isActive ? 'university.disable' : 'university.enable',
      entityType: 'University',
      entityId: id,
    });

    return updated;
  }

  async softDelete(id: string, actorId: string) {
    await this.findById(id);

    const university = await this.prisma.university.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.auditService.log({
      actorId,
      action: 'university.delete',
      entityType: 'University',
      entityId: id,
    });

    return university;
  }

  async reorder(items: { id: string; displayOrder: number }[], actorId: string) {
    await Promise.all(
      items.map((item) =>
        this.prisma.university.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    );

    await this.auditService.log({
      actorId,
      action: 'university.reorder',
      entityType: 'University',
      metadata: { count: items.length },
    });
  }
}

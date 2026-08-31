import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface SearchQueryDto {
  q: string;
  type?: 'all' | 'subjects' | 'universities' | 'colleges' | 'teachers' | 'content';
  page?: number;
  limit?: number;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: SearchQueryDto) {
    const { q, type = 'all', page = 1, limit = 20 } = params;
    const query = q?.trim();

    if (!query) {
      return {
        results: {
          subjects: [],
          universities: [],
          colleges: [],
          teachers: [],
          content: [],
        },
        meta: { query: '', total: 0 },
      };
    }

    const skip = (page - 1) * limit;

    const shouldSearch = (targetType: string) =>
      type === 'all' || type === targetType;

    const [subjects, universities, colleges, teachers, content] = await Promise.all([
      // 1. Subjects
      shouldSearch('subjects')
        ? this.prisma.subject.findMany({
            where: {
              isPublished: true,
              deletedAt: null,
              OR: [
                { nameAr: { contains: query, mode: 'insensitive' } },
                { nameEn: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { slug: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: limit,
            skip: type === 'subjects' ? skip : 0,
            include: {
              semester: {
                include: {
                  academicYear: {
                    include: {
                      college: {
                        include: {
                          university: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          })
        : Promise.resolve([]),

      // 2. Universities
      shouldSearch('universities')
        ? this.prisma.university.findMany({
            where: {
              isActive: true,
              deletedAt: null,
              OR: [
                { nameAr: { contains: query, mode: 'insensitive' } },
                { nameEn: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { location: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: limit,
            skip: type === 'universities' ? skip : 0,
          })
        : Promise.resolve([]),

      // 3. Colleges
      shouldSearch('colleges')
        ? this.prisma.college.findMany({
            where: {
              isActive: true,
              deletedAt: null,
              OR: [
                { nameAr: { contains: query, mode: 'insensitive' } },
                { nameEn: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: limit,
            skip: type === 'colleges' ? skip : 0,
            include: {
              university: true,
            },
          })
        : Promise.resolve([]),

      // 4. Teachers
      shouldSearch('teachers')
        ? this.prisma.teacher.findMany({
            where: {
              isActive: true,
              deletedAt: null,
              OR: [
                { nameAr: { contains: query, mode: 'insensitive' } },
                { nameEn: { contains: query, mode: 'insensitive' } },
                { bio: { contains: query, mode: 'insensitive' } },
                { academicTitle: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: limit,
            skip: type === 'teachers' ? skip : 0,
          })
        : Promise.resolve([]),

      // 5. Content (Videos, PDFs, etc.)
      shouldSearch('content')
        ? this.prisma.content.findMany({
            where: {
              isPublished: true,
              deletedAt: null,
              OR: [
                { titleAr: { contains: query, mode: 'insensitive' } },
                { titleEn: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: limit,
            skip: type === 'content' ? skip : 0,
            include: {
              chapter: {
                include: {
                  subject: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const total =
      subjects.length +
      universities.length +
      colleges.length +
      teachers.length +
      content.length;

    return {
      results: {
        subjects,
        universities,
        colleges,
        teachers,
        content,
      },
      meta: {
        query,
        type,
        page,
        limit,
        total,
      },
    };
  }
}

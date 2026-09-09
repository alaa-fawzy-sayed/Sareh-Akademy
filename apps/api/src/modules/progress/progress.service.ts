import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface UpsertProgressDto {
  contentId: string;
  position?: number;  // seconds
  completed?: boolean;
}

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upsert progress for a content item (called while watching/reading)
   */
  async upsertProgress(userId: string, dto: UpsertProgressDto) {
    return this.prisma.userProgress.upsert({
      where: {
        userId_contentId: { userId, contentId: dto.contentId },
      },
      update: {
        position: dto.position ?? 0,
        completed: dto.completed ?? false,
        lastWatched: new Date(),
      },
      create: {
        userId,
        contentId: dto.contentId,
        position: dto.position ?? 0,
        completed: dto.completed ?? false,
        lastWatched: new Date(),
      },
    });
  }

  /**
   * Get progress for the current user — optionally filtered by subject
   */
  async getMyProgress(userId: string, query: { subjectId?: string }) {
    const where: any = { userId };

    if (query.subjectId) {
      // Filter to contents belonging to chapters of this subject
      where.content = {
        deletedAt: null,
        chapter: { subjectId: query.subjectId },
      };
    }

    const progress = await this.prisma.userProgress.findMany({
      where,
      include: {
        content: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            type: true,
            isFree: true,
            chapter: {
              select: {
                id: true,
                titleAr: true,
                subjectId: true,
              },
            },
          },
        },
      },
      orderBy: { lastWatched: 'desc' },
    });

    // Compute completion stats per subject if subjectId provided
    const total = progress.length;
    const completed = progress.filter((p) => p.completed).length;

    return {
      data: progress,
      stats: {
        total,
        completed,
        inProgress: total - completed,
        completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    };
  }

  /**
   * Record a watch history entry (append-only)
   */
  async recordWatch(userId: string, contentId: string) {
    return this.prisma.watchHistory.create({
      data: { userId, contentId },
    });
  }

  /**
   * Get recent watch history for a user
   */
  async getWatchHistory(userId: string, limit = 20) {
    return this.prisma.watchHistory.findMany({
      where: { userId },
      include: {
        content: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            type: true,
            chapter: {
              select: {
                id: true,
                titleAr: true,
                subject: {
                  select: { id: true, nameAr: true, nameEn: true, slug: true, thumbnailUrl: true },
                },
              },
            },
          },
        },
      },
      orderBy: { watchedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Admin: get progress stats for a subject (for analytics)
   */
  async getSubjectProgressStats(subjectId: string) {
    const contents = await this.prisma.content.findMany({
      where: {
        deletedAt: null,
        chapter: { subjectId },
      },
      select: { id: true },
    });

    const contentIds = contents.map((c) => c.id);

    const [totalViews, uniqueStudents, completions] = await Promise.all([
      this.prisma.userProgress.count({
        where: { contentId: { in: contentIds } },
      }),
      this.prisma.userProgress.groupBy({
        by: ['userId'],
        where: { contentId: { in: contentIds } },
      }),
      this.prisma.userProgress.count({
        where: { contentId: { in: contentIds }, completed: true },
      }),
    ]);

    return {
      subjectId,
      contentCount: contentIds.length,
      totalProgressRecords: totalViews,
      uniqueStudents: uniqueStudents.length,
      totalCompletions: completions,
    };
  }
}

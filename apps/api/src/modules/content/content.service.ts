import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { VideoProcessingService } from '../../infrastructure/video/video-processing.service';
import { ContentType, FileType } from '@top-pharma/types';

export interface CreateVideoContentDto {
  chapterId: string;
  titleAr: string;
  titleEn?: string;
  description?: string;
  displayOrder?: number;
  isFree?: boolean;
  isPublished?: boolean;
  duration?: number;
}

export interface CreateFileContentDto {
  chapterId: string;
  titleAr: string;
  titleEn?: string;
  description?: string;
  displayOrder?: number;
  isFree?: boolean;
  isPublished?: boolean;
  fileType?: FileType;
}

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly videoProcessingService: VideoProcessingService,
  ) {}

  /**
   * Upload video and create Video Content record + trigger background transcoding
   */
  async createVideoContent(
    dto: CreateVideoContentDto,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
  ) {
    const uploadResult = await this.storageService.uploadVideo(
      fileBuffer,
      originalName,
      mimeType,
      'videos/originals',
    );

    const content = await this.prisma.content.create({
      data: {
        chapterId: dto.chapterId,
        type: ContentType.VIDEO as any,
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        description: dto.description,
        displayOrder: dto.displayOrder ?? 0,
        isFree: dto.isFree ?? false,
        isPublished: dto.isPublished ?? true,
        video: {
          create: {
            storageKey: uploadResult.key,
            duration: dto.duration,
          },
        },
      },
      include: {
        video: true,
      },
    });

    if (content.video) {
      // Trigger transcoding asynchronously (non-blocking)
      this.videoProcessingService
        .processVideo(content.video.id, uploadResult.key)
        .catch((err) =>
          this.logger.error(`Video transcoding trigger error: ${err.message}`),
        );
    }

    return content;
  }

  /**
   * Upload file document and create File Content record
   */
  async createFileContent(
    dto: CreateFileContentDto,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
  ) {
    const uploadResult = await this.storageService.uploadDocument(
      fileBuffer,
      originalName,
      mimeType,
      'documents',
    );

    return this.prisma.content.create({
      data: {
        chapterId: dto.chapterId,
        type: ContentType.FILE as any,
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        description: dto.description,
        displayOrder: dto.displayOrder ?? 0,
        isFree: dto.isFree ?? false,
        isPublished: dto.isPublished ?? true,
        file: {
          create: {
            storageKey: uploadResult.key,
            originalName,
            mimeType,
            sizeBytes: BigInt(fileBuffer.length),
            fileType: (dto.fileType || FileType.OTHER) as any,
          },
        },
      },
      include: {
        file: true,
      },
    });
  }

  /**
   * Get content item details with signed URLs (if user has access or content is free)
   */
  async getContentById(contentId: string, userId?: string, roles: string[] = []) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      include: {
        chapter: {
          include: {
            subject: true,
          },
        },
        video: true,
        file: true,
        quiz: {
          include: {
            questions: {
              include: {
                answers: true,
              },
            },
          },
        },
      },
    });

    if (!content || content.deletedAt) {
      throw new NotFoundException('Content not found');
    }

    const isStaff = roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER', 'TEACHER'].includes(r),
    );

    if (!content.isPublished && !isStaff) {
      throw new NotFoundException('Content is not published');
    }

    // Check Access: isFree vs UserAccess
    let hasAccess = content.isFree || content.chapter.subject.isFree || isStaff;

    if (!hasAccess && userId) {
      const access = await this.prisma.userAccess.findFirst({
        where: {
          userId,
          revokedAt: null,
          OR: [
            { subjectId: content.chapter.subjectId },
            { contentId: content.id },
          ],
          AND: [
            {
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
              ],
            },
          ],
        },
      });

      if (access) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return {
        id: content.id,
        titleAr: content.titleAr,
        titleEn: content.titleEn,
        type: content.type,
        isFree: false,
        requiresPurchase: true,
        subjectId: content.chapter.subjectId,
        subjectPrice: content.chapter.subject.price,
      };
    }

    // If Video, generate signed playback URL and quality URLs
    let playbackUrl: string | undefined;
    let qualityUrls: Array<{ label: string; url: string }> = [];

    if (content.video) {
      playbackUrl = await this.storageService.getSignedUrl(
        content.video.storageKey,
        7200, // 2 hours
      );

      if (Array.isArray(content.video.qualities)) {
        for (const q of content.video.qualities as Array<{ label: string; storageKey: string }>) {
          if (q.storageKey) {
            const qSigned = await this.storageService.getSignedUrl(q.storageKey, 7200);
            qualityUrls.push({ label: q.label, url: qSigned });
          }
        }
      }

      // Increment view count asynchronously
      this.prisma.video
        .update({
          where: { id: content.video.id },
          data: { viewCount: { increment: 1 } },
        })
        .catch(() => {});
    }

    // If File, generate signed download URL
    let downloadUrl: string | undefined;
    if (content.file) {
      downloadUrl = await this.storageService.getSignedUrl(
        content.file.storageKey,
        3600,
      );

      this.prisma.file
        .update({
          where: { id: content.file.id },
          data: { downloadCount: { increment: 1 } },
        })
        .catch(() => {});
    }

    return {
      ...content,
      playbackUrl,
      qualityUrls: qualityUrls.length > 0 ? qualityUrls : undefined,
      downloadUrl,
    };
  }
}

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
   * Create content directly (URL video, link, or document)
   */
  async createContentDirect(dto: {
    chapterId: string;
    type: ContentType;
    titleAr: string;
    titleEn?: string;
    description?: string;
    displayOrder?: number;
    isFree?: boolean;
    isPublished?: boolean;
    videoUrl?: string;
    duration?: number;
    fileUrl?: string;
    originalName?: string;
    fileType?: FileType;
    passingScore?: number;
    timeLimitMinutes?: number;
    questions?: Array<{
      text: string;
      explanation?: string;
      points?: number;
      answers: Array<{
        text: string;
        isCorrect: boolean;
      }>;
    }>;
  }) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: dto.chapterId },
    });
    if (!chapter) throw new NotFoundException('Chapter not found');

    const content = await this.prisma.content.create({
      data: {
        chapterId: dto.chapterId,
        type: dto.type as any,
        titleAr: dto.titleAr,
        titleEn: dto.titleEn,
        description: dto.description,
        displayOrder: dto.displayOrder ?? 0,
        isFree: dto.isFree ?? false,
        isPublished: dto.isPublished ?? true,
        ...(dto.type === ContentType.VIDEO && dto.videoUrl && {
          video: {
            create: {
              storageKey: dto.videoUrl,
              duration: dto.duration,
            },
          },
        }),
        ...(dto.type === ContentType.FILE && dto.fileUrl && {
          file: {
            create: {
              storageKey: dto.fileUrl,
              originalName: dto.originalName || `${dto.titleAr}.pdf`,
              fileType: dto.fileType || (FileType.PDF as any),
              mimeType: 'application/pdf',
              sizeBytes: BigInt(1024 * 1024),
            },
          },
        }),
        ...(dto.type === ContentType.QUIZ && {
          quiz: {
            create: {
              passingScore: dto.passingScore ?? 60,
              timeLimitMinutes: dto.timeLimitMinutes ?? 15,
              ...(Array.isArray(dto.questions) && dto.questions.length > 0 && {
                questions: {
                  create: dto.questions.map((q, qIdx) => ({
                    text: q.text,
                    explanation: q.explanation || null,
                    displayOrder: qIdx + 1,
                    points: q.points ?? 1,
                    answers: {
                      create: (q.answers || []).map((a, aIdx) => ({
                        text: a.text,
                        isCorrect: Boolean(a.isCorrect),
                        displayOrder: aIdx + 1,
                      })),
                    },
                  })),
                },
              }),
            },
          },
        }),
      },
      include: {
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

    return content;
  }

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
      const sKey = content.video.storageKey;
      if (sKey?.startsWith('http://') || sKey?.startsWith('https://')) {
        playbackUrl = sKey;
      } else if (sKey) {
        playbackUrl = await this.storageService.getSignedUrl(sKey, 7200); // 2 hours
      }

      if (Array.isArray(content.video.qualities)) {
        for (const q of content.video.qualities as Array<{ label: string; storageKey: string }>) {
          if (q.storageKey) {
            const qSigned = q.storageKey.startsWith('http')
              ? q.storageKey
              : await this.storageService.getSignedUrl(q.storageKey, 7200);
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
      const fKey = content.file.storageKey;
      if (fKey?.startsWith('http://') || fKey?.startsWith('https://')) {
        downloadUrl = fKey;
      } else if (fKey) {
        downloadUrl = await this.storageService.getSignedUrl(fKey, 3600);
      }

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

  /**
   * Submit and grade a quiz attempt for an authenticated student
   */
  async submitQuizAttempt(
    quizId: string,
    userId: string,
    submittedAnswers: Array<{ questionId: string; answerId: string }>,
  ) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        content: true,
        questions: {
          include: {
            answers: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Map submitted answers by questionId
    const answerMap = new Map<string, string>();
    for (const a of submittedAnswers) {
      answerMap.set(a.questionId, a.answerId);
    }

    let score = 0;
    let maxScore = 0;
    const evaluatedResults: any[] = [];

    for (const q of quiz.questions) {
      const qPoints = q.points ?? 1;
      maxScore += qPoints;

      const chosenAnswerId = answerMap.get(q.id);
      const correctAnswer = q.answers.find((ans) => ans.isCorrect);
      const chosenAnswer = q.answers.find((ans) => ans.id === chosenAnswerId);
      const isCorrect = chosenAnswer?.isCorrect ?? false;

      if (isCorrect) {
        score += qPoints;
      }

      evaluatedResults.push({
        questionId: q.id,
        questionText: q.text,
        explanation: q.explanation,
        points: qPoints,
        earnedPoints: isCorrect ? qPoints : 0,
        userAnswerId: chosenAnswerId ?? null,
        userAnswerText: chosenAnswer?.text ?? null,
        correctAnswerId: correctAnswer?.id ?? null,
        correctAnswerText: correctAnswer?.text ?? null,
        isCorrect,
        answers: q.answers.map((ans) => ({
          id: ans.id,
          text: ans.text,
          isCorrect: ans.isCorrect,
          explanation: ans.explanation,
        })),
      });
    }

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const passed = percentage >= (quiz.passingScore ?? 60);

    // Save attempt record
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId,
        score,
        maxScore,
        percentage,
        passed,
        answers: evaluatedResults.map((r) => ({
          questionId: r.questionId,
          answerId: r.userAnswerId,
          isCorrect: r.isCorrect,
        })),
        completedAt: new Date(),
      },
    });

    // Update student progress for this content
    if (quiz.contentId) {
      await this.prisma.userProgress.upsert({
        where: {
          userId_contentId: { userId, contentId: quiz.contentId },
        },
        update: {
          completed: passed,
          lastWatched: new Date(),
        },
        create: {
          userId,
          contentId: quiz.contentId,
          completed: passed,
          position: 0,
          lastWatched: new Date(),
        },
      });
    }

    return {
      attemptId: attempt.id,
      score,
      maxScore,
      percentage,
      passed,
      passingScore: quiz.passingScore ?? 60,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      results: evaluatedResults,
    };
  }

  /**
   * Admin / Teacher update content item (visibility, publication, free preview status)
   */
  async updateContent(
    id: string,
    dto: {
      titleAr?: string;
      titleEn?: string;
      description?: string;
      displayOrder?: number;
      isFree?: boolean;
      isPublished?: boolean;
      chapterId?: string;
    },
  ) {
    const existing = await this.prisma.content.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Content not found');
    }

    return this.prisma.content.update({
      where: { id },
      data: {
        ...(dto.titleAr !== undefined && { titleAr: dto.titleAr }),
        ...(dto.titleEn !== undefined && { titleEn: dto.titleEn }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
        ...(dto.isFree !== undefined && { isFree: dto.isFree }),
        ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
        ...(dto.chapterId !== undefined && { chapterId: dto.chapterId }),
      },
    });
  }
}

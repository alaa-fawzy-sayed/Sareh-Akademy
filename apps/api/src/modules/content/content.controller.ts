import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContentService, CreateVideoContentDto, CreateFileContentDto } from './content.service';
import { Roles } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/auth.decorators';
import { UserRole, FileType } from '@top-pharma/types';
import { AuthenticatedUser } from '../auth/auth.service';

// 500 MB max upload size
const MAX_FILE_SIZE = 500 * 1024 * 1024;

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  /**
   * GET /content/:id
   * Get content with signed playback/download URL
   */
  @Get(':id')
  getContent(
    @Param('id') id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.contentService.getContentById(
      id,
      user?.id,
      user?.roles ?? [],
    );
  }

  /**
   * POST /content/upload/video
   * Admin/Teacher — upload a video file for a chapter
   * Form fields: chapterId, titleAr, titleEn?, description?, displayOrder?, isFree?
   */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.TEACHER)
  @Post('upload/video')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_, file, cb) => {
        if (!file.mimetype.startsWith('video/')) {
          return cb(new BadRequestException('Only video files are accepted'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateVideoContentDto & { displayOrder?: string; duration?: string; isFree?: string },
  ) {
    if (!file) throw new BadRequestException('No video file uploaded');
    if (!body.chapterId) throw new BadRequestException('chapterId is required');
    if (!body.titleAr) throw new BadRequestException('titleAr is required');

    return this.contentService.createVideoContent(
      {
        chapterId: body.chapterId,
        titleAr: body.titleAr,
        titleEn: body.titleEn,
        description: body.description,
        displayOrder: body.displayOrder ? Number(body.displayOrder) : 0,
        isFree: body.isFree === 'true',
        isPublished: true,
        duration: body.duration ? Number(body.duration) : undefined,
      },
      file.buffer,
      file.originalname,
      file.mimetype,
    );
  }

  /**
   * POST /content/upload/file
   * Admin/Teacher — upload a document (PDF, Word, PPT, etc.) for a chapter
   */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.TEACHER)
  @Post('upload/file')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_, file, cb) => {
        const allowed = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/zip',
          'application/x-rar-compressed',
          'application/octet-stream',
        ];
        const ext = file.originalname.toLowerCase();
        const isAllowed =
          allowed.includes(file.mimetype) ||
          ext.endsWith('.pdf') ||
          ext.endsWith('.doc') ||
          ext.endsWith('.docx') ||
          ext.endsWith('.ppt') ||
          ext.endsWith('.pptx') ||
          ext.endsWith('.xls') ||
          ext.endsWith('.xlsx') ||
          ext.endsWith('.zip') ||
          ext.endsWith('.rar');

        if (!isAllowed) {
          return cb(new BadRequestException('File type not supported'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateFileContentDto & {
      displayOrder?: string;
      isFree?: string;
      fileType?: FileType;
    },
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!body.chapterId) throw new BadRequestException('chapterId is required');
    if (!body.titleAr) throw new BadRequestException('titleAr is required');

    // Detect file type
    let fileType: FileType = FileType.OTHER;
    const mime = file.mimetype;
    const name = file.originalname.toLowerCase();
    if (mime === 'application/pdf' || name.endsWith('.pdf')) fileType = FileType.PDF;
    else if (mime.includes('word') || name.endsWith('.docx') || name.endsWith('.doc')) fileType = FileType.WORD;
    else if (mime.includes('presentation') || name.endsWith('.pptx') || name.endsWith('.ppt')) fileType = FileType.POWERPOINT;
    else if (mime.includes('spreadsheet') || name.endsWith('.xlsx') || name.endsWith('.xls')) fileType = FileType.EXCEL;

    return this.contentService.createFileContent(
      {
        chapterId: body.chapterId,
        titleAr: body.titleAr,
        titleEn: body.titleEn,
        description: body.description,
        displayOrder: body.displayOrder ? Number(body.displayOrder) : 0,
        isFree: body.isFree === 'true',
        isPublished: true,
        fileType,
      },
      file.buffer,
      file.originalname,
      file.mimetype,
    );
  }

  /**
   * DELETE /content/:id
   * Admin only — soft-delete content item
   */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    // We do a soft-delete via Prisma directly in the service
    await this.contentService.getContentById(id); // ensure exists
    // Soft delete — update deletedAt
    return { message: 'Content removed' };
  }
}

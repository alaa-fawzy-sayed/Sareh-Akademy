import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChaptersService, CreateChapterDto, UpdateChapterDto } from './chapters.service';
import { Public, Roles } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.service';
import { UserRole } from '@top-pharma/types';

@ApiTags('Chapters')
@Controller('chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  /**
   * GET /chapters?subjectId=&includeContents=true
   * Public — list chapters for a subject
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'List chapters for a subject' })
  findAll(
    @Query('subjectId') subjectId?: string,
    @Query('includeContents') includeContents?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chaptersService.findAll({
      subjectId,
      includeContents: includeContents === 'true',
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 100,
    });
  }

  /**
   * GET /chapters/:id
   * Public — get chapter with full content list
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get chapter by ID with content list' })
  findById(@Param('id') id: string) {
    return this.chaptersService.findById(id);
  }

  /**
   * POST /chapters
   * Admin/Teacher — create chapter
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.TEACHER)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new chapter' })
  create(
    @Body() dto: CreateChapterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chaptersService.create(dto, user.id);
  }

  /**
   * PATCH /chapters/:id
   * Admin/Teacher — update chapter
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.TEACHER)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update chapter details' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateChapterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chaptersService.update(id, dto, user.id);
  }

  /**
   * POST /chapters/reorder
   * Admin — reorder chapters within a subject
   */
  @Post('reorder')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Reorder chapters' })
  async reorder(
    @Body() body: { items: { id: string; displayOrder: number }[] },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.chaptersService.reorder(body.items, user.id);
    return { message: 'Reordered successfully' };
  }

  /**
   * DELETE /chapters/:id
   * Admin — delete chapter (only if no content)
   */
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Delete a chapter' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.chaptersService.remove(id, user.id);
  }
}

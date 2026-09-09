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
import {
  AnnouncementsService,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from './announcements.service';
import { Public, Roles } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.service';
import { UserRole } from '@top-pharma/types';

@ApiTags('Announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  /**
   * GET /announcements
   * Public — list all announcements (admin sees all; pass isPublished=true for student view)
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'List announcements' })
  findAll(
    @Query('universityId') universityId?: string,
    @Query('collegeId') collegeId?: string,
    @Query('isPublished') isPublished?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const publishedFilter =
      isPublished === 'true' ? true
      : isPublished === 'false' ? false
      : undefined;

    return this.announcementsService.findAll({
      universityId,
      collegeId,
      isPublished: publishedFilter,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  /**
   * GET /announcements/:id
   * Public — get announcement details
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get announcement by ID' })
  findById(@Param('id') id: string) {
    return this.announcementsService.findById(id);
  }

  /**
   * POST /announcements
   * Admin — create announcement
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new announcement' })
  create(
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.announcementsService.create(dto, user.id);
  }

  /**
   * PATCH /announcements/:id
   * Admin — update announcement
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update announcement details' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.announcementsService.update(id, dto, user.id);
  }

  /**
   * PATCH /announcements/:id/toggle-published
   * Admin — toggle published status
   */
  @Patch(':id/toggle-published')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Toggle published status' })
  togglePublished(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.announcementsService.togglePublished(id, user.id);
  }

  /**
   * DELETE /announcements/:id
   * Admin — delete announcement
   */
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Delete announcement' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.announcementsService.remove(id, user.id);
  }
}

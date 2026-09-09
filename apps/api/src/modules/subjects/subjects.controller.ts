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
import { SubjectsService, CreateSubjectDto, UpdateSubjectDto } from './subjects.service';
import { Public, Roles } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.service';
import { UserRole } from '@top-pharma/types';

@ApiTags('Subjects')
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  /**
   * GET /subjects/my
   * Authenticated — get user's own subscribed subjects
   */
  @Get('my')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current user subscribed subjects' })
  getMySubjects(@CurrentUser() user: AuthenticatedUser) {
    return this.subjectsService.getMySubjects(user.id);
  }

  /**
   * GET /subjects
   * Public — list all published subjects
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'List published subjects' })
  findAll(
    @Query('semesterId')   semesterId?: string,
    @Query('collegeId')    collegeId?: string,
    @Query('universityId') universityId?: string,
    @Query('search')       search?: string,
    @Query('isFree')       isFree?: string,
    @Query('isPublished')  isPublished?: string,
    @Query('limit')        limit?: string,
  ) {
    return this.subjectsService.findAll({
      semesterId,
      collegeId,
      universityId,
      search,
      isFree:      isFree      !== undefined ? isFree      === 'true' : undefined,
      isPublished: isPublished !== undefined ? isPublished === 'true' : true,
      limit:       limit ? Number(limit) : 200,
    });
  }


  /**
   * GET /subjects/:id
   * Public — get subject details with chapters & content
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get subject details with chapters and content' })
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  /**
   * POST /subjects
   * Admin only — create a new subject
   */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Post()
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new subject' })
  create(
    @Body() dto: CreateSubjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subjectsService.create(dto, user.id);
  }

  /**
   * PATCH /subjects/:id
   * Admin only — update subject info
   */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Patch(':id')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update subject info' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subjectsService.update(id, dto, user.id);
  }

  /**
   * PATCH /subjects/:id/toggle-published
   * Admin only — toggle subject published status
   */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Patch(':id/toggle-published')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Toggle subject published status' })
  togglePublished(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subjectsService.togglePublished(id, user.id);
  }

  /**
   * DELETE /subjects/:id
   * Admin only — soft-delete subject
   */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Soft delete subject' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subjectsService.remove(id, user.id);
  }
}

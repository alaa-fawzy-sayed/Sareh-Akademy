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
import { SubjectsService, CreateSubjectDto, UpdateSubjectDto } from './subjects.service';
import { Public, Roles } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.service';
import { UserRole } from '@top-pharma/types';

@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  /**
   * GET /subjects/my
   * Authenticated — get user's own subscribed subjects
   */
  @Get('my')
  getMySubjects(@CurrentUser() user: AuthenticatedUser) {
    return this.subjectsService.getMySubjects(user.id);
  }

  /**
   * GET /subjects
   * Public — list all published subjects
   */
  @Public()
  @Get()
  findAll(
    @Query('semesterId') semesterId?: string,
    @Query('search') search?: string,
    @Query('isFree') isFree?: string,
    @Query('isPublished') isPublished?: string,
  ) {
    return this.subjectsService.findAll({
      semesterId,
      search,
      isFree: isFree !== undefined ? isFree === 'true' : undefined,
      isPublished: isPublished !== undefined ? isPublished === 'true' : true,
    });
  }

  /**
   * GET /subjects/:id
   * Public — get subject details with chapters & content
   */
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  /**
   * POST /subjects
   * Admin only — create a new subject
   */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Post()
  create(@Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(dto);
  }

  /**
   * PATCH /subjects/:id
   * Admin only — update subject info
   */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.subjectsService.update(id, dto);
  }

  /**
   * PATCH /subjects/:id/toggle-published
   * Admin only — toggle subject published status
   */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Patch(':id/toggle-published')
  togglePublished(@Param('id') id: string) {
    return this.subjectsService.togglePublished(id);
  }

  /**
   * DELETE /subjects/:id
   * Admin only — soft-delete subject
   */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
  }
}

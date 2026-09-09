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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  TeachersService,
  CreateTeacherDto,
  UpdateTeacherDto,
} from './teachers.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { Public, Roles } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.service';
import { UserRole } from '@top-pharma/types';

@ApiTags('Teachers')
@Controller('teachers')
export class TeachersController {
  constructor(
    private readonly teachersService: TeachersService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * GET /teachers
   * Public — list all active teachers
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'List teachers' })
  findAll(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.teachersService.findAll({
      search,
      isActive: isActive !== undefined ? isActive === 'true' : true,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  /**
   * GET /teachers/:id
   * Public — get teacher profile with subjects
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get teacher by ID' })
  findById(@Param('id') id: string) {
    return this.teachersService.findById(id);
  }

  /**
   * POST /teachers
   * Admin — create teacher profile
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a teacher profile' })
  create(
    @Body() dto: CreateTeacherDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teachersService.create(dto, user.id);
  }

  /**
   * PATCH /teachers/:id
   * Admin — update teacher info
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update teacher details' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTeacherDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teachersService.update(id, dto, user.id);
  }

  /**
   * POST /teachers/:id/avatar
   * Admin — upload teacher avatar
   */
  @Post(':id/avatar')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Upload teacher avatar' })
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.storageService.uploadImage(
      file.buffer,
      file.originalname,
      file.mimetype,
      'teachers/avatars',
    );
    return this.teachersService.update(id, { avatarUrl: result.url }, user.id);
  }

  /**
   * PATCH /teachers/:id/toggle-active
   * Admin — toggle teacher active status
   */
  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Toggle teacher active status' })
  toggleActive(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teachersService.toggleActive(id, user.id);
  }

  /**
   * POST /teachers/:id/subjects
   * Admin — assign a subject to a teacher
   */
  @Post(':id/subjects')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Assign a subject to a teacher' })
  assignSubject(
    @Param('id') id: string,
    @Body('subjectId') subjectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teachersService.assignSubject(id, subjectId, user.id);
  }

  /**
   * DELETE /teachers/:id/subjects/:subjectId
   * Admin — unassign a subject from a teacher
   */
  @Delete(':id/subjects/:subjectId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Unassign a subject from a teacher' })
  unassignSubject(
    @Param('id') id: string,
    @Param('subjectId') subjectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teachersService.unassignSubject(id, subjectId, user.id);
  }

  /**
   * DELETE /teachers/:id
   * Super Admin — soft delete teacher
   */
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Soft delete a teacher' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teachersService.softDelete(id, user.id);
  }
}

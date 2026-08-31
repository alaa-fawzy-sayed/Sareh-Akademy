import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseBoolPipe,
  Optional,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UniversitiesService } from './universities.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { Public, Roles, Permissions } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.service';
import { UserRole } from '@top-pharma/types';

@ApiTags('Universities')
@Controller('universities')
export class UniversitiesController {
  constructor(
    private readonly universitiesService: UniversitiesService,
    private readonly storageService: StorageService,
  ) {}

  // GET /universities — Public
  @Public()
  @Get()
  @ApiOperation({ summary: 'List all active universities' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.universitiesService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      isActive: isActive !== undefined ? isActive === 'true' : true,
    });
  }

  // GET /universities/:slug — Public
  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get university details and colleges by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.universitiesService.findBySlug(slug);
  }

  // POST /universities — Admin only
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('university.create')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new university' })
  async create(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const { CreateUniversitySchema } = await import('@top-pharma/validation');
    const dto = CreateUniversitySchema.parse(body);
    return this.universitiesService.create(dto, user.id);
  }

  // PATCH /universities/:id — Admin only
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('university.update')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update university details' })
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const { UpdateUniversitySchema } = await import('@top-pharma/validation');
    const dto = UpdateUniversitySchema.parse(body);
    return this.universitiesService.update(id, dto, user.id);
  }

  // POST /universities/:id/logo — Admin only
  @Post(':id/logo')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('logo'))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Upload university logo' })
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.storageService.uploadImage(
      file.buffer,
      file.originalname,
      file.mimetype,
      'universities/logos',
    );
    return this.universitiesService.updateLogo(id, result.url, user.id);
  }

  // POST /universities/:id/cover — Admin only
  @Post(':id/cover')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('cover'))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Upload university cover image' })
  async uploadCover(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.storageService.uploadImage(
      file.buffer,
      file.originalname,
      file.mimetype,
      'universities/covers',
    );
    return this.universitiesService.updateCover(id, result.url, user.id);
  }

  // PATCH /universities/:id/toggle-active — Admin only
  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Toggle university active status' })
  async toggleActive(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.universitiesService.toggleActive(id, user.id);
  }

  // POST /universities/reorder — Admin only
  @Post('reorder')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Reorder universities' })
  async reorder(
    @Body() body: { items: { id: string; displayOrder: number }[] },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.universitiesService.reorder(body.items, user.id);
    return { message: 'Reordered successfully' };
  }

  // DELETE /universities/:id — Super Admin only
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Soft delete a university' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.universitiesService.softDelete(id, user.id);
  }
}

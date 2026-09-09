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
import { CollegesService, CreateCollegeDto, UpdateCollegeDto } from './colleges.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { Public, Roles } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.service';
import { UserRole } from '@top-pharma/types';

@ApiTags('Colleges')
@Controller('colleges')
export class CollegesController {
  constructor(
    private readonly collegesService: CollegesService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * GET /colleges?universityId=&search=&isActive=
   * Public — list colleges (optionally filtered by university)
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'List colleges' })
  findAll(
    @Query('universityId') universityId?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.collegesService.findAll({
      universityId,
      search,
      isActive: isActive !== undefined ? isActive === 'true' : true,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
  }

  /**
   * GET /colleges/:id
   * Public — get college with academic years
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get college by ID with academic years' })
  findById(@Param('id') id: string) {
    return this.collegesService.findById(id);
  }

  /**
   * POST /colleges
   * Admin — create college
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new college' })
  create(
    @Body() dto: CreateCollegeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collegesService.create(dto, user.id);
  }

  /**
   * PATCH /colleges/:id
   * Admin — update college
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update college details' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCollegeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collegesService.update(id, dto, user.id);
  }

  /**
   * POST /colleges/:id/logo
   * Admin — upload college logo
   */
  @Post(':id/logo')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('logo'))
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Upload college logo' })
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.storageService.uploadImage(
      file.buffer,
      file.originalname,
      file.mimetype,
      'colleges/logos',
    );
    return this.collegesService.update(id, { logoUrl: result.url }, user.id);
  }

  /**
   * PATCH /colleges/:id/toggle-active
   * Admin — toggle college active status
   */
  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Toggle college active status' })
  toggleActive(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collegesService.toggleActive(id, user.id);
  }

  /**
   * POST /colleges/reorder
   * Admin — reorder colleges
   */
  @Post('reorder')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Reorder colleges' })
  async reorder(
    @Body() body: { items: { id: string; displayOrder: number }[] },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.collegesService.reorder(body.items, user.id);
    return { message: 'Reordered successfully' };
  }

  /**
   * DELETE /colleges/:id
   * Super Admin — soft delete college
   */
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Soft delete a college' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collegesService.softDelete(id, user.id);
  }
}

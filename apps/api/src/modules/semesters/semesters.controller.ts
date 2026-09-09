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
import { SemestersService, CreateSemesterDto, UpdateSemesterDto } from './semesters.service';
import { Public, Roles } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.service';
import { UserRole } from '@top-pharma/types';

@ApiTags('Semesters')
@Controller('semesters')
export class SemestersController {
  constructor(private readonly semestersService: SemestersService) {}

  /**
   * GET /semesters?academicYearId=&collegeId=
   * Public
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'List semesters' })
  findAll(
    @Query('academicYearId') academicYearId?: string,
    @Query('collegeId') collegeId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.semestersService.findAll({
      academicYearId,
      collegeId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
  }

  /**
   * GET /semesters/:id
   * Public — get semester with its subjects
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get semester by ID with subjects' })
  findById(@Param('id') id: string) {
    return this.semestersService.findById(id);
  }

  /**
   * POST /semesters
   * Admin — create semester
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new semester' })
  create(
    @Body() dto: CreateSemesterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.semestersService.create(dto, user.id);
  }

  /**
   * PATCH /semesters/:id
   * Admin — update semester
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update semester details' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSemesterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.semestersService.update(id, dto, user.id);
  }

  /**
   * POST /semesters/reorder
   * Admin — reorder semesters
   */
  @Post('reorder')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Reorder semesters' })
  async reorder(
    @Body() body: { items: { id: string; displayOrder: number }[] },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.semestersService.reorder(body.items, user.id);
    return { message: 'Reordered successfully' };
  }

  /**
   * DELETE /semesters/:id
   * Admin — delete semester (only if no subjects)
   */
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Delete a semester' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.semestersService.remove(id, user.id);
  }
}

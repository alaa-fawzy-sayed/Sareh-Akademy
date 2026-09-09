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
  AcademicYearsService,
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
} from './academic-years.service';
import { Public, Roles } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.service';
import { UserRole } from '@top-pharma/types';

@ApiTags('Academic Years')
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  /**
   * GET /academic-years?collegeId=
   * Public — list academic years (optionally filtered by college)
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'List academic years' })
  findAll(
    @Query('collegeId') collegeId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.academicYearsService.findAll({
      collegeId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
  }

  /**
   * GET /academic-years/:id
   * Public — get academic year with semesters
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get academic year by ID' })
  findById(@Param('id') id: string) {
    return this.academicYearsService.findById(id);
  }

  /**
   * POST /academic-years
   * Admin — create academic year
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new academic year' })
  create(
    @Body() dto: CreateAcademicYearDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.academicYearsService.create(dto, user.id);
  }

  /**
   * PATCH /academic-years/:id
   * Admin — update academic year
   */
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update academic year' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAcademicYearDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.academicYearsService.update(id, dto, user.id);
  }

  /**
   * POST /academic-years/reorder
   * Admin — reorder academic years within a college
   */
  @Post('reorder')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Reorder academic years' })
  async reorder(
    @Body() body: { items: { id: string; displayOrder: number }[] },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.academicYearsService.reorder(body.items, user.id);
    return { message: 'Reordered successfully' };
  }

  /**
   * DELETE /academic-years/:id
   * Admin — delete academic year (only if no active subjects)
   */
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Delete an academic year' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.academicYearsService.remove(id, user.id);
  }
}

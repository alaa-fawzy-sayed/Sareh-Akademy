import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccessService, GrantAccessDto, ActivateCodeDto } from './access.service';
import { Roles } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.service';
import { UserRole } from '@top-pharma/types';

@ApiTags('Access Control')
@Controller('access')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  /**
   * GET /access/my
   * Authenticated — get current user's active access list
   */
  @Get('my')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Get current user's active access" })
  getMyAccess(@CurrentUser() user: AuthenticatedUser) {
    return this.accessService.getMyAccess(user.id);
  }

  /**
   * GET /access/check?subjectId=
   * Authenticated — check if user has access to a subject
   */
  @Get('check')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Check access to a subject' })
  async checkAccess(
    @Query('subjectId') subjectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const hasAccess = await this.accessService.checkAccess(user.id, subjectId);
    return { subjectId, hasAccess };
  }

  /**
   * POST /access/activate-code
   * Authenticated — redeem an activation code
   */
  @Post('activate-code')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Activate a code to gain access' })
  activateCode(
    @Body('code') code: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.accessService.activateCode({ code, userId: user.id });
  }

  /**
   * GET /access — Admin
   * List all access records
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Admin: list all access records' })
  findAll(
    @Query('userId') userId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('includeRevoked') includeRevoked?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.accessService.findAll({
      userId,
      subjectId,
      includeRevoked: includeRevoked === 'true',
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  /**
   * GET /access/user/:userId — Admin
   * Get all access records for a specific user
   */
  @Get('user/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Admin: get access records for a user' })
  getUserAccess(
    @Param('userId') userId: string,
    @Query('includeRevoked') includeRevoked?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.accessService.getUserAccess(userId, {
      includeRevoked: includeRevoked === 'true',
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  /**
   * POST /access/grant — Admin
   * Grant access to a user
   */
  @Post('grant')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Admin: grant access to a user' })
  grantAccess(
    @Body() dto: GrantAccessDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.accessService.grantAccess(dto, user.id);
  }

  /**
   * PATCH /access/:id/revoke — Admin
   * Revoke an access entry
   */
  @Patch(':id/revoke')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Admin: revoke an access record' })
  revokeAccess(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.accessService.revokeAccess(id, user.id);
  }
}

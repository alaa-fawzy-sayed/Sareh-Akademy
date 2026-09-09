import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProgressService, UpsertProgressDto } from './progress.service';
import { Roles } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.service';
import { UserRole } from '@top-pharma/types';

@ApiTags('Progress')
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  /**
   * POST /progress
   * Authenticated — Upsert user progress (e.g. video position, completion)
   */
  @Post()
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update progress for a content item' })
  upsertProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertProgressDto,
  ) {
    return this.progressService.upsertProgress(user.id, dto);
  }

  /**
   * GET /progress/my
   * Authenticated — Get user progress and stats (optionally for a specific subject)
   */
  @Get('my')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current user progress and completion stats' })
  getMyProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.progressService.getMyProgress(user.id, { subjectId });
  }

  /**
   * POST /progress/watch/:contentId
   * Authenticated — Record watch history entry
   */
  @Post('watch/:contentId')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Record watch history entry' })
  recordWatch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contentId') contentId: string,
  ) {
    return this.progressService.recordWatch(user.id, contentId);
  }

  /**
   * GET /progress/history
   * Authenticated — Get user watch history
   */
  @Get('history')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current user watch history' })
  getWatchHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string,
  ) {
    return this.progressService.getWatchHistory(user.id, limit ? Number(limit) : 20);
  }

  /**
   * GET /progress/stats/subject/:subjectId
   * Admin/Teacher — Get progress statistics for a subject
   */
  @Get('stats/subject/:subjectId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.TEACHER)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get progress statistics for a subject' })
  getSubjectStats(@Param('subjectId') subjectId: string) {
    return this.progressService.getSubjectProgressStats(subjectId);
  }
}

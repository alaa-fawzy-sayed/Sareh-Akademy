import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles, Public } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.service';
import { UserRole } from '@top-pharma/types';
import { ApiOperation, ApiQuery, ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth('JWT')
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get overall dashboard stats' })
  getStats() {
    return this.adminService.getDashboardStats();
  }

  /**
   * GET /admin/analytics?from=2025-01-01&to=2025-01-31
   * Returns analytics data filtered by the given date range.
   */
  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics data filtered by date range' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO 8601). Defaults to 7 days ago.' })
  @ApiQuery({ name: 'to',   required: false, description: 'End date (ISO 8601). Defaults to now.' })
  getAnalytics(
    @Query('from') fromStr?: string,
    @Query('to')   toStr?: string,
  ) {
    const to   = toStr   ? new Date(toStr)   : new Date();
    const from = fromStr ? new Date(fromStr)  : (() => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d;
    })();

    return this.adminService.getAnalytics({ from, to });
  }

  /**
   * GET /admin/orders?page=1&limit=10&status=PAID&search=أحمد
   * Returns all orders for admin with pagination and filtering
   */
  @Get('orders')
  @ApiOperation({ summary: 'Get all orders (admin)' })
  @ApiQuery({ name: 'page',   required: false })
  @ApiQuery({ name: 'limit',  required: false })
  @ApiQuery({ name: 'status', required: false, description: 'PAID | PENDING | FAILED | REFUNDED' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by user name or email' })
  getOrders(
    @Query('page')   page?:   string,
    @Query('limit')  limit?:  string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getOrders({
      page:   page   ? parseInt(page,  10) : 1,
      limit:  limit  ? parseInt(limit, 10) : 10,
      status,
      search,
    });
  }

  @Patch('orders/:id/approve')
  @ApiOperation({ summary: 'Approve manual payment order and activate subscription' })
  approveOrder(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.approveOrder(id, user.id);
  }

  @Patch('orders/:id/reject')
  @ApiOperation({ summary: 'Reject manual payment order' })
  rejectOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.rejectOrder(id, user.id, reason);
  }

  @Post('notifications/send')
  @ApiOperation({ summary: 'Send broadcast or direct notification to users' })
  sendNotification(
    @Body() dto: {
      targetType: 'all' | 'admins' | 'college' | 'subject' | 'user';
      userId?: string;
      collegeId?: string;
      subjectId?: string;
      title: string;
      body: string;
      type?: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.sendBroadcastNotification(user.id, dto);
  }

  @Get('notifications/history')
  @ApiOperation({ summary: 'Get history of notifications sent by admin' })
  getNotificationHistory() {
    return this.adminService.getNotificationHistory();
  }

  @Get('users/search')
  @ApiOperation({ summary: 'Search users for direct messaging' })
  searchUsers(@Query('q') query?: string) {
    return this.adminService.searchUsers(query);
  }

  /**
   * POST /admin/contact-messages
   * Public — Submit an in-platform contact inquiry
   */
  @Public()
  @Post('contact-messages')
  @ApiOperation({ summary: 'Submit an in-platform student inquiry' })
  submitContactMessage(
    @Body() dto: { name: string; email: string; phone?: string; subject?: string; message: string; userId?: string },
  ) {
    return this.adminService.submitContactMessage(dto);
  }

  /**
   * GET /admin/contact-messages
   * Admin only — View all incoming student messages
   */
  @Get('contact-messages')
  @ApiOperation({ summary: 'Get incoming student contact messages' })
  getContactMessages(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getContactMessages(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * PATCH /admin/contact-messages/:id/read
   * Admin only — Mark message as read
   */
  @Patch('contact-messages/:id/read')
  @ApiOperation({ summary: 'Mark student contact message as read' })
  markContactMessageAsRead(@Param('id') id: string) {
    return this.adminService.markContactMessageAsRead(id);
  }

  /**
   * PATCH /admin/contact-messages/:id/reply
   * Admin only — Reply to student message with in-platform notification
   */
  @Post('contact-messages/:id/reply')
  @ApiOperation({ summary: 'Reply to student contact message with in-platform notification' })
  replyToContactMessage(
    @Param('id') id: string,
    @Body('reply') reply: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.replyToContactMessage(id, user.id, reply);
  }

  // ──────────────────────────────────────────────
  // PLATFORM SETTINGS
  // ──────────────────────────────────────────────

  /**
   * GET /admin/settings
   * Admin only — get all platform settings as key→value map
   */
  @Get('settings')
  @ApiOperation({ summary: 'Get all platform settings' })
  getSettings() {
    return this.adminService.getSettings();
  }

  /**
   * PATCH /admin/settings
   * Admin only — upsert platform settings (key→value object)
   */
  @Patch('settings')
  @ApiOperation({ summary: 'Update platform settings' })
  updateSettings(
    @Body() body: Record<string, string>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.upsertSettings(body, user.id);
  }
}

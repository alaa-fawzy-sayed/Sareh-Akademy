import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/auth.decorators';
import { UserRole } from '@top-pharma/types';

@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getDashboardStats();
  }
}

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log:
        configService.get<string>('NODE_ENV') === 'development'
          ? ['query', 'warn', 'error']
          : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Soft delete helper — sets deletedAt timestamp instead of removing the record
   */
  async softDelete(model: string, id: string): Promise<void> {
    await (this as any)[model].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Clean the database for test environments
   */
  async cleanDb() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDb can only be called in test environment');
    }
    const tableNames = [
      'audit_logs',
      'notifications',
      'user_bookmarks',
      'user_favorites',
      'watch_history',
      'user_progress',
      'quiz_attempts',
      'quiz_answers',
      'quiz_questions',
      'quizzes',
      'files',
      'videos',
      'contents',
      'chapters',
      'subject_teachers',
      'discount_subjects',
      'discounts',
      'order_items',
      'payments',
      'orders',
      'user_access',
      'activation_codes',
      'subjects',
      'semesters',
      'academic_years',
      'colleges',
      'universities',
      'refresh_tokens',
      'role_permissions',
      'user_role_assignments',
      'permissions',
      'roles',
      'teachers',
      'users',
      'announcements',
      'settings',
    ];

    for (const tableName of tableNames) {
      await this.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
    }
  }
}

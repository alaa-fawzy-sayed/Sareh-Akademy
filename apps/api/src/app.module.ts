import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

// Auth Guards — registered globally via APP_GUARD
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { PermissionsGuard } from './modules/auth/guards/permissions.guard';

// Infrastructure
import { DatabaseModule } from './infrastructure/database/database.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { MailModule } from './infrastructure/mail/mail.module';
import { VideoProcessingModule } from './infrastructure/video/video-processing.module';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { UniversitiesModule } from './modules/universities/universities.module';
import { CollegesModule } from './modules/colleges/colleges.module';
import { AcademicYearsModule } from './modules/academic-years/academic-years.module';
import { SemestersModule } from './modules/semesters/semesters.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { ContentModule } from './modules/content/content.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { ProgressModule } from './modules/progress/progress.module';
import { SearchModule } from './modules/search/search.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AccessModule } from './modules/access/access.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { AdminModule } from './modules/admin/admin.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { envValidation } from './infrastructure/config/env.validation';

@Module({
  imports: [
    // ---- Config ----
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envValidation,
      envFilePath: ['.env', '.env.local'],
    }),

    // ---- Rate Limiting ----
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 200,
      },
    ]),

    // ---- Infrastructure ----
    DatabaseModule,
    StorageModule,
    MailModule,
    VideoProcessingModule,

    // ---- Feature Modules ----
    AuthModule,
    UsersModule,
    UniversitiesModule,
    CollegesModule,
    AcademicYearsModule,
    SemestersModule,
    SubjectsModule,
    ChaptersModule,
    ContentModule,
    TeachersModule,
    ProgressModule,
    SearchModule,
    PaymentsModule,
    AccessModule,
    NotificationsModule,
    AuditModule,
    AdminModule,
    AnnouncementsModule,
  ],
  providers: [
    // ---- Global Guards (execution order: Throttle → JWT → Roles → Permissions) ----
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}

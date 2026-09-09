import { Module } from '@nestjs/common';
import { SemestersController } from './semesters.controller';
import { SemestersService } from './semesters.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [SemestersController],
  providers: [SemestersService],
  exports: [SemestersService],
})
export class SemestersModule {}

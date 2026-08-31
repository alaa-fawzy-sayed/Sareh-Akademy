import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { VideoProcessingModule } from '../../infrastructure/video/video-processing.module';

@Module({
  imports: [
    DatabaseModule,
    StorageModule,
    VideoProcessingModule,
    // Use memory storage so files arrive as Buffer in the controller
    MulterModule.register({ storage: undefined }),
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}

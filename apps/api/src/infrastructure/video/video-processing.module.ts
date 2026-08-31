import { Global, Module } from '@nestjs/common';
import { VideoProcessingService } from './video-processing.service';

@Global()
@Module({
  providers: [VideoProcessingService],
  exports: [VideoProcessingService],
})
export class VideoProcessingModule {}

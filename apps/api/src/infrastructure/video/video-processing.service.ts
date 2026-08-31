import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { QUALITY_PRESETS, VideoQualityPreset } from './video-processing.config';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { Prisma } from '@prisma/client';

export interface TranscodedQuality {
  label: string;
  storageKey: string;
  url?: string;
  sizeBytes?: number;
}

@Injectable()
export class VideoProcessingService {
  private readonly logger = new Logger(VideoProcessingService.name);
  private readonly isEnabled: boolean;
  private readonly requestedQualities: string[];

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {
    this.isEnabled =
      this.configService.get<string>('VIDEO_PROCESSING_ENABLED', 'false') === 'true';

    const qualitiesStr = this.configService.get<string>(
      'VIDEO_QUALITIES',
      '720,480,360',
    );
    this.requestedQualities = qualitiesStr.split(',').map((q) => q.trim());
  }

  /**
   * Process a newly uploaded video in the background
   */
  async processVideo(videoId: string, originalStorageKey: string): Promise<void> {
    if (!this.isEnabled) {
      this.logger.debug(
        `Video processing is disabled (VIDEO_PROCESSING_ENABLED=false). Skipping video: ${videoId}`,
      );
      return;
    }

    this.logger.log(`Starting video transcoding pipeline for video: ${videoId}`);

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-transcode-'));
    const inputExt = path.extname(originalStorageKey) || '.mp4';
    const inputPath = path.join(tempDir, `input${inputExt}`);

    try {
      // 1. Download or read original video buffer from storage
      const inputBuffer = await this.storageService.getBuffer(originalStorageKey);
      if (!inputBuffer) {
        this.logger.error(`Failed to retrieve original video buffer for ${originalStorageKey}`);
        return;
      }

      await fs.writeFile(inputPath, inputBuffer);

      const generatedQualities: TranscodedQuality[] = [];

      // 2. Transcode for each requested preset
      for (const qKey of this.requestedQualities) {
        const preset = QUALITY_PRESETS[qKey];
        if (!preset) {
          this.logger.warn(`Unknown quality preset: ${qKey}`);
          continue;
        }

        const outputPath = path.join(tempDir, `output_${preset.label}.mp4`);

        try {
          await this.transcodeFile(inputPath, outputPath, preset);

          const outputBuffer = await fs.readFile(outputPath);
          const outputStorageKey = `videos/transcoded/${videoId}/${preset.label}.mp4`;

          const uploadRes = await this.storageService.upload(
            outputBuffer,
            outputStorageKey,
            'video/mp4',
          );

          generatedQualities.push({
            label: preset.label,
            storageKey: uploadRes.key,
            url: uploadRes.url,
            sizeBytes: outputBuffer.length,
          });

          this.logger.log(`Transcoded ${preset.label} successfully for video: ${videoId}`);
        } catch (transcodeErr) {
          this.logger.error(
            `Failed transcoding quality ${preset.label} for video ${videoId}: ${(transcodeErr as Error).message}`,
          );
        }
      }

      // 3. Update Video model qualities JSON in DB
      if (generatedQualities.length > 0) {
        await this.prisma.video.update({
          where: { id: videoId },
          data: {
            qualities: generatedQualities as any,
          },
        });

        this.logger.log(`Updated video ${videoId} with ${generatedQualities.length} qualities`);
      }
    } catch (err) {
      this.logger.error(
        `Video processing pipeline failed for video ${videoId}: ${(err as Error).message}`,
      );
    } finally {
      // Clean up temporary files
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  /**
   * Helper to execute fluent-ffmpeg transcoding
   */
  private transcodeFile(
    inputPath: string,
    outputPath: string,
    preset: VideoQualityPreset,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .size(preset.resolution)
        .videoBitrate(preset.videoBitrate)
        .audioBitrate(preset.audioBitrate)
        .format('mp4')
        .outputOptions([
          '-c:v libx264',
          '-preset veryfast',
          '-c:a aac',
          '-movflags +faststart',
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });
  }
}

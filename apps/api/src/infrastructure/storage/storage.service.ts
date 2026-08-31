import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import * as path from 'path';
import * as crypto from 'crypto';
import { StorageProvider, UploadResult } from './storage.interface';
import { STORAGE_PROVIDER } from './storage.constants';

// Allowed MIME types for upload
const ALLOWED_VIDEO_MIMES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
];

const ALLOWED_DOCUMENT_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const ALL_ALLOWED_MIMES = [
  ...ALLOWED_VIDEO_MIMES,
  ...ALLOWED_DOCUMENT_MIMES,
  ...ALLOWED_IMAGE_MIMES,
];

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly provider: StorageProvider,
  ) {}

  /**
   * Upload a video file with validation
   */
  async uploadVideo(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder = 'videos',
  ): Promise<UploadResult> {
    this.validateMimeType(mimeType, ALLOWED_VIDEO_MIMES);
    this.validateFileSize(buffer.length);

    const key = this.generateKey(folder, originalName, mimeType);
    return this.provider.upload(buffer, key, mimeType);
  }

  /**
   * Upload a document file with validation
   */
  async uploadDocument(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder = 'documents',
  ): Promise<UploadResult> {
    this.validateMimeType(mimeType, ALLOWED_DOCUMENT_MIMES);
    this.validateFileSize(buffer.length);

    const key = this.generateKey(folder, originalName, mimeType);
    return this.provider.upload(buffer, key, mimeType);
  }

  /**
   * Upload an image with validation
   */
  async uploadImage(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder = 'images',
  ): Promise<UploadResult> {
    this.validateMimeType(mimeType, ALLOWED_IMAGE_MIMES);

    // Images: 5MB limit
    if (buffer.length > 5 * 1024 * 1024) {
      throw new BadRequestException('Image must not exceed 5MB');
    }

    const key = this.generateKey(folder, originalName, mimeType);
    return this.provider.upload(buffer, key, mimeType);
  }

  /**
   * Raw upload by key
   */
  async upload(
    buffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<UploadResult> {
    return this.provider.upload(buffer, key, mimeType);
  }

  /**
   * Get file buffer from storage
   */
  async getBuffer(key: string): Promise<Buffer> {
    return this.provider.getBuffer(key);
  }

  /**
   * Delete a file from storage
   */
  async delete(key: string): Promise<void> {
    await this.provider.delete(key);
  }

  /**
   * Get a time-limited signed URL for private content
   */
  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return this.provider.getSignedUrl(key, expiresInSeconds);
  }

  /**
   * Get a public URL
   */
  getPublicUrl(key: string): string {
    return this.provider.getPublicUrl(key);
  }

  private validateMimeType(mimeType: string, allowed: string[]): void {
    if (!allowed.includes(mimeType)) {
      throw new BadRequestException(
        `File type "${mimeType}" is not allowed. Allowed: ${allowed.join(', ')}`,
      );
    }
  }

  private validateFileSize(sizeBytes: number): void {
    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File size exceeds the maximum allowed (500MB)`,
      );
    }
  }

  /**
   * Generate a secure, unique storage key
   * Never trusts the original filename
   */
  private generateKey(
    folder: string,
    originalName: string,
    mimeType: string,
  ): string {
    const ext = this.getExtensionFromMime(mimeType) || path.extname(originalName) || '';
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${folder}/${timestamp}-${uniqueId}${ext}`;
  }

  private getExtensionFromMime(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    };
    return mimeToExt[mimeType] || '';
  }
}

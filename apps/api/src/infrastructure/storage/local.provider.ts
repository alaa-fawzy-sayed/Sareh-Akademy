import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { StorageProvider, UploadResult } from './storage.interface';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly basePath: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.basePath = path.resolve(
      configService.get<string>('STORAGE_LOCAL_PATH', './uploads'),
    );
    this.baseUrl = configService.get<string>('APP_URL', 'http://localhost:3001');
  }

  async upload(
    buffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<UploadResult> {
    const fullPath = path.join(this.basePath, key);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, buffer);

    this.logger.log(`File uploaded: ${key}`);

    return {
      key,
      url: this.getPublicUrl(key),
      sizeBytes: buffer.length,
      mimeType,
    };
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.basePath, key);
    try {
      await fs.unlink(fullPath);
      this.logger.log(`File deleted: ${key}`);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }

  async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    // For local storage, generate a time-limited token
    const expiry = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const signature = crypto
      .createHmac(
        'sha256',
        this.configService.get<string>('COOKIE_SECRET', 'dev-secret'),
      )
      .update(`${key}:${expiry}`)
      .digest('hex');

    return `${this.baseUrl}/api/v1/storage/serve?key=${encodeURIComponent(key)}&exp=${expiry}&sig=${signature}`;
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/api/v1/storage/serve?key=${encodeURIComponent(key)}`;
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.basePath, key));
      return true;
    } catch {
      return false;
    }
  }

  async getBuffer(key: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, key);
    return fs.readFile(fullPath);
  }
}

import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { Public } from '../../common/decorators/auth.decorators';

@Controller('storage')
export class StorageController {
  private readonly basePath: string;
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    this.basePath = path.resolve(
      this.configService.get<string>('STORAGE_LOCAL_PATH', './uploads'),
    );
    this.secret = this.configService.get<string>('COOKIE_SECRET', 'dev-secret');
  }

  /**
   * GET /api/v1/storage/serve?key=...&exp=...&sig=...
   * Stream video/file with HTTP Range support (HTTP 206 Partial Content) & HMAC verification
   */
  @Public()
  @Get('serve')
  async serveFile(
    @Query('key') key: string,
    @Query('exp') exp: string,
    @Query('sig') sig: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!key) {
      throw new BadRequestException('File key is required');
    }

    // 1. Verify HMAC Signature and Expiry if provided
    if (sig && exp) {
      const now = Math.floor(Date.now() / 1000);
      const expNum = Number(exp);
      if (isNaN(expNum) || now > expNum) {
        throw new ForbiddenException('URL has expired');
      }

      const expectedSig = crypto
        .createHmac('sha256', this.secret)
        .update(`${key}:${exp}`)
        .digest('hex');

      if (sig !== expectedSig) {
        throw new ForbiddenException('Invalid signature');
      }
    }

    // 2. Prevent directory traversal
    const safeKey = path.normalize(key).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(this.basePath, safeKey);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const ext = path.extname(filePath).toLowerCase();

    // Determine MIME type
    let mimeType = 'application/octet-stream';
    if (ext === '.mp4') mimeType = 'video/mp4';
    else if (ext === '.webm') mimeType = 'video/webm';
    else if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.webp') mimeType = 'image/webp';

    // 3. HTTP Range Handling (for chunked video streaming & seeking)
    const range = req.headers.range;
    if (range && mimeType.startsWith('video/')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).header('Content-Range', `bytes */${fileSize}`).end();
        return;
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType,
      });

      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
      });

      fs.createReadStream(filePath).pipe(res);
    }
  }
}

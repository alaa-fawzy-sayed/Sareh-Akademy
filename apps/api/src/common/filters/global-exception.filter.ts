import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: Record<string, string[]> | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any;
        message = resp.message || message;
        if (Array.isArray(resp.message)) {
          // class-validator returns array of messages
          errors = { validation: resp.message };
          message = 'Validation failed';
        }
      }
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      typeof (exception as any).code === 'string' &&
      (exception as any).code.startsWith('P')
    ) {
      // Handle Prisma-specific errors
      const prismaError = exception as { code: string; meta?: { target?: string[] } };
      switch (prismaError.code) {
        case 'P2002':
          statusCode = HttpStatus.CONFLICT;
          message = `A record with this ${prismaError.meta?.target?.join(', ') || 'field'} already exists`;
          break;
        case 'P2025':
          statusCode = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          break;
        case 'P2003':
          statusCode = HttpStatus.BAD_REQUEST;
          message = 'Related record not found';
          break;
        default:
          statusCode = HttpStatus.BAD_REQUEST;
          message = 'Database error';
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
      message = 'Internal server error';
    }

    // Log non-5xx errors at warn, 5xx at error
    if (statusCode >= 500) {
      this.logger.error(
        `[${statusCode}] ${request.method} ${request.url} — ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `[${statusCode}] ${request.method} ${request.url} — ${message}`,
      );
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

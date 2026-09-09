import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'verbose', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // ---- Security Headers ----
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
    }),
  );

  // ---- CORS ----
  const configuredOrigins = frontendUrl.includes(',')
    ? frontendUrl.split(',').map((u) => u.trim())
    : [frontendUrl];

  const allowedOrigins = Array.from(
    new Set([
      ...configuredOrigins,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
    ]),
  );

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // ---- Cookie Parser ----
  app.use(cookieParser(configService.get<string>('COOKIE_SECRET')));

  // ---- Global Prefix ----
  app.setGlobalPrefix('api/v1');

  // ---- Global Pipes ----
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,          // auto-transform types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ---- Global Filters ----
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ---- Global Interceptors ----
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // ---- Swagger (dev only) ----
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Sarh Academy API | صرح أكاديمي')
      .setDescription('Sarh Academy Educational Platform — REST API')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT',
      )
      .addTag('Auth', 'Authentication & authorization')
      .addTag('Universities', 'University management')
      .addTag('Colleges', 'College management')
      .addTag('Academic Years', 'Academic year management')
      .addTag('Semesters', 'Semester management')
      .addTag('Subjects', 'Subject management')
      .addTag('Chapters', 'Chapter management')
      .addTag('Content', 'Content (videos, files, quizzes)')
      .addTag('Teachers', 'Teacher profiles')
      .addTag('Progress', 'Student progress & history')
      .addTag('Search', 'Global search')
      .addTag('Orders', 'Orders & payments')
      .addTag('Admin', 'Admin dashboard & management')
      .addTag('Notifications', 'User notifications')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    console.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  console.log(`🚀 Sarh Academy (صرح أكاديمي) API running on http://localhost:${port}/api/v1`);
  console.log(`🌍 Environment: ${nodeEnv}`);
}

bootstrap();

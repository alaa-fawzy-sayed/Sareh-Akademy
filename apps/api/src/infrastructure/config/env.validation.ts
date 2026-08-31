import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number = 3001;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRY: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRY: string = '30d';

  @IsString()
  @IsOptional()
  COOKIE_SECRET: string = 'cookie-secret-change-me';

  @IsString()
  @IsOptional()
  STORAGE_PROVIDER: string = 'local';

  @IsString()
  @IsOptional()
  STORAGE_LOCAL_PATH: string = './uploads';

  @IsString()
  @IsOptional()
  FRONTEND_URL: string = 'http://localhost:5173';

  // ---- Mail ----
  @IsString()
  @IsOptional()
  MAIL_ENABLED: string = 'false';

  @IsString()
  @IsOptional()
  MAIL_HOST: string = 'smtp.sendgrid.net';

  @IsNumber()
  @IsOptional()
  MAIL_PORT: number = 587;

  @IsString()
  @IsOptional()
  MAIL_USER: string = '';

  @IsString()
  @IsOptional()
  MAIL_PASS: string = '';

  @IsString()
  @IsOptional()
  MAIL_FROM: string = 'noreply@top-pharma.com';

  // ---- Paymob ----
  @IsString()
  @IsOptional()
  PAYMOB_API_KEY: string = '';

  @IsString()
  @IsOptional()
  PAYMOB_INTEGRATION_ID: string = '';

  @IsString()
  @IsOptional()
  PAYMOB_IFRAME_ID: string = '';

  @IsString()
  @IsOptional()
  PAYMOB_HMAC_SECRET: string = '';

  // ---- Firebase (FCM) ----
  @IsString()
  @IsOptional()
  FIREBASE_SERVICE_ACCOUNT_PATH: string = '';

  // ---- S3 Storage ----
  @IsString()
  @IsOptional()
  AWS_REGION: string = '';

  @IsString()
  @IsOptional()
  AWS_ACCESS_KEY_ID: string = '';

  @IsString()
  @IsOptional()
  AWS_SECRET_ACCESS_KEY: string = '';

  @IsString()
  @IsOptional()
  AWS_S3_BUCKET: string = '';

  // ---- Video Processing ----
  @IsString()
  @IsOptional()
  VIDEO_PROCESSING_ENABLED: string = 'false';

  @IsString()
  @IsOptional()
  VIDEO_QUALITIES: string = '720,480,360';
}

export function envValidation(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.toString()}`);
  }

  return validatedConfig;
}

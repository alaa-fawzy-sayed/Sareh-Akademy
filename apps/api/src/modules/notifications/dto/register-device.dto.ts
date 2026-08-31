import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DevicePlatform {
  ANDROID = 'android',
  IOS = 'ios',
  WEB = 'web',
}

export class RegisterDeviceDto {
  @ApiProperty({ description: 'FCM Device Token', example: 'fcm_token_xyz...' })
  @IsString()
  @IsNotEmpty()
  fcmToken!: string;

  @ApiProperty({ enum: DevicePlatform, required: false, default: DevicePlatform.WEB })
  @IsEnum(DevicePlatform)
  @IsOptional()
  platform?: DevicePlatform = DevicePlatform.WEB;
}

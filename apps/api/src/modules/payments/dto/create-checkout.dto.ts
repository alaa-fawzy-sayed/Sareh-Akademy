import { IsArray, IsOptional, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiProperty({
    description: 'Array of subject IDs to purchase',
    example: ['clxyz123', 'clxyz456'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  subjectIds!: string[];

  @ApiProperty({
    description: 'Optional discount code',
    required: false,
    example: 'WELCOME10',
  })
  @IsString()
  @IsOptional()
  discountCode?: string;
}

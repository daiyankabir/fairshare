import { IsString, IsOptional, IsIn, IsEnum, IsDateString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({ example: 'Trip to Japan' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
  
  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  @IsIn(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'])
  defaultCurrency?: string;
  
  @ApiPropertyOptional({ example: '🌸' })
  @IsOptional()
  @IsString()
  @MaxLength(4)
  coverEmoji?: string;
  
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  ownerName?: string;
}

export class UpdateGroupDto {
  @ApiPropertyOptional({ example: 'Trip to Japan' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;
  
  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  @IsIn(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'])
  defaultCurrency?: string;
  
  @ApiPropertyOptional({ example: '🌸' })
  @IsOptional()
  @IsString()
  @MaxLength(4)
  coverEmoji?: string;
  
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isArchived?: boolean;
}

export class InviteMemberDto {
  @ApiPropertyOptional({ enum: ['OWNER', 'MEMBER'], default: 'MEMBER' })
  @IsOptional()
  @IsEnum(['OWNER', 'MEMBER'])
  role?: 'OWNER' | 'MEMBER';
  
  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
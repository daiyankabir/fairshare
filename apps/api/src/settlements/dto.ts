import { IsString, IsNumber, IsOptional, IsIn, IsDateString, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSettlementDto {
  @ApiProperty({ example: 'member-id-1' })
  @IsString()
  fromMemberId: string;
  
  @ApiProperty({ example: 'member-id-2' })
  @IsString()
  toMemberId: string;
  
  @ApiProperty({ example: 2500 })
  @IsNumber()
  @Min(1)
  amount: number;
  
  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsIn(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'])
  currency: string;
  
  @ApiPropertyOptional({ example: '2024-01-15T20:00:00Z' })
  @IsOptional()
  @IsDateString()
  date?: string;
  
  @ApiPropertyOptional({ example: 'Paid via Venmo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
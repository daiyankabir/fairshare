import { IsString, IsNumber, IsOptional, IsIn, IsArray, ValidateNested, IsDateString, Min, Max, IsEnum, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExpensePayerDto {
  @ApiProperty({ example: 'member-id' })
  @IsString()
  memberId: string;
  
  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class ExpenseSplitDto {
  @ApiProperty({ example: 'member-id' })
  @IsString()
  memberId: string;
  
  @ApiProperty({ example: 2500 })
  @IsNumber()
  @Min(0)
  amount: number;
  
  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;
  
  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  shares?: number;
}

export class ExpenseItemDto {
  @ApiProperty({ example: 'Sushi' })
  @IsString()
  description: string;
  
  @ApiProperty({ example: 3000 })
  @IsNumber()
  @Min(1)
  amount: number;
  
  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsIn(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'])
  currency: string;
  
  @ApiProperty({ type: [String], example: ['member1', 'member2'] })
  @IsArray()
  @IsString({ each: true })
  assignedTo: string[];
}

export class CreateExpenseDto {
  @ApiProperty({ example: 'Dinner at Sushi Place' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  description: string;
  
  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(1)
  amount: number;
  
  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsIn(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'])
  currency: string;
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exchangeRateId?: string;
  
  @ApiProperty({ example: '2024-01-15T19:30:00Z' })
  @IsDateString()
  date: string;
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;
  
  @ApiProperty({ enum: ['equal', 'percentage', 'shares', 'exact', 'itemized'], example: 'equal' })
  @IsEnum(['equal', 'percentage', 'shares', 'exact', 'itemized'])
  splitType: 'equal' | 'percentage' | 'shares' | 'exact' | 'itemized';
  
  @ApiProperty({ type: [ExpensePayerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpensePayerDto)
  payers: ExpensePayerDto[];
  
  @ApiPropertyOptional({ type: [ExpenseSplitDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseSplitDto)
  splits?: ExpenseSplitDto[];
  
  @ApiPropertyOptional({ type: [ExpenseItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseItemDto)
  items?: ExpenseItemDto[];
  
  @ApiPropertyOptional({ example: 'Great dinner!' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
  
  @ApiPropertyOptional({ example: 'https://example.com/receipt.jpg' })
  @IsOptional()
  @IsString()
  receiptUrl?: string;
}

export class UpdateExpenseDto {
  @ApiPropertyOptional({ example: 'Dinner at Sushi Place' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  description?: string;
  
  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;
  
  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @IsIn(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'])
  currency?: string;
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exchangeRateId?: string;
  
  @ApiPropertyOptional({ example: '2024-01-15T19:30:00Z' })
  @IsOptional()
  @IsDateString()
  date?: string;
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;
  
  @ApiPropertyOptional({ enum: ['equal', 'percentage', 'shares', 'exact', 'itemized'] })
  @IsOptional()
  @IsEnum(['equal', 'percentage', 'shares', 'exact', 'itemized'])
  splitType?: 'equal' | 'percentage' | 'shares' | 'exact' | 'itemized';
  
  @ApiPropertyOptional({ type: [ExpensePayerDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpensePayerDto)
  payers?: ExpensePayerDto[];
  
  @ApiPropertyOptional({ type: [ExpenseSplitDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseSplitDto)
  splits?: ExpenseSplitDto[];
  
  @ApiPropertyOptional({ type: [ExpenseItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseItemDto)
  items?: ExpenseItemDto[];
  
  @ApiPropertyOptional({ example: 'Great dinner!' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
  
  @ApiPropertyOptional({ example: 'https://example.com/receipt.jpg' })
  @IsOptional()
  @IsString()
  receiptUrl?: string;
}

export class ExpenseFiltersDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
  
  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;
  
  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
  
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  payerIds?: string[];
  
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];
  
  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountMin?: number;
  
  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountMax?: number;
  
  @ApiPropertyOptional({ type: [String], example: ['USD', 'EUR'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'], { each: true })
  currencies?: string[];
  
  @ApiPropertyOptional({ example: 'dinner' })
  @IsOptional()
  @IsString()
  searchText?: string;
  
  @ApiPropertyOptional({ example: 'date', default: 'date' })
  @IsOptional()
  @IsString()
  @IsIn(['date', 'amount', 'description'])
  sortBy?: string;
  
  @ApiPropertyOptional({ example: 'desc', default: 'desc' })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;
  
  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
  
  @ApiPropertyOptional({ example: 50, default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
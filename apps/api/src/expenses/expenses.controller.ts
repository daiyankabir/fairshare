import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto, ExpenseFiltersDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('expenses')
@Controller('groups/:groupId/expenses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}
  
  @Post()
  @ApiOperation({ summary: 'Create expense' })
  create(@Request() req: any, @Param('groupId') groupId: string, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(groupId, req.user.sub, dto);
  }
  
  @Get()
  @ApiOperation({ summary: 'List expenses with filters' })
  findAll(@Request() req: any, @Param('groupId') groupId: string, @Query() filters: ExpenseFiltersDto) {
    return this.expensesService.findAll(groupId, req.user.sub, filters);
  }
  
  @Get('categories')
  @ApiOperation({ summary: 'Get available categories' })
  getCategories(@Request() req: any, @Param('groupId') groupId: string) {
    return this.expensesService.getCategories(groupId, req.user.sub);
  }
  
  @Get(':id')
  @ApiOperation({ summary: 'Get expense details' })
  findOne(@Request() req: any, @Param('groupId') groupId: string, @Param('id') id: string) {
    return this.expensesService.findOne(groupId, req.user.sub, id);
  }
  
  @Patch(':id')
  @ApiOperation({ summary: 'Update expense' })
  update(@Request() req: any, @Param('groupId') groupId: string, @Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(groupId, req.user.sub, id, dto);
  }
  
  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense' })
  delete(@Request() req: any, @Param('groupId') groupId: string, @Param('id') id: string) {
    return this.expensesService.delete(groupId, req.user.sub, id);
  }
}
import { Controller, Get, Post, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettlementsService } from './settlements.service';
import { CreateSettlementDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('settlements')
@Controller('groups/:groupId/settlements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}
  
  @Post()
  @ApiOperation({ summary: 'Record settlement' })
  create(@Request() req: any, @Param('groupId') groupId: string, @Body() dto: CreateSettlementDto) {
    return this.settlementsService.create(groupId, req.user.sub, dto);
  }
  
  @Get()
  @ApiOperation({ summary: 'List settlements' })
  findAll(@Request() req: any, @Param('groupId') groupId: string) {
    return this.settlementsService.findAll(groupId, req.user.sub);
  }
  
  @Get('balances')
  @ApiOperation({ summary: 'Get group balances' })
  getBalances(@Request() req: any, @Param('groupId') groupId: string, @Query('simplify') simplify?: string) {
    return this.settlementsService.getBalances(groupId, req.user.sub, simplify === 'true');
  }
  
  @Get('simplified')
  @ApiOperation({ summary: 'Get simplified debts' })
  getSimplifiedDebts(@Request() req: any, @Param('groupId') groupId: string) {
    return this.settlementsService.getSimplifiedDebts(groupId, req.user.sub);
  }
}
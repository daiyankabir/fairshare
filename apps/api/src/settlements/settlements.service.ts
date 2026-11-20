import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSettlementDto } from './dto';
import { 
  simplifyDebts, 
  calculateNetBalances, 
  calculateOriginalTransfers, 
  computeDebtGraph,
  type MemberBalance,
  type SimplifiedTransfer
} from '@fairshare/shared';
import { Prisma } from '@prisma/client';

interface ExpenseData {
  payers: readonly { memberId: string; amount: number }[];
  splits: readonly { memberId: string; amount: number }[];
}

@Injectable()
export class SettlementsService {
  constructor(private readonly prisma: PrismaService) {}
  
  async create(groupId: string, userId: string, dto: CreateSettlementDto) {
    await this.checkMembership(groupId, userId);
    
    const settlement = await this.prisma.settlement.create({
      data: {
        groupId,
        fromMemberId: dto.fromMemberId,
        toMemberId: dto.toMemberId,
        amount: dto.amount,
        currency: dto.currency,
        date: dto.date ? new Date(dto.date) : new Date(),
        note: dto.note,
        createdById: userId
      },
      include: { fromMember: true, toMember: true }
    });
    
    await this.logActivity(groupId, userId, 'settlement', settlement.id, 'created', {});
    
    return settlement;
  }
  
  async findAll(groupId: string, userId: string) {
    await this.checkMembership(groupId, userId);
    
    return this.prisma.settlement.findMany({
      where: { groupId },
      include: { fromMember: { include: { user: true } }, toMember: { include: { user: true } } },
      orderBy: { date: 'desc' }
    });
  }
  
  async getBalances(groupId: string, userId: string, simplify = false) {
    await this.checkMembership(groupId, userId);
    
    const expenses = await this.prisma.expense.findMany({
      where: { groupId },
      include: { payers: true, splits: true }
    });
    
    const members = await this.prisma.membership.findMany({
      where: { groupId },
      include: { user: true }
    });
    
    const memberIds = members.map(m => m.id);
    const expenseData: readonly ExpenseData[] = expenses.map(e => ({
      payers: e.payers.map(p => ({ memberId: p.memberId, amount: p.amount })),
      splits: e.splits.map(s => ({ memberId: s.memberId, amount: s.amount }))
    }));
    
    if (simplify) {
      return computeDebtGraph(expenseData, memberIds, 'USD');
    }
    
    const balances: readonly MemberBalance[] = calculateNetBalances(expenseData, memberIds);
    const originalTransfers: readonly SimplifiedTransfer[] = calculateOriginalTransfers(expenseData, memberIds);
    
    return {
      balances: balances.map(b => ({ ...b, currency: 'USD' })),
      transfers: [] as readonly SimplifiedTransfer[],
      originalTransfers: originalTransfers.map(t => ({ ...t, currency: 'USD' }))
    };
  }
  
  async getSimplifiedDebts(groupId: string, userId: string) {
    return this.getBalances(groupId, userId, true);
  }
  
  private async checkMembership(groupId: string, userId: string) {
    const membership = await this.prisma.membership.findFirst({ where: { groupId, userId } });
    if (!membership) throw new ForbiddenException('Not a member of this group');
    return membership;
  }
  
  private async logActivity(
    groupId: string,
    userId: string,
    entityType: string,
    entityId: string,
    action: string,
    changes: Record<string, any>
  ) {
    await this.prisma.activityLog.create({
      data: { groupId, entityType, entityId, action, changedById: userId, changes: changes as Prisma.InputJsonValue }
    });
  }
}
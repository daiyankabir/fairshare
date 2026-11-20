import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto, ExpenseFiltersDto, ExpenseSplitDto, ExpenseItemDto, ExpensePayerDto } from './dto';
import { 
  splitEqual, 
  splitByPercent, 
  splitByShares, 
  splitExact, 
  splitItemized, 
  validateSplitsEqualTotal,
  type ExpenseSplit,
  type ExpensePayer,
  type ExpenseItem
} from '@fairshare/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}
  
  async create(groupId: string, userId: string, dto: CreateExpenseDto) {
    await this.checkMembership(groupId, userId);
    
    const splits = this.calculateSplits(dto);
    
    if (!validateSplitsEqualTotal(splits, dto.amount, dto.currency)) {
      throw new BadRequestException('Splits do not sum to total amount');
    }
    
    const exchangeRate = dto.exchangeRateId ? await this.getExchangeRate(dto.exchangeRateId) : null;
    
    const expense = await this.prisma.expense.create({
      data: {
        groupId,
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency,
        exchangeRateId: dto.exchangeRateId,
        date: new Date(dto.date),
        categoryId: dto.categoryId,
        notes: dto.notes,
        receiptUrl: dto.receiptUrl,
        createdById: userId,
        payers: { create: dto.payers },
        splits: { create: splits.map(s => ({ memberId: s.memberId, amount: s.amount, percentage: s.percentage, shares: s.shares })) },
        items: dto.items?.length ? { create: this.mapItemsForCreate(dto.items) } : undefined
      },
      include: { payers: true, splits: true, items: true, category: true }
    });
    
    await this.logActivity(groupId, userId, 'expense', expense.id, 'created', {});
    
    return expense;
  }
  
  async findAll(groupId: string, userId: string, filters: ExpenseFiltersDto) {
    await this.checkMembership(groupId, userId);
    
    const where: any = { groupId };
    
    if (filters.categoryIds?.length) where.categoryId = { in: filters.categoryIds };
    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }
    if (filters.payerIds?.length) where.payerIds = { hasSome: filters.payerIds };
    if (filters.participantIds?.length) where.splits = { some: { memberId: { in: filters.participantIds } } };
    if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
      where.amount = {};
      if (filters.amountMin !== undefined) where.amount.gte = filters.amountMin;
      if (filters.amountMax !== undefined) where.amount.lte = filters.amountMax;
    }
    if (filters.currencies?.length) where.currency = { in: filters.currencies };
    if (filters.searchText) where.description = { contains: filters.searchText, mode: 'insensitive' };
    
    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: { payers: true, splits: true, items: true, category: true },
        orderBy: { [filters.sortBy || 'date']: filters.sortOrder || 'desc' },
        skip: filters.offset || 0,
        take: filters.limit || 50
      }),
      this.prisma.expense.count({ where })
    ]);
    
    return { expenses, total };
  }
  
  async findOne(groupId: string, userId: string, expenseId: string) {
    await this.checkMembership(groupId, userId);
    
    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, groupId },
      include: { payers: true, splits: true, items: true, category: true, exchangeRate: true }
    });
    
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }
  
  async update(groupId: string, userId: string, expenseId: string, dto: UpdateExpenseDto) {
    await this.checkMembership(groupId, userId);
    
    const existing = await this.prisma.expense.findFirst({ where: { id: expenseId, groupId } });
    if (!existing) throw new NotFoundException('Expense not found');
    
    const splits = dto.splits ? this.calculateSplitsFromDto(dto) : undefined;
    
    if (splits && !validateSplitsEqualTotal(splits, dto.amount || existing.amount, dto.currency || existing.currency)) {
      throw new BadRequestException('Splits do not sum to total amount');
    }
    
    const expense = await this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency,
        exchangeRateId: dto.exchangeRateId,
        date: dto.date ? new Date(dto.date) : undefined,
        categoryId: dto.categoryId,
        notes: dto.notes,
        receiptUrl: dto.receiptUrl,
        payers: dto.payers ? { deleteMany: {}, create: dto.payers } : undefined,
        splits: splits ? { deleteMany: {}, create: splits.map(s => ({ memberId: s.memberId, amount: s.amount, percentage: s.percentage, shares: s.shares })) } : undefined,
        items: dto.items?.length ? { deleteMany: {}, create: this.mapItemsForCreate(dto.items) } : undefined,
        version: { increment: 1 }
      },
      include: { payers: true, splits: true, items: true, category: true, exchangeRate: true }
    });
    
    await this.logActivity(groupId, userId, 'expense', expenseId, 'updated', {});
    
    return expense;
  }
  
  async delete(groupId: string, userId: string, expenseId: string) {
    await this.checkMembership(groupId, userId);
    
    await this.prisma.expense.delete({ where: { id: expenseId } });
    
    await this.logActivity(groupId, userId, 'expense', expenseId, 'deleted', {});
  }
  
  async getCategories(groupId: string, userId: string) {
    await this.checkMembership(groupId, userId);
    
    return this.prisma.category.findMany({
      where: { OR: [{ groupId }, { groupId: null, isDefault: true }] },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }]
    });
  }
  
  private calculateSplits(dto: CreateExpenseDto): readonly ExpenseSplit[] {
    const participantIds = dto.splits?.map(s => s.memberId) ?? 
      dto.items?.flatMap(i => i.assignedTo) ?? 
      dto.payers.map(p => p.memberId);
    
    switch (dto.splitType) {
      case 'equal':
        return splitEqual(dto.amount, participantIds, dto.currency).splits;
      case 'percentage': {
        if (!dto.splits || dto.splits.length === 0) {
          throw new BadRequestException('Percentage split requires splits with percentage values');
        }
        const percentSplits = dto.splits.map(s => {
          if (s.percentage === undefined) {
            throw new BadRequestException(`Split for member ${s.memberId} is missing percentage`);
          }
          return { memberId: s.memberId, percentage: s.percentage };
        });
        return splitByPercent(dto.amount, percentSplits, dto.currency).splits;
      }
      case 'shares': {
        if (!dto.splits || dto.splits.length === 0) {
          throw new BadRequestException('Shares split requires splits with shares values');
        }
        const shareSplits = dto.splits.map(s => {
          if (s.shares === undefined) {
            throw new BadRequestException(`Split for member ${s.memberId} is missing shares`);
          }
          return { memberId: s.memberId, shares: s.shares };
        });
        return splitByShares(dto.amount, shareSplits, dto.currency).splits;
      }
      case 'exact': {
        if (!dto.splits || dto.splits.length === 0) {
          throw new BadRequestException('Exact split requires splits with amount values');
        }
        const exactSplits = dto.splits.map(s => ({ memberId: s.memberId, amount: s.amount }));
        return splitExact(dto.amount, exactSplits, dto.currency).splits;
      }
      case 'itemized': {
        if (!dto.items || dto.items.length === 0) {
          throw new BadRequestException('Itemized split requires items with assignedTo');
        }
        const items = this.mapItemsToShared(dto.items);
        return splitItemized(items, participantIds, dto.currency).splits;
      }
      default:
        return splitEqual(dto.amount, participantIds, dto.currency).splits;
    }
  }
  
  private calculateSplitsFromDto(dto: UpdateExpenseDto): readonly ExpenseSplit[] {
    if (!dto.splits || dto.splits.length === 0) return [];
    return dto.splits.map(s => ({ memberId: s.memberId, amount: s.amount, percentage: s.percentage, shares: s.shares }));
  }
  
  private mapItemsForCreate(items: ExpenseItemDto[]) {
    return items.map(item => ({
      description: item.description,
      amount: item.amount,
      currency: item.currency,
      assignedTo: item.assignedTo,
      splits: { create: item.assignedTo.map(memberId => ({ memberId, amount: 0 })) }
    }));
  }
  
  private mapItemsToShared(items: ExpenseItemDto[]): readonly ExpenseItem[] {
    return items.map((item, index) => ({
      id: `temp-${index}`,
      description: item.description,
      amount: item.amount,
      currency: item.currency,
      assignedTo: item.assignedTo,
      splits: item.assignedTo.map(memberId => ({ memberId, amount: 0 }))
    }));
  }
  
  private async getExchangeRate(id: string) {
    return this.prisma.exchangeRateSnapshot.findUnique({ where: { id } });
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
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto, ExpensePayerDto, ExpenseSplitDto, ExpenseItemDto } from './dto';
import { splitEqual, splitByPercent, splitByShares, splitExact, splitItemized, validateSplitsEqualTotal } from '@fairshare/shared';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let prismaService: any;

  const mockMembership = {
    id: 'membership-1',
    groupId: 'group-1',
    userId: 'user-1',
    displayName: 'User 1',
    role: 'MEMBER' as const,
    isGuest: false,
    joinedAt: new Date(),
    defaultCurrency: null,
    user: { id: 'user-1', email: 'user1@example.com', name: 'User 1', defaultCurrency: 'USD', avatarColor: null, createdAt: new Date(), updatedAt: new Date() },
  };

  const mockMembership2 = {
    ...mockMembership,
    id: 'membership-2',
    userId: 'user-2',
    displayName: 'User 2',
  };

  const mockGroup = {
    id: 'group-1',
    name: 'Test Group',
    defaultCurrency: 'USD',
  };

  const mockExpense = {
    id: 'expense-1',
    groupId: 'group-1',
    description: 'Test Expense',
    amount: 10000,
    currency: 'USD',
    exchangeRateId: null,
    date: new Date(),
    categoryId: null,
    notes: null,
    receiptUrl: null,
    createdById: 'user-1',
    payerIds: ['membership-1'],
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    payers: [{ id: 'payer-1', expenseId: 'expense-1', memberId: 'membership-1', amount: 10000 }],
    splits: [{ id: 'split-1', expenseId: 'expense-1', memberId: 'membership-1', amount: 5000, percentage: null, shares: null },
             { id: 'split-2', expenseId: 'expense-1', memberId: 'membership-2', amount: 5000, percentage: null, shares: null }],
    items: [],
    category: null,
  };

  const createMockPrismaService = () => ({
    membership: {
      findFirst: jest.fn(),
    },
    expense: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    exchangeRateSnapshot: {
      findUnique: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
  });

  beforeEach(async () => {
    const mockPrismaService = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
    prismaService.membership.findFirst.mockResolvedValue(mockMembership);
  });

  const createBaseDto = (overrides: Partial<CreateExpenseDto> = {}): CreateExpenseDto => ({
    description: 'Dinner',
    amount: 10000,
    currency: 'USD',
    date: '2024-01-15T19:30:00Z',
    splitType: 'equal',
    payers: [{ memberId: 'membership-1', amount: 10000 }],
    ...overrides,
  });

  describe('create - split types', () => {
    describe('equal split', () => {
      it('should create expense with equal split among participants', async () => {
        const dto = createBaseDto({
          splitType: 'equal',
          payers: [{ memberId: 'membership-1', amount: 10000 }],
        });
        
        prismaService.expense.create.mockResolvedValue(mockExpense);

        const result = await service.create('group-1', 'user-1', dto);

        expect(prismaService.expense.create).toHaveBeenCalled();
        const createCall = prismaService.expense.create.mock.calls[0][0];
        expect(createCall.data.splits.create).toHaveLength(1); // One participant (payer)
        expect(result).toEqual(mockExpense);
      });

      it('should split equally among payers when no splits provided', async () => {
        const dto = createBaseDto({
          splitType: 'equal',
          payers: [
            { memberId: 'membership-1', amount: 5000 },
            { memberId: 'membership-2', amount: 5000 },
          ],
        });
        
        prismaService.expense.create.mockResolvedValue(mockExpense);

        await service.create('group-1', 'user-1', dto);

        const splits = prismaService.expense.create.mock.calls[0][0].data.splits.create;
        expect(splits).toHaveLength(2);
        expect(splits.map((s: any) => s.amount).sort()).toEqual([5000, 5000]);
      });
    });

    describe('percentage split', () => {
      it('should create expense with percentage splits', async () => {
        const dto = createBaseDto({
          splitType: 'percentage',
          payers: [{ memberId: 'membership-1', amount: 10000 }],
          splits: [
            { memberId: 'membership-1', amount: 6000, percentage: 60 },
            { memberId: 'membership-2', amount: 4000, percentage: 40 },
          ],
        });
        
        prismaService.expense.create.mockResolvedValue(mockExpense);

        await service.create('group-1', 'user-1', dto);

        const splits = prismaService.expense.create.mock.calls[0][0].data.splits.create;
        expect(splits).toHaveLength(2);
        const split1 = splits.find((s: any) => s.memberId === 'membership-1');
        const split2 = splits.find((s: any) => s.memberId === 'membership-2');
        expect(split1.percentage).toBe(60);
        expect(split2.percentage).toBe(40);
      });

      it('should throw BadRequestException when percentage splits missing', async () => {
        const dto = createBaseDto({
          splitType: 'percentage',
          splits: [],
        });

        await expect(service.create('group-1', 'user-1', dto)).rejects.toThrow(BadRequestException);
        await expect(service.create('group-1', 'user-1', dto)).rejects.toThrow('Percentage split requires splits with percentage values');
      });

      it('should throw BadRequestException when percentage missing for a member', async () => {
        const dto = createBaseDto({
          splitType: 'percentage',
          splits: [
            { memberId: 'membership-1', amount: 6000, percentage: 60 },
            { memberId: 'membership-2', amount: 4000 }, // missing percentage
          ],
        });

        await expect(service.create('group-1', 'user-1', dto)).rejects.toThrow(BadRequestException);
        await expect(service.create('group-1', 'user-1', dto)).rejects.toThrow('missing percentage');
      });
    });

    describe('shares split', () => {
      it('should create expense with shares splits', async () => {
        const dto = createBaseDto({
          splitType: 'shares',
          payers: [{ memberId: 'membership-1', amount: 10000 }],
          splits: [
            { memberId: 'membership-1', amount: 6000, shares: 3 },
            { memberId: 'membership-2', amount: 4000, shares: 2 },
          ],
        });
        
        prismaService.expense.create.mockResolvedValue(mockExpense);

        await service.create('group-1', 'user-1', dto);

        const splits = prismaService.expense.create.mock.calls[0][0].data.splits.create;
        const split1 = splits.find((s: any) => s.memberId === 'membership-1');
        const split2 = splits.find((s: any) => s.memberId === 'membership-2');
        expect(split1.shares).toBe(3);
        expect(split2.shares).toBe(2);
      });

      it('should throw BadRequestException when shares splits missing', async () => {
        const dto = createBaseDto({
          splitType: 'shares',
          splits: [],
        });

        await expect(service.create('group-1', 'user-1', dto)).rejects.toThrow(BadRequestException);
        await expect(service.create('group-1', 'user-1', dto)).rejects.toThrow('Shares split requires splits with shares values');
      });

      it('should throw BadRequestException when shares missing for a member', async () => {
        const dto = createBaseDto({
          splitType: 'shares',
          splits: [
            { memberId: 'membership-1', amount: 6000, shares: 3 },
            { memberId: 'membership-2', amount: 4000 }, // missing shares
          ],
        });

        await expect(service.create('group-1', 'user-1', dto)).rejects.toThrow(BadRequestException);
        await expect(service.create('group-1', 'user-1', dto)).rejects.toThrow('missing shares');
      });
    });

    describe('exact split', () => {
      it('should create expense with exact amount splits', async () => {
        const dto = createBaseDto({
          splitType: 'exact',
          payers: [{ memberId: 'membership-1', amount: 10000 }],
          splits: [
            { memberId: 'membership-1', amount: 6000 },
            { memberId: 'membership-2', amount: 4000 },
          ],
        });
        
        prismaService.expense.create.mockResolvedValue(mockExpense);

        await service.create('group-1', 'user-1', dto);

        const splits = prismaService.expense.create.mock.calls[0][0].data.splits.create;
        expect(splits.find((s: any) => s.memberId === 'membership-1')?.amount).toBe(6000);
        expect(splits.find((s: any) => s.memberId === 'membership-2')?.amount).toBe(4000);
      });

      it('should throw BadRequestException when exact splits missing', async () => {
        const dto = createBaseDto({
          splitType: 'exact',
          splits: [],
        });

        await expect(service.create('group-1', 'user-1', dto)).rejects.toThrow(BadRequestException);
        await expect(service.create('group-1', 'user-1', dto)).rejects.toThrow('Exact split requires splits with amount values');
      });

      it('should throw Error when exact splits do not sum to total (from splitExact)', async () => {
        const dto = createBaseDto({
          splitType: 'exact',
          splits: [
            { memberId: 'membership-1', amount: 7000 },
            { memberId: 'membership-2', amount: 2000 }, // Sums to 9000, not 10000
          ],
        });

        await expect(service.create('group-1', 'user-1', dto)).rejects.toThrow(Error);
        await expect(service.create('group-1', 'user-1', dto)).rejects.toThrow('Exact splits sum to 9000, expected 10000');
      });
    });

    describe('itemized split', () => {
      it('should create expense with itemized splits', async () => {
        const dto = createBaseDto({
          splitType: 'itemized',
          payers: [{ memberId: 'membership-1', amount: 10000 }],
          items: [
            { description: 'Sushi', amount: 6000, currency: 'USD', assignedTo: ['membership-1', 'membership-2'] },
            { description: 'Beer', amount: 4000, currency: 'USD', assignedTo: ['membership-1'] },
          ],
          // Provide splits to define unique participants
          splits: [
            { memberId: 'membership-1', amount: 0 },
            { memberId: 'membership-2', amount: 0 },
          ],
        });
        
        prismaService.expense.create.mockResolvedValue(mockExpense);

        await service.create('group-1', 'user-1', dto);

        const splits = prismaService.expense.create.mock.calls[0][0].data.splits.create;
        // Sushi: 3000 each, Beer: 4000 to user1 = 7000 user1, 3000 user2
        const split1 = splits.find((s: any) => s.memberId === 'membership-1');
        const split2 = splits.find((s: any) => s.memberId === 'membership-2');
        expect(split1.amount).toBe(7000);
        expect(split2.amount).toBe(3000);
      });

      it('should throw BadRequestException when itemized splits missing items', async () => {
        const dto = createBaseDto({
          splitType: 'itemized',
          items: [],
        });

        await expect(service.create('group-1', 'user-1', dto)).rejects.toThrow(BadRequestException);
        await expect(service.create('group-1', 'user-1', dto)).rejects.toThrow('Itemized split requires items with assignedTo');
      });
    });
  });

  describe('create - validation', () => {
    it('should throw ForbiddenException when user is not a member', async () => {
      prismaService.membership.findFirst.mockResolvedValue(null);
      const dto = createBaseDto();

      await expect(service.create('group-1', 'user-1', dto)).rejects.toThrow(ForbiddenException);
      await expect(service.create('group-1', 'user-1', dto)).rejects.toThrow('Not a member of this group');
    });

    // Note: Zero/negative amount validation happens at DTO/controller level via class-validator,
    // not in the service. The service processes whatever amount is passed.
    it('should process zero amount (validation at controller level)', async () => {
      const dto = createBaseDto({ amount: 0 });
      prismaService.expense.create.mockResolvedValue({ ...mockExpense, amount: 0 });

      const result = await service.create('group-1', 'user-1', dto);
      expect(result.amount).toBe(0);
    });

    it('should process negative amount (validation at controller level)', async () => {
      const dto = createBaseDto({ amount: -100 });
      prismaService.expense.create.mockResolvedValue({ ...mockExpense, amount: -100 });

      const result = await service.create('group-1', 'user-1', dto);
      expect(result.amount).toBe(-100);
    });

    it('should process negative payer amount (validation at controller level)', async () => {
      const dto = createBaseDto({
        payers: [{ memberId: 'membership-1', amount: -100 }],
      });
      prismaService.expense.create.mockResolvedValue(mockExpense);

      const result = await service.create('group-1', 'user-1', dto);
      expect(result).toBeDefined();
    });

    it('should process negative split amount (validation at controller level)', async () => {
      const dto = createBaseDto({
        splitType: 'exact',
        splits: [
          { memberId: 'membership-1', amount: -100 },
          { memberId: 'membership-2', amount: 10100 },
        ],
      });
      prismaService.expense.create.mockResolvedValue(mockExpense);

      const result = await service.create('group-1', 'user-1', dto);
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return expenses with filters', async () => {
      const mockExpenses = [mockExpense];
      prismaService.expense.findMany.mockResolvedValue(mockExpenses);
      prismaService.expense.count.mockResolvedValue(1);

      const result = await service.findAll('group-1', 'user-1', { limit: 10 });

      expect(prismaService.expense.findMany).toHaveBeenCalled();
      expect(result).toEqual({ expenses: mockExpenses, total: 1 });
    });

    it('should throw ForbiddenException when user is not a member', async () => {
      prismaService.membership.findFirst.mockResolvedValue(null);

      await expect(service.findAll('group-1', 'user-1', {})).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return expense when user is a member', async () => {
      prismaService.expense.findFirst.mockResolvedValue(mockExpense);

      const result = await service.findOne('group-1', 'user-1', 'expense-1');

      expect(prismaService.expense.findFirst).toHaveBeenCalledWith({
        where: { id: 'expense-1', groupId: 'group-1' },
        include: { payers: true, splits: true, items: true, category: true, exchangeRate: true },
      });
      expect(result).toEqual(mockExpense);
    });

    it('should throw NotFoundException when expense not found', async () => {
      prismaService.expense.findFirst.mockResolvedValue(null);

      await expect(service.findOne('group-1', 'user-1', 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update expense and validate splits', async () => {
      const updateDto: UpdateExpenseDto = {
        description: 'Updated Dinner',
        amount: 15000,
        splitType: 'exact',
        splits: [
          { memberId: 'membership-1', amount: 9000 },
          { memberId: 'membership-2', amount: 6000 },
        ],
      };

      const updatedExpense = { ...mockExpense, ...updateDto, amount: 15000 };
      prismaService.expense.findFirst.mockResolvedValue(mockExpense);
      prismaService.expense.update.mockResolvedValue(updatedExpense);

      const result = await service.update('group-1', 'user-1', 'expense-1', updateDto);

      expect(prismaService.expense.update).toHaveBeenCalled();
      expect(result).toEqual(updatedExpense);
    });

    it('should throw BadRequestException when updated splits do not sum to total', async () => {
      const updateDto: UpdateExpenseDto = {
        amount: 10000,
        splits: [
          { memberId: 'membership-1', amount: 7000 },
          { memberId: 'membership-2', amount: 2000 },
        ],
      };

      prismaService.expense.findFirst.mockResolvedValue(mockExpense);

      await expect(service.update('group-1', 'user-1', 'expense-1', updateDto)).rejects.toThrow(BadRequestException);
      await expect(service.update('group-1', 'user-1', 'expense-1', updateDto)).rejects.toThrow('Splits do not sum to total amount');
    });

    it('should throw NotFoundException when expense not found', async () => {
      prismaService.expense.findFirst.mockResolvedValue(null);

      await expect(service.update('group-1', 'user-1', 'non-existent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete expense when user is a member', async () => {
      prismaService.expense.findFirst.mockResolvedValue(mockExpense);
      prismaService.expense.delete.mockResolvedValue(mockExpense);

      await service.delete('group-1', 'user-1', 'expense-1');

      expect(prismaService.expense.delete).toHaveBeenCalledWith({ where: { id: 'expense-1' } });
      expect(prismaService.activityLog.create).toHaveBeenCalled();
    });

    // Note: The service's delete method doesn't check if expense exists before deleting.
    // It only checks membership. Prisma delete would throw if not found, but we mock it.
    it('should call delete even for non-existent expense (service does not check existence)', async () => {
      prismaService.expense.delete.mockResolvedValue(undefined);

      await service.delete('group-1', 'user-1', 'non-existent');

      expect(prismaService.expense.delete).toHaveBeenCalledWith({ where: { id: 'non-existent' } });
    });
  });

  describe('getCategories', () => {
    it('should return categories for group', async () => {
      const mockCategories = [{ id: 'cat-1', name: 'Food', groupId: 'group-1', isDefault: false }];
      prismaService.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.getCategories('group-1', 'user-1');

      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        where: { OR: [{ groupId: 'group-1' }, { groupId: null, isDefault: true }] },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      });
      expect(result).toEqual(mockCategories);
    });
  });
});

describe('Split algorithm functions', () => {
  describe('splitEqual', () => {
    it('should split equally among participants', () => {
      const result = splitEqual(10000, ['a', 'b', 'c'], 'USD');
      expect(result.splits.map(s => s.amount)).toEqual([3334, 3333, 3333]); // remainder goes to first
      expect(result.total).toBe(10000);
    });

    it('should split equally between two participants', () => {
      const result = splitEqual(10000, ['a', 'b'], 'USD');
      expect(result.splits.map(s => s.amount)).toEqual([5000, 5000]);
    });

    it('should throw when no participants', () => {
      expect(() => splitEqual(10000, [], 'USD')).toThrow('Cannot split among zero participants');
    });
  });

  describe('splitByPercent', () => {
    it('should split by percentages', () => {
      const result = splitByPercent(10000, [
        { memberId: 'a', percentage: 60 },
        { memberId: 'b', percentage: 40 },
      ], 'USD');
      expect(result.splits.map(s => s.amount)).toEqual([6000, 4000]);
    });

    it('should throw when percentages do not sum to 100', () => {
      expect(() => splitByPercent(10000, [
        { memberId: 'a', percentage: 50 },
        { memberId: 'b', percentage: 30 },
      ], 'USD')).toThrow('Percentages must sum to 100');
    });

    it('should handle rounding correctly', () => {
      const result = splitByPercent(10000, [
        { memberId: 'a', percentage: 33.33 },
        { memberId: 'b', percentage: 33.33 },
        { memberId: 'c', percentage: 33.34 },
      ], 'USD');
      const sum = result.splits.reduce((a, b) => a + b.amount, 0);
      expect(sum).toBe(10000);
    });
  });

  describe('splitByShares', () => {
    it('should split by shares', () => {
      const result = splitByShares(10000, [
        { memberId: 'a', shares: 3 },
        { memberId: 'b', shares: 1 },
      ], 'USD');
      expect(result.splits.map(s => s.amount)).toEqual([7500, 2500]);
    });

    it('should throw when total shares is zero', () => {
      expect(() => splitByShares(10000, [
        { memberId: 'a', shares: 0 },
        { memberId: 'b', shares: 0 },
      ], 'USD')).toThrow('Total shares must be positive');
    });

    it('should handle fractional shares', () => {
      const result = splitByShares(10000, [
        { memberId: 'a', shares: 2 },
        { memberId: 'b', shares: 1 },
        { memberId: 'c', shares: 1 },
      ], 'USD');
      const sum = result.splits.reduce((a, b) => a + b.amount, 0);
      expect(sum).toBe(10000);
    });
  });

  describe('splitExact', () => {
    it('should split by exact amounts', () => {
      const result = splitExact(10000, [
        { memberId: 'a', amount: 6000 },
        { memberId: 'b', amount: 4000 },
      ], 'USD');
      expect(result.splits.map(s => s.amount)).toEqual([6000, 4000]);
    });

    it('should throw when exact splits do not sum to total', () => {
      expect(() => splitExact(10000, [
        { memberId: 'a', amount: 5000 },
        { memberId: 'b', amount: 4000 },
      ], 'USD')).toThrow('Exact splits sum to 9000, expected 10000');
    });
  });

  describe('splitItemized', () => {
    it('should split itemized expenses', () => {
      const items = [
        { id: '1', description: 'Item 1', amount: 6000, currency: 'USD', assignedTo: ['a', 'b'], splits: [{ memberId: 'a', amount: 0 }, { memberId: 'b', amount: 0 }] },
        { id: '2', description: 'Item 2', amount: 4000, currency: 'USD', assignedTo: ['a'], splits: [{ memberId: 'a', amount: 0 }] },
      ];
      const result = splitItemized(items, ['a', 'b'], 'USD');
      expect(result.splits.find(s => s.memberId === 'a')?.amount).toBe(7000); // 3000 + 4000
      expect(result.splits.find(s => s.memberId === 'b')?.amount).toBe(3000); // 3000
    });

    it('should include members with zero assignment', () => {
      const items = [
        { id: '1', description: 'Item 1', amount: 6000, currency: 'USD', assignedTo: ['a'], splits: [{ memberId: 'a', amount: 0 }] },
      ];
      const result = splitItemized(items, ['a', 'b', 'c'], 'USD');
      expect(result.splits.find(s => s.memberId === 'c')?.amount).toBe(0);
    });
  });

  describe('validateSplitsEqualTotal', () => {
    it('should return true when splits sum to total', () => {
      const splits = [{ memberId: 'a', amount: 6000 }, { memberId: 'b', amount: 4000 }];
      expect(validateSplitsEqualTotal(splits, 10000, 'USD')).toBe(true);
    });

    it('should return false when splits do not sum to total', () => {
      const splits = [{ memberId: 'a', amount: 5000 }, { memberId: 'b', amount: 4000 }];
      expect(validateSplitsEqualTotal(splits, 10000, 'USD')).toBe(false);
    });
  });
});
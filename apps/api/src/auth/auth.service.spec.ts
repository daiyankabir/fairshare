import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto, LoginDto, ClaimGuestDto } from './dto';

// Mock argon2
jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    name: 'Test User',
    defaultCurrency: 'USD',
    avatarColor: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    inviteToken: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    membership: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'new@example.com',
      password: 'securePassword123',
      name: 'New User',
      defaultCurrency: 'USD',
    };

    it('should register a new user successfully', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');
      prismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(argon2.hash).toHaveBeenCalledWith(registerDto.password);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          passwordHash: 'hashed-password',
          name: registerDto.name,
          defaultCurrency: registerDto.defaultCurrency,
        },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          defaultCurrency: mockUser.defaultCurrency,
          avatarColor: mockUser.avatarColor,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
        token: 'mock-jwt-token',
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('Email already registered');
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should use default currency USD when not provided', async () => {
      const dtoWithoutCurrency = { ...registerDto, defaultCurrency: undefined };
      prismaService.user.findUnique.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');
      prismaService.user.create.mockResolvedValue({ ...mockUser, defaultCurrency: 'USD' });

      await service.register(dtoWithoutCurrency);

      expect(prismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ defaultCurrency: 'USD' }),
        })
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'securePassword123',
    };

    it('should login successfully with valid credentials', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(argon2.verify).toHaveBeenCalledWith(mockUser.passwordHash, loginDto.password);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          defaultCurrency: mockUser.defaultCurrency,
          avatarColor: mockUser.avatarColor,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
        token: 'mock-jwt-token',
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
      expect(argon2.verify).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('claimGuest', () => {
    const claimGuestDto: ClaimGuestDto = {
      email: 'guest@example.com',
      password: 'securePassword123',
      name: 'Guest User',
      guestToken: 'valid-token',
      defaultCurrency: 'USD',
    };

    const mockInviteToken = {
      token: 'valid-token',
      groupId: 'group-1',
      role: 'MEMBER',
      usedAt: null,
      expiresAt: null,
      createdById: 'user-1',
      group: { id: 'group-1', name: 'Test Group' },
    };

    it('should claim guest account successfully', async () => {
      prismaService.inviteToken.findUnique.mockResolvedValue(mockInviteToken);
      prismaService.user.findUnique.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');
      prismaService.user.create.mockResolvedValue({ ...mockUser, id: 'user-2', email: claimGuestDto.email });
      prismaService.membership.create.mockResolvedValue({});
      prismaService.inviteToken.update.mockResolvedValue({});

      const result = await service.claimGuest(claimGuestDto);

      expect(prismaService.inviteToken.findUnique).toHaveBeenCalledWith({
        where: { token: claimGuestDto.guestToken },
        include: { group: true },
      });
      expect(prismaService.user.create).toHaveBeenCalled();
      expect(prismaService.membership.create).toHaveBeenCalledWith({
        data: {
          groupId: mockInviteToken.groupId,
          userId: 'user-2',
          displayName: claimGuestDto.name,
          role: mockInviteToken.role,
          isGuest: false,
        },
      });
      expect(prismaService.inviteToken.update).toHaveBeenCalledWith({
        where: { token: claimGuestDto.guestToken },
        data: { usedAt: expect.any(Date), usedById: 'user-2' },
      });
      expect(result.user.email).toBe(claimGuestDto.email);
      expect(result.token).toBe('mock-jwt-token');
    });

    it('should throw UnauthorizedException when invite token is invalid', async () => {
      prismaService.inviteToken.findUnique.mockResolvedValue(null);

      await expect(service.claimGuest(claimGuestDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.claimGuest(claimGuestDto)).rejects.toThrow('Invalid invite token');
    });

    it('should throw UnauthorizedException when invite token already used', async () => {
      prismaService.inviteToken.findUnique.mockResolvedValue({
        ...mockInviteToken,
        usedAt: new Date(),
      });

      await expect(service.claimGuest(claimGuestDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.claimGuest(claimGuestDto)).rejects.toThrow('Invite token already used');
    });

    it('should throw UnauthorizedException when invite token expired', async () => {
      prismaService.inviteToken.findUnique.mockResolvedValue({
        ...mockInviteToken,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.claimGuest(claimGuestDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.claimGuest(claimGuestDto)).rejects.toThrow('Invite token expired');
    });

    it('should throw ConflictException when email already registered', async () => {
      prismaService.inviteToken.findUnique.mockResolvedValue(mockInviteToken);
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.claimGuest(claimGuestDto)).rejects.toThrow(ConflictException);
      await expect(service.claimGuest(claimGuestDto)).rejects.toThrow('Email already registered');
    });
  });

  describe('validateUser', () => {
    it('should return sanitized user when user exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-1');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(mockUser.id);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('non-existent')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      prismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-1', { name: 'Updated Name' });

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Updated Name' },
      });
      expect(result.name).toBe('Updated Name');
      expect(result).not.toHaveProperty('passwordHash');
    });
  });
});
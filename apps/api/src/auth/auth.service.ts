import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto, LoginDto, ClaimGuestDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}
  
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        defaultCurrency: dto.defaultCurrency || 'USD'
      }
    });
    
    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }
  
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    
    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    
    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }
  
  async claimGuest(dto: ClaimGuestDto) {
    const inviteToken = await this.prisma.inviteToken.findUnique({
      where: { token: dto.guestToken },
      include: { group: true }
    });
    
    if (!inviteToken) throw new UnauthorizedException('Invalid invite token');
    if (inviteToken.usedAt) throw new UnauthorizedException('Invite token already used');
    if (inviteToken.expiresAt && inviteToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invite token expired');
    }
    
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        defaultCurrency: dto.defaultCurrency || 'USD'
      }
    });
    
    await this.prisma.membership.create({
      data: {
        groupId: inviteToken.groupId,
        userId: user.id,
        displayName: dto.name,
        role: inviteToken.role,
        isGuest: false
      }
    });
    
    await this.prisma.inviteToken.update({
      where: { token: dto.guestToken },
      data: { usedAt: new Date(), usedById: user.id }
    });
    
    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }
  
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.sanitizeUser(user);
  }
  
  async updateProfile(userId: string, data: { name?: string; defaultCurrency?: string; avatarColor?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data
    });
    return this.sanitizeUser(user);
  }
  
  private generateToken(user: any) {
    return this.jwtService.sign({ sub: user.id, email: user.email });
  }
  
  private sanitizeUser(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
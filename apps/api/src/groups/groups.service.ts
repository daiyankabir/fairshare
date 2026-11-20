import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto, InviteMemberDto } from './dto';
import { Prisma } from '@prisma/client';

export interface GroupWithRelations {
  id: string;
  name: string;
  defaultCurrency: string;
  coverEmoji: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  memberships: Array<{
    id: string;
    groupId: string;
    userId: string | null;
    displayName: string;
    role: 'OWNER' | 'MEMBER' | 'GUEST';
    isGuest: boolean;
    joinedAt: Date;
    defaultCurrency: string | null;
    user: { id: string; email: string; name: string; defaultCurrency: string; avatarColor: string | null; createdAt: Date; updatedAt: Date } | null;
  }>;
  _count: { expenses: number; memberships: number; settlements: number };
}

export interface GroupWithMemberInfo extends GroupWithRelations {
  myRole: 'OWNER' | 'MEMBER' | 'GUEST';
  isGuest: boolean;
}

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}
  
  async create(userId: string, dto: CreateGroupDto) {
    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        defaultCurrency: dto.defaultCurrency || 'USD',
        coverEmoji: dto.coverEmoji,
        memberships: {
          create: {
            userId,
            displayName: dto.ownerName || 'You',
            role: 'OWNER',
            isGuest: false
          }
        }
      },
      include: { memberships: true }
    });
    
    await this.logActivity(group.id, userId, 'group', group.id, 'created', {});
    
    return group;
  }
  
  async findAll(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId, group: { isArchived: false } },
      include: {
        group: {
          include: {
            memberships: { where: { userId: { not: userId } }, take: 3, include: { user: true } },
            _count: { select: { expenses: true, memberships: true } }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });
    
    return memberships.map(m => ({
      ...m.group,
      myRole: m.role,
      isGuest: m.isGuest
    })) as GroupWithMemberInfo[];
  }
  
  async findOne(groupId: string, userId: string) {
    const membership = await this.getMembership(groupId, userId);
    if (!membership) throw new NotFoundException('Group not found');
    
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        memberships: { include: { user: true } },
        _count: { select: { expenses: true, settlements: true } }
      }
    });
    
    if (!group) throw new NotFoundException('Group not found');
    
    return { ...group, myRole: membership.role, isGuest: membership.isGuest } as GroupWithMemberInfo;
  }
  
  async update(groupId: string, userId: string, dto: UpdateGroupDto) {
    await this.checkPermission(groupId, userId, ['OWNER']);
    
    const group = await this.prisma.group.update({
      where: { id: groupId },
      data: {
        name: dto.name,
        defaultCurrency: dto.defaultCurrency,
        coverEmoji: dto.coverEmoji,
        isArchived: dto.isArchived
      }
    });
    
    await this.logActivity(groupId, userId, 'group', groupId, 'updated', {});
    
    return group;
  }
  
  async delete(groupId: string, userId: string) {
    await this.checkPermission(groupId, userId, ['OWNER']);
    
    await this.prisma.group.delete({ where: { id: groupId } });
  }
  
  async getMembers(groupId: string, userId: string) {
    await this.getMembership(groupId, userId);
    
    return this.prisma.membership.findMany({
      where: { groupId },
      include: { user: true },
      orderBy: [{ role: 'desc' }, { joinedAt: 'asc' }]
    });
  }
  
  async inviteMember(groupId: string, userId: string, dto: InviteMemberDto) {
    await this.checkPermission(groupId, userId, ['OWNER', 'MEMBER']);
    
    const token = await this.prisma.inviteToken.create({
      data: {
        groupId,
        role: dto.role || 'MEMBER',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdById: userId
      }
    });
    
    return { token: token.token, inviteUrl: `${process.env.FRONTEND_URL}/join/${token.token}` };
  }
  
  async revokeInvite(groupId: string, userId: string, token: string) {
    await this.checkPermission(groupId, userId, ['OWNER']);
    
    await this.prisma.inviteToken.delete({ where: { token } });
  }
  
  async removeMember(groupId: string, userId: string, memberId: string) {
    const membership = await this.checkPermission(groupId, userId, ['OWNER']);
    
    if (membership.id === memberId) throw new ForbiddenException('Cannot remove yourself');
    
    await this.prisma.membership.delete({ where: { id: memberId } });
  }
  
  async updateMemberRole(groupId: string, userId: string, memberId: string, role: 'OWNER' | 'MEMBER') {
    await this.checkPermission(groupId, userId, ['OWNER']);
    
    return this.prisma.membership.update({
      where: { id: memberId },
      data: { role }
    });
  }
  
  private async getMembership(groupId: string, userId: string) {
    return this.prisma.membership.findFirst({
      where: { groupId, userId }
    });
  }
  
  private async checkPermission(groupId: string, userId: string, allowedRoles: string[]) {
    const membership = await this.getMembership(groupId, userId);
    if (!membership) throw new NotFoundException('Group not found');
    if (!allowedRoles.includes(membership.role)) throw new ForbiddenException('Insufficient permissions');
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
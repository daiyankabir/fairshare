import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto, InviteMemberDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { GroupWithMemberInfo } from './groups.service';

@ApiTags('groups')
@Controller('groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}
  
  @Post()
  @ApiOperation({ summary: 'Create group' })
  create(@Request() req: any, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(req.user.sub, dto);
  }
  
  @Get()
  @ApiOperation({ summary: 'List user groups' })
  findAll(@Request() req: any): Promise<GroupWithMemberInfo[]> {
    return this.groupsService.findAll(req.user.sub);
  }
  
  @Get(':id')
  @ApiOperation({ summary: 'Get group details' })
  findOne(@Request() req: any, @Param('id') id: string): Promise<GroupWithMemberInfo> {
    return this.groupsService.findOne(id, req.user.sub);
  }
  
  @Patch(':id')
  @ApiOperation({ summary: 'Update group' })
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, req.user.sub, dto);
  }
  
  @Delete(':id')
  @ApiOperation({ summary: 'Delete group' })
  delete(@Request() req: any, @Param('id') id: string) {
    return this.groupsService.delete(id, req.user.sub);
  }
  
  @Get(':id/members')
  @ApiOperation({ summary: 'List group members' })
  getMembers(@Request() req: any, @Param('id') id: string) {
    return this.groupsService.getMembers(id, req.user.sub);
  }
  
  @Post(':id/invite')
  @ApiOperation({ summary: 'Invite member' })
  inviteMember(@Request() req: any, @Param('id') id: string, @Body() dto: InviteMemberDto) {
    return this.groupsService.inviteMember(id, req.user.sub, dto);
  }
  
  @Delete(':id/invite/:token')
  @ApiOperation({ summary: 'Revoke invite' })
  revokeInvite(@Request() req: any, @Param('id') id: string, @Param('token') token: string) {
    return this.groupsService.revokeInvite(id, req.user.sub, token);
  }
  
  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove member' })
  removeMember(@Request() req: any, @Param('id') id: string, @Param('memberId') memberId: string) {
    return this.groupsService.removeMember(id, req.user.sub, memberId);
  }
  
  @Patch(':id/members/:memberId/role')
  @ApiOperation({ summary: 'Update member role' })
  updateMemberRole(@Request() req: any, @Param('id') id: string, @Param('memberId') memberId: string, @Body() dto: { role: 'OWNER' | 'MEMBER' }) {
    return this.groupsService.updateMemberRole(id, req.user.sub, memberId, dto.role);
  }
}
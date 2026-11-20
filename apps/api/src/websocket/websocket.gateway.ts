import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:4200', credentials: true },
  namespace: '/ws'
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private userSockets = new Map<string, Set<string>>();
  private socketGroups = new Map<string, Set<string>>();
  
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}
  
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }
      
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      
      client.data.userId = userId;
      
      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
      this.userSockets.get(userId)!.add(client.id);
      
      const memberships = await this.prisma.membership.findMany({
        where: { userId },
        select: { groupId: true }
      });
      
      for (const m of memberships) {
        client.join(`group:${m.groupId}`);
        if (!this.socketGroups.has(client.id)) this.socketGroups.set(client.id, new Set());
        this.socketGroups.get(client.id)!.add(m.groupId);
      }
      
      client.join(`user:${userId}`);
      
      console.log(`Client connected: ${client.id} (user: ${userId})`);
    } catch (error) {
      client.disconnect();
    }
  }
  
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) this.userSockets.delete(userId);
    }
    this.socketGroups.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }
  
  @SubscribeMessage('joinGroup')
  async handleJoinGroup(@ConnectedSocket() client: Socket, @MessageBody() data: { groupId: string }) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Not authenticated' };
    
    const membership = await this.prisma.membership.findFirst({
      where: { groupId: data.groupId, userId }
    });
    
    if (!membership) return { error: 'Not a member of this group' };
    
    client.join(`group:${data.groupId}`);
    if (!this.socketGroups.has(client.id)) this.socketGroups.set(client.id, new Set());
    this.socketGroups.get(client.id)!.add(data.groupId);
    
    return { success: true };
  }
  
  @SubscribeMessage('leaveGroup')
  handleLeaveGroup(@ConnectedSocket() client: Socket, @MessageBody() data: { groupId: string }) {
    client.leave(`group:${data.groupId}`);
    this.socketGroups.get(client.id)?.delete(data.groupId);
    return { success: true };
  }
  
  broadcastToGroup(groupId: string, event: string, data: any) {
    this.server.to(`group:${groupId}`).emit(event, data);
  }
  
  broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
  
  notifyExpenseCreated(groupId: string, expense: any) {
    this.broadcastToGroup(groupId, 'expense:created', expense);
  }
  
  notifyExpenseUpdated(groupId: string, expense: any) {
    this.broadcastToGroup(groupId, 'expense:updated', expense);
  }
  
  notifyExpenseDeleted(groupId: string, expenseId: string) {
    this.broadcastToGroup(groupId, 'expense:deleted', { id: expenseId });
  }
  
  notifySettlementCreated(groupId: string, settlement: any) {
    this.broadcastToGroup(groupId, 'settlement:created', settlement);
  }
  
  notifyMemberJoined(groupId: string, member: any) {
    this.broadcastToGroup(groupId, 'member:joined', member);
  }
  
  notifyMemberLeft(groupId: string, memberId: string) {
    this.broadcastToGroup(groupId, 'member:left', { memberId });
  }
  
  notifyGroupUpdated(groupId: string, group: any) {
    this.broadcastToGroup(groupId, 'group:updated', group);
  }
}
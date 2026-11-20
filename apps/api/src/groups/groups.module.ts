import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService, PrismaService, WebsocketGateway],
  exports: [GroupsService]
})
export class GroupsModule {}
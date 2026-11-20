import { Module } from '@nestjs/common';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Module({
  controllers: [SettlementsController],
  providers: [SettlementsService, PrismaService, WebsocketGateway],
  exports: [SettlementsService]
})
export class SettlementsModule {}
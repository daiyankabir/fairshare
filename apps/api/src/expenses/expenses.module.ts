import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, PrismaService, WebsocketGateway],
  exports: [ExpensesService]
})
export class ExpensesModule {}
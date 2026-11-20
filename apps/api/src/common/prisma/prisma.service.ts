import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  
  async onModuleDestroy() {
    await this.$disconnect();
  }
  
  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase cannot be run in production');
    }
    
    const modelNames = Object.keys(this).filter(
      (key): key is string => 
        typeof key === 'string' && 
        !key.startsWith('_') && 
        !key.startsWith('$')
    );
    
    for (const modelName of modelNames) {
      const model = (this as Record<string, unknown>)[modelName];
      if (model && typeof model === 'object' && 'deleteMany' in model && typeof model.deleteMany === 'function') {
        await model.deleteMany();
      }
    }
  }
}
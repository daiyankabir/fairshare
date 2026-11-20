// Jest setup file
import { ConfigModule } from '@nestjs/config';

// Load environment variables for tests
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env.test',
});

// Mock console methods to reduce noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
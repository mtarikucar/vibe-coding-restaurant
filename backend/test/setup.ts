import 'reflect-metadata';

// Global test setup
beforeAll(async () => {
  // Setup global test environment
});

afterAll(async () => {
  // Cleanup global test environment
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

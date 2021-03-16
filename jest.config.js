module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Global beforeAll tests
  // globalSetup: `${__dirname}/tests/globalSetup.ts`,
  // Global afterAll tests
  // globalTeardown: `${__dirname}/tests/globalTeardown.ts`,
  // Only run TypeScript tests.
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
  ],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.test.json',
      diagnostics: false, // Disabling diagnostics
      // pathRegex: /\.(spec|test)\.ts$/, // Disabling by pathRegex
    },
  },
};

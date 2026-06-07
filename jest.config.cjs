/** @type {import('jest').Config} */
const tsProject = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { noUnusedLocals: false } }],
  },
};

module.exports = {
  projects: [
    {
      ...tsProject,
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.spec.ts'],
    },
    {
      ...tsProject,
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.spec.ts'],
    },
    {
      ...tsProject,
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.spec.ts'],
    },
  ],
};

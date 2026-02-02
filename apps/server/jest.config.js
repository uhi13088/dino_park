/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.module.ts', '!**/main.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@dino-park/shared$': '<rootDir>/../../../packages/shared/dist',
    '^@dino-park/game-data$': '<rootDir>/../../../packages/game-data/dist',
  },
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  testTimeout: 10000,
};

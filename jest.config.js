const $path = require('path');

process.env.TEST_ENV = 'jest';

module.exports = {
  verbose: true,
  rootDir: $path.resolve(__dirname, './'),
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'vue', 'json'],
  globals: {
    'ts-jest': {
      tsconfig: {
        target: 'es5',
        module: 'commonjs',
      },
    },
  },
  transform: {
    '.*\\.js$': 'babel-jest',
    '.*\\.tsx?$': 'ts-jest',
  },
  transformIgnorePatterns: [],
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/test/mock/style.js',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '.history',
  ],
};

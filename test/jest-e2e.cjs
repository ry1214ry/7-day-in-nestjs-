/** End-to-end test configuration: specs live in test/. */
const path = require('path');

module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.e2e-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node10',
          ignoreDeprecations: '6.0',
        },
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFiles: [path.join(__dirname, 'setup.ts')],
};
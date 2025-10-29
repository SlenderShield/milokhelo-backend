/**
 * Test Configuration
 * Mocha configuration for ES modules
 */
module.exports = {
  require: ['test/helpers/setup.js'],
  recursive: true,
  timeout: 5000,
  spec: ['test/**/*.test.js'],
  'node-option': ['no-warnings'],
};

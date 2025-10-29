/**
 * Example Module - Infrastructure Layer
 */
const ExampleModel = require('./ExampleModel');
const ExampleRepository = require('./ExampleRepository');
const ExampleController = require('./ExampleController');
const createExampleRoutes = require('./ExampleRoutes');

module.exports = {
  ExampleModel,
  ExampleRepository,
  ExampleController,
  createExampleRoutes,
};

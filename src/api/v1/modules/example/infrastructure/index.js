/**
 * Example Module - Infrastructure Layer
 */
import ExampleModel from './persistence/ExampleModel.js';
import ExampleRepository from './persistence/ExampleRepository.js';
import ExampleController from './http/ExampleController.js';
import createExampleRoutes from './http/ExampleRoutes.js';

export { ExampleModel, ExampleRepository, ExampleController, createExampleRoutes };

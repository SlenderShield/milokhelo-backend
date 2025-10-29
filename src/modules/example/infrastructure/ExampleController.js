/**
 * Example Controller
 * Handles HTTP requests for the example module
 */
import { asyncHandler } from '../../../shared/utils/index.js';
import { HTTP_STATUS } from '../../../shared/constants/index.js';

class ExampleController {
  constructor(exampleService, logger) {
    this.exampleService = exampleService;
    this.logger = logger.child({ context: 'ExampleController' });
  }

  create() {
    return asyncHandler(async (req, res) => {
      const { name, description } = req.body;

      const entity = await this.exampleService.create({ name, description });

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: entity,
      });
    });
  }

  findById() {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;

      const entity = await this.exampleService.findById(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: entity,
      });
    });
  }

  findAll() {
    return asyncHandler(async (req, res) => {
      const entities = await this.exampleService.findAll();

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: entities,
      });
    });
  }

  update() {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { name, description } = req.body;

      const entity = await this.exampleService.update(id, { name, description });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: entity,
      });
    });
  }

  delete() {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;

      await this.exampleService.delete(id);

      res.status(HTTP_STATUS.NO_CONTENT).send();
    });
  }
}

export default ExampleController;

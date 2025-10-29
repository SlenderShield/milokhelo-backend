/**
 * Admin Controller
 */
import { asyncHandler, HTTP_STATUS } from '../../../../../../core/http/index.js';

class AdminController {
  constructor(logger) {
    this.logger = logger.child({ context: 'AdminController' });
  }

  getReports() {
    return asyncHandler(async (_req, res) => {
      // TODO: Implement admin reports
      res.status(HTTP_STATUS.OK).json({ message: 'Admin reports endpoint - TODO' });
    });
  }
}

export default AdminController;

/**
 * Maps Controller
 */
import { asyncHandler, HTTP_STATUS } from '@/core/http/index.js';

class MapsController {
  constructor(mapsService, logger) {
    this.mapsService = mapsService;
    this.logger = logger.child({ context: 'MapsController' });
  }

  getNearby() {
    return asyncHandler(async (req, res) => {
      const { lat, lng, radius } = req.query;
      const venues = await this.mapsService.getNearbyVenues(
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(radius || 5)
      );
      res.status(HTTP_STATUS.OK).json(venues);
    });
  }

  submitLocation() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { entityType, entityId, name, lat, lng, address } = req.body;
      const location = await this.mapsService.submitLocation(
        entityType,
        entityId,
        { name, lat, lng, address },
        userId
      );
      res.status(HTTP_STATUS.CREATED).json(location);
    });
  }

  getLocation() {
    return asyncHandler(async (req, res) => {
      const { entityType, entityId } = req.params;
      const location = await this.mapsService.getLocation(entityType, entityId);
      res.status(HTTP_STATUS.OK).json(location);
    });
  }
}

export default MapsController;

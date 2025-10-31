/**
 * Maps Controller
 */
import { asyncHandler, HTTP_STATUS } from '@/core/http/index.js';
import { MapsDTO } from '@/common/dto/index.js';

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
      const safeVenues = venues.map((v) => MapsDTO.transformForMap(v));
      res.status(HTTP_STATUS.OK).json(safeVenues);
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
      const safeLocation = MapsDTO.transform(location, { includeTimestamps: true });
      res.status(HTTP_STATUS.CREATED).json(safeLocation);
    });
  }

  getLocation() {
    return asyncHandler(async (req, res) => {
      const { entityType, entityId } = req.params;
      const location = await this.mapsService.getLocation(entityType, entityId);
      const safeLocation = MapsDTO.transform(location, { includeTimestamps: true });
      res.status(HTTP_STATUS.OK).json(safeLocation);
    });
  }
}

export default MapsController;

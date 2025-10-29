/**
 * Maps Repository
 */
import { LocationModel } from './MapsModel.js';

class MapsRepository {
  constructor(logger) {
    this.logger = logger.child({ context: 'MapsRepository' });
  }

  async createLocation(data) {
    const location = new LocationModel(data);
    await location.save();
    return location.toObject();
  }

  async findByEntity(entityType, entityId) {
    return LocationModel.findOne({ entityType, entityId }).lean();
  }

  async findNearby(lat, lng, radius) {
    // Using MongoDB geospatial query
    return LocationModel.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: radius * 1000, // Convert km to meters
        },
      },
    }).lean();
  }
}

export default MapsRepository;

/**
 * Maps/Location DTO (Data Transfer Object)
 * Transforms Maps location model data for safe client consumption
 */
import BaseDTO from './BaseDTO.js';

class MapsDTO extends BaseDTO {
  static transformOne(location, options = {}) {
    if (!location) return null;

    const safe = {
      id: location._id?.toString(),
      name: location.name,
      type: location.type,
      address: location.address,
      coordinates: location.coordinates,
      description: location.description,
      sports: location.sports,
      facilities: location.facilities,
      rating: location.rating,
      images: location.images,
      isVerified: location.isVerified,
      submittedBy: location.submittedBy?.toString(),
    };

    if (options.includeTimestamps) {
      safe.createdAt = location.createdAt;
      safe.updatedAt = location.updatedAt;
    }

    return this.clean(safe);
  }

  /**
   * Transform location for map markers
   */
  static transformForMap(location) {
    if (!location) return null;

    const obj = location.toObject ? location.toObject() : location;

    return this.clean({
      id: obj._id?.toString(),
      name: obj.name,
      type: obj.type,
      coordinates: obj.coordinates,
      sports: obj.sports,
      rating: obj.rating,
    });
  }
}

export default MapsDTO;

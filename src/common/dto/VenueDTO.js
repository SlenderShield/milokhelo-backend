/**
 * Venue DTO (Data Transfer Object)
 * Transforms Venue model data for safe client consumption
 */
import BaseDTO from './BaseDTO.js';

class VenueDTO extends BaseDTO {
  static transformOne(venue, options = {}) {
    if (!venue) return null;

    const safe = {
      id: venue._id?.toString(),
      name: venue.name,
      description: venue.description,
      address: venue.address,
      city: venue.city,
      location: venue.location,
      sports: venue.sports,
      facilities: venue.facilities,
      pricing: venue.pricing,
      availability: venue.availability,
      ownerId: venue.ownerId?.toString(),
      images: venue.images,
      rating: venue.rating,
      reviews: venue.reviews,
      contactInfo: venue.contactInfo,
      operatingHours: venue.operatingHours,
      isActive: venue.isActive,
      isVerified: venue.isVerified,
    };

    if (options.includeTimestamps) {
      safe.createdAt = venue.createdAt;
      safe.updatedAt = venue.updatedAt;
    }

    return this.clean(safe);
  }

  /**
   * Transform venue with minimal data (for lists/map markers)
   */
  static transformMinimal(venue) {
    if (!venue) return null;

    const obj = venue.toObject ? venue.toObject() : venue;

    return this.clean({
      id: obj._id?.toString(),
      name: obj.name,
      address: obj.address,
      city: obj.city,
      location: obj.location,
      sports: obj.sports,
      rating: obj.rating,
      images: obj.images?.[0], // First image only
    });
  }
}

export default VenueDTO;

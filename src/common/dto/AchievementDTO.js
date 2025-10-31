/**
 * Achievement DTO (Data Transfer Object)
 * Transforms Achievement model data for safe client consumption
 */
import BaseDTO from './BaseDTO.js';

class AchievementDTO extends BaseDTO {
  static transformOne(achievement, options = {}) {
    if (!achievement) return null;

    const safe = {
      id: achievement._id?.toString(),
      code: achievement.code,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      sport: achievement.sport,
      rarity: achievement.rarity,
      points: achievement.points,
      criteria: achievement.criteria,
      // User-specific fields if this is a user's earned achievement
      earnedAt: achievement.earnedAt,
      progress: achievement.progress,
    };

    if (options.includeTimestamps) {
      safe.createdAt = achievement.createdAt;
      safe.updatedAt = achievement.updatedAt;
    }

    return this.clean(safe);
  }

  /**
   * Transform achievement for catalog/list view
   */
  static transformMinimal(achievement) {
    if (!achievement) return null;

    const obj = achievement.toObject ? achievement.toObject() : achievement;

    return this.clean({
      id: obj._id?.toString(),
      code: obj.code,
      name: obj.name,
      description: obj.description,
      icon: obj.icon,
      category: obj.category,
      rarity: obj.rarity,
      points: obj.points,
    });
  }
}

export default AchievementDTO;

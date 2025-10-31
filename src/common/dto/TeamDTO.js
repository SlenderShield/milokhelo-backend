/**
 * Team DTO (Data Transfer Object)
 * Transforms Team model data for safe client consumption
 */
import BaseDTO from './BaseDTO.js';

class TeamDTO extends BaseDTO {
  static transformOne(team, options = {}) {
    if (!team) return null;

    const safe = {
      id: team._id?.toString(),
      name: team.name,
      sport: team.sport,
      description: team.description,
      captainId: team.captainId?.toString(),
      members: team.members?.map((member) => ({
        userId: member.userId?._id ? member.userId._id.toString() : member.userId?.toString(),
        role: member.role,
        joinedAt: member.joinedAt,
        // Include populated user data if available
        ...(member.userId?.name && {
          user: {
            id: member.userId._id.toString(),
            name: member.userId.name,
            username: member.userId.username,
            avatar: member.userId.avatar,
          },
        }),
      })),
      joinCode: options.isCaptain || options.isMember ? team.joinCode : undefined,
      stats: team.stats,
      avatar: team.avatar,
      isPrivate: team.isPrivate,
    };

    if (options.includeTimestamps) {
      safe.createdAt = team.createdAt;
      safe.updatedAt = team.updatedAt;
    }

    return this.clean(safe);
  }

  /**
   * Transform team with minimal data (for lists)
   */
  static transformMinimal(team) {
    if (!team) return null;

    const obj = team.toObject ? team.toObject() : team;

    return this.clean({
      id: obj._id?.toString(),
      name: obj.name,
      sport: obj.sport,
      avatar: obj.avatar,
      stats: obj.stats,
      memberCount: obj.members?.length || 0,
    });
  }
}

export default TeamDTO;

/**
 * Match DTO (Data Transfer Object)
 * Transforms Match model data for safe client consumption
 */
import BaseDTO from './BaseDTO.js';

class MatchDTO extends BaseDTO {
  static transformOne(match, options = {}) {
    if (!match) return null;

    const safe = {
      id: match._id?.toString(),
      title: match.title,
      sport: match.sport,
      sportCategory: match.sportCategory,
      type: match.type,
      organizerId: match.organizerId?.toString(),
      startAt: match.startAt,
      endAt: match.endAt,
      location: match.location,
      maxPlayers: match.maxPlayers,
      skillLevel: match.skillLevel,
      entryFee: match.entryFee,
      prize: match.prize,
      teamBased: match.teamBased,
      visibility: match.visibility,
      status: match.status,
      participants:
        match.participants?.map((p) => (p._id ? p._id.toString() : p.toString())) || [],
      teams: match.teams?.map((t) => (t._id ? t._id.toString() : t.toString())) || [],
      scores: match.scores ? Object.fromEntries(match.scores) : {},
      chatRoomId: match.chatRoomId?.toString(),
      cancelReason: match.cancelReason,
      participantCount: match.participants?.length || 0,
      isFull:
        match.maxPlayers && match.participants ? match.participants.length >= match.maxPlayers : false,
    };

    if (options.includeTimestamps) {
      safe.createdAt = match.createdAt;
      safe.updatedAt = match.updatedAt;
    }

    return this.clean(safe);
  }

  /**
   * Transform match with minimal data (for lists/cards)
   */
  static transformMinimal(match) {
    if (!match) return null;

    const obj = match.toObject ? match.toObject() : match;

    return this.clean({
      id: obj._id?.toString(),
      title: obj.title,
      sport: obj.sport,
      type: obj.type,
      startAt: obj.startAt,
      location: obj.location?.venue || obj.location?.address,
      maxPlayers: obj.maxPlayers,
      participantCount: obj.participants?.length || 0,
      status: obj.status,
      skillLevel: obj.skillLevel,
    });
  }
}

export default MatchDTO;

/**
 * Tournament DTO (Data Transfer Object)
 * Transforms Tournament model data for safe client consumption
 */
import BaseDTO from './BaseDTO.js';

class TournamentDTO extends BaseDTO {
  static transformOne(tournament, options = {}) {
    if (!tournament) return null;

    const safe = {
      id: tournament._id?.toString(),
      name: tournament.name,
      sport: tournament.sport,
      description: tournament.description,
      format: tournament.format,
      organizerId: tournament.organizerId?.toString(),
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      registrationDeadline: tournament.registrationDeadline,
      maxTeams: tournament.maxTeams,
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      status: tournament.status,
      visibility: tournament.visibility,
      registeredTeams:
        tournament.registeredTeams?.map((t) => (t._id ? t._id.toString() : t.toString())) || [],
      bracket: tournament.bracket,
      standings: tournament.standings,
      location: tournament.location,
      rules: tournament.rules,
      teamCount: tournament.registeredTeams?.length || 0,
      isFull:
        tournament.maxTeams && tournament.registeredTeams
          ? tournament.registeredTeams.length >= tournament.maxTeams
          : false,
    };

    if (options.includeTimestamps) {
      safe.createdAt = tournament.createdAt;
      safe.updatedAt = tournament.updatedAt;
    }

    return this.clean(safe);
  }

  /**
   * Transform tournament with minimal data (for lists)
   */
  static transformMinimal(tournament) {
    if (!tournament) return null;

    const obj = tournament.toObject ? tournament.toObject() : tournament;

    return this.clean({
      id: obj._id?.toString(),
      name: obj.name,
      sport: obj.sport,
      format: obj.format,
      startDate: obj.startDate,
      status: obj.status,
      teamCount: obj.registeredTeams?.length || 0,
      maxTeams: obj.maxTeams,
    });
  }
}

export default TournamentDTO;

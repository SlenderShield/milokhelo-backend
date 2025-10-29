/**
 * Tournament Service
 */
export class TournamentService {
  constructor(tournamentRepository, eventBus, logger) {
    this.tournamentRepository = tournamentRepository;
    this.eventBus = eventBus;
    this.logger = logger.child({ context: 'TournamentService' });
  }

  async createTournament(data, organizerId) {
    const tournament = await this.tournamentRepository.create({ ...data, organizerId });
    await this.eventBus.publish('tournament.created', { tournamentId: tournament._id });
    return tournament;
  }

  async getTournamentById(id) {
    return this.tournamentRepository.findById(id);
  }

  async listTournaments(filters = {}) {
    return this.tournamentRepository.find(filters);
  }

  async updateTournament(id, data, userId) {
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament || tournament.organizerId.toString() !== userId) {
      throw new Error('Not authorized');
    }
    return this.tournamentRepository.update(id, data);
  }

  async cancelTournament(id, userId) {
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament || tournament.organizerId.toString() !== userId) {
      throw new Error('Not authorized');
    }
    await this.tournamentRepository.update(id, { status: 'cancelled' });
    await this.eventBus.publish('tournament.cancelled', { tournamentId: id });
  }

  async registerTeam(tournamentId, teamId) {
    await this.tournamentRepository.addTeam(tournamentId, teamId);
    await this.eventBus.publish('tournament.team_registered', { tournamentId, teamId });
  }

  async startTournament(tournamentId, userId) {
    const tournament = await this.tournamentRepository.findById(tournamentId);
    if (!tournament || tournament.organizerId.toString() !== userId) {
      throw new Error('Not authorized');
    }
    // TODO: Generate brackets
    await this.tournamentRepository.update(tournamentId, { status: 'ongoing', currentRound: 1 });
    await this.eventBus.publish('tournament.started', { tournamentId });
    return { message: 'Tournament started, brackets generated' };
  }
}

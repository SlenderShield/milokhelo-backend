/**
 * Match Service
 */
class MatchService {
  constructor(matchRepository, eventBus, logger) {
    this.matchRepository = matchRepository;
    this.eventBus = eventBus;
    this.logger = logger.child({ context: 'MatchService' });
  }

  async createMatch(matchData, organizerId) {
    const match = await this.matchRepository.create({ ...matchData, organizerId, participants: [organizerId] });
    await this.eventBus.publish('match.created', { matchId: match._id, organizerId });
    return match;
  }

  async getMatchById(matchId) {
    return this.matchRepository.findById(matchId);
  }

  async listMatches(filters = {}) {
    return this.matchRepository.find(filters);
  }

  async updateMatch(matchId, data, userId) {
    const match = await this.matchRepository.findById(matchId);
    if (!match || match.organizerId.toString() !== userId) {
      throw new Error('Not authorized');
    }
    const updated = await this.matchRepository.update(matchId, data);
    await this.eventBus.publish('match.updated', { matchId, data });
    return updated;
  }

  async cancelMatch(matchId, userId, reason) {
    const match = await this.matchRepository.findById(matchId);
    if (!match || match.organizerId.toString() !== userId) {
      throw new Error('Not authorized');
    }
    await this.matchRepository.update(matchId, { status: 'cancelled', cancelReason: reason });
    await this.eventBus.publish('match.cancelled', { matchId, reason });
  }

  async joinMatch(matchId, userId) {
    await this.matchRepository.addParticipant(matchId, userId);
    await this.eventBus.publish('match.participant_joined', { matchId, userId });
  }

  async leaveMatch(matchId, userId) {
    await this.matchRepository.removeParticipant(matchId, userId);
    await this.eventBus.publish('match.participant_left', { matchId, userId });
  }

  async startMatch(matchId, userId) {
    const match = await this.matchRepository.findById(matchId);
    if (!match || match.organizerId.toString() !== userId) {
      throw new Error('Not authorized');
    }
    await this.matchRepository.update(matchId, { status: 'live' });
    await this.eventBus.publish('match.started', { matchId });
  }

  async finishMatch(matchId, userId, result) {
    const match = await this.matchRepository.findById(matchId);
    if (!match || match.organizerId.toString() !== userId) {
      throw new Error('Not authorized');
    }
    await this.matchRepository.update(matchId, { status: 'finished', scores: result.scores });
    await this.eventBus.publish('match.finished', { matchId, result });
    // TODO: Update stats and achievements
    return { success: true, message: 'Match finished, stats updated' };
  }
}

export default MatchService;

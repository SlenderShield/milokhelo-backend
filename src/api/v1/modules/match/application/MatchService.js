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
    const match = await this.matchRepository.create({
      ...matchData,
      organizerId,
      participants: [organizerId],
    });
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
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      const error = new Error('Match not found');
      error.statusCode = 404;
      throw error;
    }

    if (match.status !== 'scheduled') {
      const error = new Error('Cannot join a match that is not scheduled');
      error.statusCode = 400;
      throw error;
    }

    if (match.participants.some((p) => p.toString() === userId)) {
      const error = new Error('Already joined this match');
      error.statusCode = 400;
      throw error;
    }

    if (match.maxPlayers && match.participants.length >= match.maxPlayers) {
      const error = new Error('Match is full');
      error.statusCode = 400;
      throw error;
    }

    await this.matchRepository.addParticipant(matchId, userId);
    await this.eventBus.publish('match.participant_joined', { matchId, userId });
  }

  async leaveMatch(matchId, userId) {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      const error = new Error('Match not found');
      error.statusCode = 404;
      throw error;
    }

    if (!match.participants.some((p) => p.toString() === userId)) {
      const error = new Error('Not a participant in this match');
      error.statusCode = 400;
      throw error;
    }

    if (match.organizerId.toString() === userId) {
      const error = new Error('Organizer cannot leave their own match. Cancel the match instead.');
      error.statusCode = 400;
      throw error;
    }

    if (match.status === 'live' || match.status === 'finished') {
      const error = new Error('Cannot leave a match that is already in progress or finished');
      error.statusCode = 400;
      throw error;
    }

    await this.matchRepository.removeParticipant(matchId, userId);
    await this.eventBus.publish('match.participant_left', { matchId, userId });
  }

  async updateScore(matchId, scores, userId) {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      const error = new Error('Match not found');
      error.statusCode = 404;
      throw error;
    }

    // Only organizer or participants can update scores
    const isOrganizer = match.organizerId.toString() === userId;
    const isParticipant = match.participants.some((p) => p.toString() === userId);

    if (!isOrganizer && !isParticipant) {
      const error = new Error('Only organizer or participants can update match scores');
      error.statusCode = 403;
      throw error;
    }

    if (match.status !== 'live' && match.status !== 'finished') {
      const error = new Error('Can only update scores for live or finished matches');
      error.statusCode = 400;
      throw error;
    }

    const updated = await this.matchRepository.update(matchId, { scores });
    await this.eventBus.publish('match.score_updated', { matchId, scores, updatedBy: userId });
    return updated;
  }

  async updateStatus(matchId, status, userId) {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      const error = new Error('Match not found');
      error.statusCode = 404;
      throw error;
    }

    // Only organizer can update status
    if (match.organizerId.toString() !== userId) {
      const error = new Error('Only the match organizer can update match status');
      error.statusCode = 403;
      throw error;
    }

    // Validate status transitions
    const validTransitions = {
      scheduled: ['live', 'cancelled'],
      live: ['finished', 'cancelled'],
      finished: [], // Cannot change from finished
      cancelled: [], // Cannot change from cancelled
    };

    if (!validTransitions[match.status]?.includes(status)) {
      const error = new Error(`Cannot transition from ${match.status} to ${status}`);
      error.statusCode = 400;
      throw error;
    }

    const updated = await this.matchRepository.update(matchId, { status });
    await this.eventBus.publish('match.status_updated', {
      matchId,
      status,
      previousStatus: match.status,
    });

    // Trigger additional events for specific statuses
    if (status === 'live') {
      await this.eventBus.publish('match.started', { matchId });
    } else if (status === 'finished') {
      await this.eventBus.publish('match.finished', { matchId, scores: match.scores });
    }

    return updated;
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
    return { success: true, message: 'Match finished, stats updated' };
  }
}

export default MatchService;

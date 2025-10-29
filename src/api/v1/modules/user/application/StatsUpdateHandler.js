/**
 * Stats Update Handler
 * Handles automatic stats updates when matches finish
 */
class StatsUpdateHandler {
  constructor(userRepository, matchRepository, logger) {
    this.userRepository = userRepository;
    this.matchRepository = matchRepository;
    this.logger = logger.child({ context: 'StatsUpdateHandler' });
  }

  /**
   * Handle match.finished event
   * Updates stats for all participants based on match results
   */
  async handleMatchFinished({ matchId, result }) {
    try {
      this.logger.info('Processing match finished event', { matchId });

      // Fetch the complete match details
      const match = await this.matchRepository.findById(matchId);
      if (!match) {
        this.logger.error('Match not found', { matchId });
        return;
      }

      // Validate match has finished and has scores
      if (match.status !== 'finished' || !match.scores) {
        this.logger.warn('Match is not finished or has no scores', { matchId, status: match.status });
        return;
      }

      // Update stats for each participant
      const updatePromises = match.participants.map(async (participantId) => {
        try {
          await this.updateParticipantStats(match, participantId.toString(), result);
        } catch (error) {
          this.logger.error('Failed to update stats for participant', {
            matchId,
            participantId,
            error: error.message,
          });
        }
      });

      await Promise.all(updatePromises);

      this.logger.info('Successfully updated stats for match', {
        matchId,
        participantCount: match.participants.length,
      });
    } catch (error) {
      this.logger.error('Error handling match finished event', {
        matchId,
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Update stats for a single participant
   */
  async updateParticipantStats(match, participantId, _result) {
    const sport = match.sport;
    const scores = match.scores || {};

    // Determine match outcome for this participant
    const outcome = this.determineOutcome(match, participantId, scores);

    // Calculate stats increment
    const statsIncrement = this.calculateStatsIncrement(outcome, scores, participantId, match);

    // Update user stats
    await this.userRepository.updateStats(participantId, sport, statsIncrement);

    this.logger.debug('Updated participant stats', {
      participantId,
      sport,
      outcome,
      statsIncrement,
    });
  }

  /**
   * Determine match outcome for a participant (win/loss/draw)
   */
  determineOutcome(match, participantId, scores) {
    // Handle team-based matches
    if (match.teamBased && match.teams && match.teams.length > 0) {
      return this.determineTeamOutcome(match, participantId, scores);
    }

    // Handle individual matches
    return this.determineIndividualOutcome(participantId, scores);
  }

  /**
   * Determine outcome for team-based matches
   */
  determineTeamOutcome(match, participantId, scores) {
    // Find which team the participant belongs to
    // Note: This is a simplified implementation
    // In a real scenario, you'd need to check team membership
    const teamIds = match.teams.map((t) => t.toString());
    const scoresArray = Object.entries(scores).map(([teamId, score]) => ({
      teamId,
      score: parseInt(score, 10) || 0,
    }));

    if (scoresArray.length < 2) {
      return 'draw'; // Not enough data
    }

    // Sort by score
    scoresArray.sort((a, b) => b.score - a.score);

    // Check for draw
    if (scoresArray[0].score === scoresArray[1].score) {
      return 'draw';
    }

    // For simplicity, assume participant is on first team if they're organizer
    // In production, you'd lookup actual team membership
    const participantTeamIndex = participantId === match.organizerId.toString() ? 0 : 1;
    const participantTeamId = teamIds[participantTeamIndex] || teamIds[0];

    return scoresArray[0].teamId === participantTeamId ? 'win' : 'loss';
  }

  /**
   * Determine outcome for individual matches
   */
  determineIndividualOutcome(participantId, scores) {
    const scoresArray = Object.entries(scores).map(([playerId, score]) => ({
      playerId,
      score: parseInt(score, 10) || 0,
    }));

    if (scoresArray.length === 0) {
      return 'draw';
    }

    // Sort by score descending
    scoresArray.sort((a, b) => b.score - a.score);

    // Find participant's score
    const participantScore = scoresArray.find((s) => s.playerId === participantId);
    if (!participantScore) {
      return 'draw'; // Participant not found in scores
    }

    const highestScore = scoresArray[0].score;

    // Check for draw (multiple players with highest score)
    const winnersCount = scoresArray.filter((s) => s.score === highestScore).length;
    if (winnersCount > 1 && participantScore.score === highestScore) {
      return 'draw';
    }

    // Check for win
    if (participantScore.score === highestScore) {
      return 'win';
    }

    return 'loss';
  }

  /**
   * Calculate stats increment based on match outcome
   */
  calculateStatsIncrement(outcome, scores, participantId, match) {
    const increment = {
      matchesPlayed: 1,
      wins: 0,
      losses: 0,
      draws: 0,
      goalsScored: 0,
      assists: 0,
      fouls: 0,
    };

    // Update win/loss/draw
    if (outcome === 'win') {
      increment.wins = 1;
      increment.streak = 1; // Positive streak
    } else if (outcome === 'loss') {
      increment.losses = 1;
      increment.streak = -1; // Negative streak (will reset to -1)
    } else {
      increment.draws = 1;
      // Draws don't affect streak in this implementation
    }

    // Extract participant-specific stats from scores if available
    const participantScore = scores[participantId];
    if (participantScore) {
      if (typeof participantScore === 'number') {
        increment.goalsScored = participantScore;
      } else if (typeof participantScore === 'object') {
        // Handle detailed score object
        increment.goalsScored = participantScore.goals || 0;
        increment.assists = participantScore.assists || 0;
        increment.fouls = participantScore.fouls || 0;
      }
    }

    // Calculate ELO rating change (simplified)
    const eloChange = this.calculateEloChange(outcome, match.type);
    if (eloChange !== 0) {
      increment.elo = eloChange;
    }

    return increment;
  }

  /**
   * Calculate ELO rating change based on outcome
   * Simplified implementation - in production, use proper ELO algorithm
   */
  calculateEloChange(outcome, matchType) {
    const K_FACTOR_FRIENDLY = 16;
    const K_FACTOR_COMPETITIVE = 32;

    const kFactor = matchType === 'competitive' ? K_FACTOR_COMPETITIVE : K_FACTOR_FRIENDLY;

    if (outcome === 'win') {
      return kFactor;
    } else if (outcome === 'loss') {
      return -kFactor;
    }

    return 0; // No change for draw
  }
}

export default StatsUpdateHandler;

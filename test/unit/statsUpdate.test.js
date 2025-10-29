/**
 * Stats Update Tests
 * Tests for automatic stats updates on match finish
 */
import { describe, it, beforeEach } from 'mocha';
import '../helpers/setup.js';
import StatsUpdateHandler from '@/modules/user/application/StatsUpdateHandler.js';

describe('StatsUpdateHandler', () => {
  let handler;
  let mockUserRepository;
  let mockMatchRepository;
  let mockLogger;

  beforeEach(() => {
    mockUserRepository = {
      updateStats: sinon.stub().resolves({}),
    };

    mockMatchRepository = {
      findById: sinon.stub(),
    };

    mockLogger = {
      child: () => mockLogger,
      info: sinon.stub(),
      debug: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
    };

    handler = new StatsUpdateHandler(mockUserRepository, mockMatchRepository, mockLogger);
  });

  describe('handleMatchFinished', () => {
    it('should update stats for all participants when match finishes', async () => {
      const matchId = 'match123';
      const match = {
        _id: matchId,
        sport: 'football',
        status: 'finished',
        type: 'competitive',
        teamBased: false,
        participants: ['user1', 'user2', 'user3'],
        scores: {
          user1: 5,
          user2: 3,
          user3: 2,
        },
      };

      mockMatchRepository.findById.resolves(match);

      await handler.handleMatchFinished({ matchId, result: {} });

      expect(mockMatchRepository.findById.calledWith(matchId)).to.be.true;
      expect(mockUserRepository.updateStats.callCount).to.equal(3);
    });

    it('should not update stats if match is not finished', async () => {
      const matchId = 'match123';
      const match = {
        _id: matchId,
        sport: 'football',
        status: 'live',
        participants: ['user1', 'user2'],
        scores: {},
      };

      mockMatchRepository.findById.resolves(match);

      await handler.handleMatchFinished({ matchId, result: {} });

      expect(mockUserRepository.updateStats.called).to.be.false;
      expect(mockLogger.warn.called).to.be.true;
    });

    it('should handle match not found', async () => {
      mockMatchRepository.findById.resolves(null);

      await handler.handleMatchFinished({ matchId: 'invalid', result: {} });

      expect(mockUserRepository.updateStats.called).to.be.false;
      expect(mockLogger.error.called).to.be.true;
    });
  });

  describe('determineIndividualOutcome', () => {
    it('should correctly identify winner in individual match', () => {
      const scores = {
        user1: 10,
        user2: 8,
        user3: 5,
      };

      const outcome = handler.determineIndividualOutcome('user1', scores);
      expect(outcome).to.equal('win');
    });

    it('should correctly identify loser in individual match', () => {
      const scores = {
        user1: 10,
        user2: 8,
        user3: 5,
      };

      const outcome = handler.determineIndividualOutcome('user3', scores);
      expect(outcome).to.equal('loss');
    });

    it('should identify draw when multiple players have highest score', () => {
      const scores = {
        user1: 10,
        user2: 10,
        user3: 5,
      };

      const outcome1 = handler.determineIndividualOutcome('user1', scores);
      const outcome2 = handler.determineIndividualOutcome('user2', scores);

      expect(outcome1).to.equal('draw');
      expect(outcome2).to.equal('draw');
    });

    it('should return draw if participant not found in scores', () => {
      const scores = {
        user1: 10,
        user2: 8,
      };

      const outcome = handler.determineIndividualOutcome('user3', scores);
      expect(outcome).to.equal('draw');
    });
  });

  describe('calculateStatsIncrement', () => {
    const match = {
      type: 'competitive',
      sport: 'football',
    };

    it('should calculate correct increment for win', () => {
      const increment = handler.calculateStatsIncrement('win', { user1: 5 }, 'user1', match);

      expect(increment.matchesPlayed).to.equal(1);
      expect(increment.wins).to.equal(1);
      expect(increment.losses).to.equal(0);
      expect(increment.draws).to.equal(0);
      expect(increment.goalsScored).to.equal(5);
      expect(increment.streak).to.equal(1);
      expect(increment.elo).to.equal(32); // Competitive match K-factor
    });

    it('should calculate correct increment for loss', () => {
      const increment = handler.calculateStatsIncrement('loss', { user1: 2 }, 'user1', match);

      expect(increment.matchesPlayed).to.equal(1);
      expect(increment.wins).to.equal(0);
      expect(increment.losses).to.equal(1);
      expect(increment.draws).to.equal(0);
      expect(increment.goalsScored).to.equal(2);
      expect(increment.streak).to.equal(-1);
      expect(increment.elo).to.equal(-32);
    });

    it('should calculate correct increment for draw', () => {
      const increment = handler.calculateStatsIncrement('draw', { user1: 3 }, 'user1', match);

      expect(increment.matchesPlayed).to.equal(1);
      expect(increment.wins).to.equal(0);
      expect(increment.losses).to.equal(0);
      expect(increment.draws).to.equal(1);
      expect(increment.goalsScored).to.equal(3);
      expect(increment.elo).to.be.undefined; // Draw doesn't change ELO
    });

    it('should handle detailed score object with assists and fouls', () => {
      const scores = {
        user1: {
          goals: 5,
          assists: 3,
          fouls: 2,
        },
      };

      const increment = handler.calculateStatsIncrement('win', scores, 'user1', match);

      expect(increment.goalsScored).to.equal(5);
      expect(increment.assists).to.equal(3);
      expect(increment.fouls).to.equal(2);
    });

    it('should use lower ELO change for friendly matches', () => {
      const friendlyMatch = { ...match, type: 'friendly' };
      const increment = handler.calculateStatsIncrement('win', { user1: 5 }, 'user1', friendlyMatch);

      expect(increment.elo).to.equal(16); // Friendly match K-factor
    });
  });

  describe('calculateEloChange', () => {
    it('should return positive change for win in competitive match', () => {
      const eloChange = handler.calculateEloChange('win', 'competitive');
      expect(eloChange).to.equal(32);
    });

    it('should return negative change for loss in competitive match', () => {
      const eloChange = handler.calculateEloChange('loss', 'competitive');
      expect(eloChange).to.equal(-32);
    });

    it('should return zero for draw', () => {
      const eloChange = handler.calculateEloChange('draw', 'competitive');
      expect(eloChange).to.equal(0);
    });

    it('should return smaller change for friendly matches', () => {
      const eloChange = handler.calculateEloChange('win', 'friendly');
      expect(eloChange).to.equal(16);
    });
  });

  describe('updateParticipantStats', () => {
    it('should call updateStats with correct parameters', async () => {
      const match = {
        sport: 'basketball',
        type: 'competitive',
        teamBased: false,
        participants: ['user1', 'user2'],
        scores: {
          user1: 25,
          user2: 20,
        },
      };

      await handler.updateParticipantStats(match, 'user1', {});

      expect(mockUserRepository.updateStats.called).to.equal(true);
      const call = mockUserRepository.updateStats.getCall(0);
      expect(call.args[0]).to.equal('user1');
      expect(call.args[1]).to.equal('basketball');
      expect(call.args[2].matchesPlayed).to.equal(1);
      expect(call.args[2].wins).to.equal(1);
      expect(call.args[2].goalsScored).to.equal(25);
    });

    it('should handle missing scores gracefully', async () => {
      const match = {
        sport: 'tennis',
        type: 'friendly',
        teamBased: false,
        participants: ['user1', 'user2'],
        scores: {},
      };

      await handler.updateParticipantStats(match, 'user1', {});

      expect(mockUserRepository.updateStats.called).to.equal(true);
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      const matchId = 'match123';
      const match = {
        _id: matchId,
        sport: 'football',
        status: 'finished',
        participants: ['user1'],
        scores: { user1: 5 },
      };

      mockMatchRepository.findById.resolves(match);
      mockUserRepository.updateStats.rejects(new Error('Database error'));

      await handler.handleMatchFinished({ matchId, result: {} });

      expect(mockLogger.error.called).to.equal(true);
    });

    it('should continue processing other participants if one fails', async () => {
      const matchId = 'match123';
      const match = {
        _id: matchId,
        sport: 'football',
        status: 'finished',
        participants: ['user1', 'user2'],
        scores: { user1: 5, user2: 3 },
      };

      mockMatchRepository.findById.resolves(match);
      mockUserRepository.updateStats
        .onFirstCall().rejects(new Error('Failed for user1'))
        .onSecondCall().resolves({});

      await handler.handleMatchFinished({ matchId, result: {} });

      expect(mockUserRepository.updateStats.callCount).to.equal(2);
      expect(mockLogger.error.called).to.equal(true);
    });
  });

  describe('team-based matches', () => {
    it('should handle team-based match outcomes', () => {
      const match = {
        teamBased: true,
        teams: ['team1', 'team2'],
        organizerId: 'user1',
      };

      const scores = {
        team1: 3,
        team2: 1,
      };

      const outcome = handler.determineTeamOutcome(match, 'user1', scores);
      expect(outcome).to.equal('win');
    });

    it('should identify draw in team-based matches', () => {
      const match = {
        teamBased: true,
        teams: ['team1', 'team2'],
        organizerId: 'user1',
      };

      const scores = {
        team1: 2,
        team2: 2,
      };

      const outcome = handler.determineTeamOutcome(match, 'user1', scores);
      expect(outcome).to.equal('draw');
    });
  });
});

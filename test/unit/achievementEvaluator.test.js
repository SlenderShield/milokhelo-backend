/**
 * Achievement Evaluator Unit Tests
 */
import { describe, it, beforeEach } from 'mocha';
import assert from 'node:assert';
import AchievementEvaluator from '@/modules/user/application/AchievementEvaluator.js';

describe('AchievementEvaluator', () => {
  let evaluator;
  let mockUserRepository;
  let mockAchievementRepository;
  let mockEventBus;
  let mockLogger;
  let publishedEvents;

  beforeEach(() => {
    publishedEvents = [];

    mockUserRepository = {
      getAchievements: async () => [],
      getUserStats: async () => [],
      addAchievement: async (userId, achievementId) => ({ userId, achievementId }),
    };

    mockAchievementRepository = {
      findAll: async () => [],
    };

    mockEventBus = {
      publish: async (event, data) => {
        publishedEvents.push({ event, data });
      },
    };

    mockLogger = {
      child: () => mockLogger,
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    };

    evaluator = new AchievementEvaluator(
      mockUserRepository,
      mockAchievementRepository,
      mockEventBus,
      mockLogger
    );
  });

  describe('evaluateCriteria', () => {
    describe('stat_threshold criteria', () => {
      it('should pass when stat meets threshold', () => {
        const achievement = {
          _id: 'ach1',
          sport: 'football',
          criteria: {
            type: 'stat_threshold',
            field: 'wins',
            operator: '>=',
            value: 10,
          },
        };

        const userStats = [
          { sport: 'football', wins: 15, matchesPlayed: 20 },
        ];

        const result = evaluator.evaluateCriteria(achievement, userStats, 'football');
        assert.strictEqual(result, true);
      });

      it('should fail when stat does not meet threshold', () => {
        const achievement = {
          _id: 'ach1',
          sport: 'football',
          criteria: {
            type: 'stat_threshold',
            field: 'wins',
            operator: '>=',
            value: 10,
          },
        };

        const userStats = [
          { sport: 'football', wins: 5, matchesPlayed: 20 },
        ];

        const result = evaluator.evaluateCriteria(achievement, userStats, 'football');
        assert.strictEqual(result, false);
      });

      it('should work with different operators', () => {
        const achievement = {
          _id: 'ach1',
          sport: 'all',
          criteria: {
            type: 'stat_threshold',
            field: 'elo',
            operator: '>',
            value: 1500,
          },
        };

        const userStats = [
          { sport: 'football', elo: 1600 },
        ];

        const result = evaluator.evaluateCriteria(achievement, userStats);
        assert.strictEqual(result, true);
      });
    });

    describe('stat_total criteria', () => {
      it('should sum stats across all sports', () => {
        const achievement = {
          _id: 'ach1',
          sport: 'all',
          criteria: {
            type: 'stat_total',
            field: 'wins',
            operator: '>=',
            value: 50,
          },
        };

        const userStats = [
          { sport: 'football', wins: 30 },
          { sport: 'basketball', wins: 25 },
        ];

        const result = evaluator.evaluateCriteria(achievement, userStats);
        assert.strictEqual(result, true);
      });

      it('should fail when total does not meet requirement', () => {
        const achievement = {
          _id: 'ach1',
          sport: 'all',
          criteria: {
            type: 'stat_total',
            field: 'wins',
            operator: '>=',
            value: 100,
          },
        };

        const userStats = [
          { sport: 'football', wins: 30 },
          { sport: 'basketball', wins: 25 },
        ];

        const result = evaluator.evaluateCriteria(achievement, userStats);
        assert.strictEqual(result, false);
      });
    });

    describe('ratio criteria', () => {
      it('should calculate win rate correctly', () => {
        const achievement = {
          _id: 'ach1',
          sport: 'football',
          criteria: {
            type: 'ratio',
            numerator: 'wins',
            denominator: 'matchesPlayed',
            operator: '>=',
            value: 0.75,
          },
        };

        const userStats = [
          { sport: 'football', wins: 15, matchesPlayed: 20 },
        ];

        const result = evaluator.evaluateCriteria(achievement, userStats, 'football');
        assert.strictEqual(result, true);
      });

      it('should fail when ratio is below threshold', () => {
        const achievement = {
          _id: 'ach1',
          sport: 'football',
          criteria: {
            type: 'ratio',
            numerator: 'wins',
            denominator: 'matchesPlayed',
            operator: '>=',
            value: 0.75,
          },
        };

        const userStats = [
          { sport: 'football', wins: 10, matchesPlayed: 20 },
        ];

        const result = evaluator.evaluateCriteria(achievement, userStats, 'football');
        assert.strictEqual(result, false);
      });

      it('should handle zero denominator', () => {
        const achievement = {
          _id: 'ach1',
          sport: 'football',
          criteria: {
            type: 'ratio',
            numerator: 'wins',
            denominator: 'matchesPlayed',
            operator: '>=',
            value: 0.75,
          },
        };

        const userStats = [
          { sport: 'football', wins: 0, matchesPlayed: 0 },
        ];

        const result = evaluator.evaluateCriteria(achievement, userStats, 'football');
        assert.strictEqual(result, false);
      });
    });

    describe('streak criteria', () => {
      it('should detect winning streak', () => {
        const achievement = {
          _id: 'ach1',
          sport: 'football',
          criteria: {
            type: 'streak',
            streakType: 'winning',
            operator: '>=',
            value: 5,
          },
        };

        const userStats = [
          { sport: 'football', streak: 7 },
        ];

        const result = evaluator.evaluateCriteria(achievement, userStats, 'football');
        assert.strictEqual(result, true);
      });

      it('should not detect winning streak when streak is negative', () => {
        const achievement = {
          _id: 'ach1',
          sport: 'football',
          criteria: {
            type: 'streak',
            streakType: 'winning',
            operator: '>=',
            value: 5,
          },
        };

        const userStats = [
          { sport: 'football', streak: -7 },
        ];

        const result = evaluator.evaluateCriteria(achievement, userStats, 'football');
        assert.strictEqual(result, false);
      });

      it('should detect losing streak', () => {
        const achievement = {
          _id: 'ach1',
          sport: 'football',
          criteria: {
            type: 'streak',
            streakType: 'losing',
            operator: '>=',
            value: 5,
          },
        };

        const userStats = [
          { sport: 'football', streak: -7 },
        ];

        const result = evaluator.evaluateCriteria(achievement, userStats, 'football');
        assert.strictEqual(result, true);
      });

      it('should handle any streak type', () => {
        const achievement = {
          _id: 'ach1',
          sport: 'football',
          criteria: {
            type: 'streak',
            operator: '>=',
            value: 5,
          },
        };

        const userStats = [
          { sport: 'football', streak: -7 },
        ];

        const result = evaluator.evaluateCriteria(achievement, userStats, 'football');
        assert.strictEqual(result, true);
      });
    });

    describe('composite criteria', () => {
      it('should evaluate AND logic correctly', () => {
        const achievement = {
          _id: 'ach1',
          sport: 'football',
          criteria: {
            type: 'composite',
            logic: 'AND',
            conditions: [
              {
                type: 'ratio',
                numerator: 'wins',
                denominator: 'matchesPlayed',
                operator: '>=',
                value: 0.6,
              },
              {
                type: 'stat_threshold',
                field: 'matchesPlayed',
                operator: '>=',
                value: 20,
              },
            ],
          },
        };

        const userStats = [
          { sport: 'football', wins: 15, matchesPlayed: 25 },
        ];

        const result = evaluator.evaluateCriteria(achievement, userStats, 'football');
        assert.strictEqual(result, true);
      });

      it('should fail AND logic when one condition fails', () => {
        const achievement = {
          _id: 'ach1',
          sport: 'football',
          criteria: {
            type: 'composite',
            logic: 'AND',
            conditions: [
              {
                type: 'ratio',
                numerator: 'wins',
                denominator: 'matchesPlayed',
                operator: '>=',
                value: 0.6,
              },
              {
                type: 'stat_threshold',
                field: 'matchesPlayed',
                operator: '>=',
                value: 50,
              },
            ],
          },
        };

        const userStats = [
          { sport: 'football', wins: 15, matchesPlayed: 25 },
        ];

        const result = evaluator.evaluateCriteria(achievement, userStats, 'football');
        assert.strictEqual(result, false);
      });

      it('should evaluate OR logic correctly', () => {
        const achievement = {
          _id: 'ach1',
          sport: 'football',
          criteria: {
            type: 'composite',
            logic: 'OR',
            conditions: [
              {
                type: 'stat_threshold',
                field: 'wins',
                operator: '>=',
                value: 100,
              },
              {
                type: 'stat_threshold',
                field: 'elo',
                operator: '>=',
                value: 1500,
              },
            ],
          },
        };

        const userStats = [
          { sport: 'football', wins: 50, elo: 1600 },
        ];

        const result = evaluator.evaluateCriteria(achievement, userStats, 'football');
        assert.strictEqual(result, true);
      });
    });

    describe('sport filtering', () => {
      it('should filter by achievement sport', () => {
        const achievement = {
          _id: 'ach1',
          sport: 'football',
          criteria: {
            type: 'stat_threshold',
            field: 'wins',
            operator: '>=',
            value: 10,
          },
        };

        const userStats = [
          { sport: 'football', wins: 5 },
          { sport: 'basketball', wins: 15 },
        ];

        const result = evaluator.evaluateCriteria(achievement, userStats);
        assert.strictEqual(result, false);
      });

      it('should check all sports when achievement sport is "all"', () => {
        const achievement = {
          _id: 'ach1',
          sport: 'all',
          criteria: {
            type: 'stat_threshold',
            field: 'wins',
            operator: '>=',
            value: 10,
          },
        };

        const userStats = [
          { sport: 'football', wins: 5 },
          { sport: 'basketball', wins: 15 },
        ];

        const result = evaluator.evaluateCriteria(achievement, userStats);
        assert.strictEqual(result, true);
      });
    });
  });

  describe('compareValues', () => {
    it('should handle >= operator', () => {
      assert.strictEqual(evaluator.compareValues(10, '>=', 10), true);
      assert.strictEqual(evaluator.compareValues(11, '>=', 10), true);
      assert.strictEqual(evaluator.compareValues(9, '>=', 10), false);
    });

    it('should handle > operator', () => {
      assert.strictEqual(evaluator.compareValues(11, '>', 10), true);
      assert.strictEqual(evaluator.compareValues(10, '>', 10), false);
    });

    it('should handle <= operator', () => {
      assert.strictEqual(evaluator.compareValues(10, '<=', 10), true);
      assert.strictEqual(evaluator.compareValues(9, '<=', 10), true);
      assert.strictEqual(evaluator.compareValues(11, '<=', 10), false);
    });

    it('should handle < operator', () => {
      assert.strictEqual(evaluator.compareValues(9, '<', 10), true);
      assert.strictEqual(evaluator.compareValues(10, '<', 10), false);
    });

    it('should handle == operator', () => {
      assert.strictEqual(evaluator.compareValues(10, '==', 10), true);
      assert.strictEqual(evaluator.compareValues(11, '==', 10), false);
    });

    it('should handle != operator', () => {
      assert.strictEqual(evaluator.compareValues(11, '!=', 10), true);
      assert.strictEqual(evaluator.compareValues(10, '!=', 10), false);
    });
  });

  describe('evaluateAchievements', () => {
    it('should award new achievements that meet criteria', async () => {
      const userId = 'user1';
      const achievements = [
        {
          _id: 'ach1',
          name: 'First Victory',
          sport: 'all',
          criteria: {
            type: 'stat_threshold',
            field: 'wins',
            operator: '>=',
            value: 1,
          },
          points: 10,
        },
      ];

      const userStats = [
        { sport: 'football', wins: 1, matchesPlayed: 1 },
      ];

      mockAchievementRepository.findAll = async () => achievements;
      mockUserRepository.getUserStats = async () => userStats;
      mockUserRepository.getAchievements = async () => [];

      const awarded = await evaluator.evaluateAchievements(userId, 'football');

      assert.strictEqual(awarded.length, 1);
      assert.strictEqual(awarded[0].name, 'First Victory');
      assert.strictEqual(publishedEvents.length, 1);
      assert.strictEqual(publishedEvents[0].event, 'user.achievement_awarded');
    });

    it('should not award achievements user already has', async () => {
      const userId = 'user1';
      const achievements = [
        {
          _id: 'ach1',
          name: 'First Victory',
          sport: 'all',
          criteria: {
            type: 'stat_threshold',
            field: 'wins',
            operator: '>=',
            value: 1,
          },
          points: 10,
        },
      ];

      const userStats = [
        { sport: 'football', wins: 10, matchesPlayed: 15 },
      ];

      mockAchievementRepository.findAll = async () => achievements;
      mockUserRepository.getUserStats = async () => userStats;
      mockUserRepository.getAchievements = async () => [{ _id: 'ach1' }];

      const awarded = await evaluator.evaluateAchievements(userId, 'football');

      assert.strictEqual(awarded.length, 0);
      assert.strictEqual(publishedEvents.length, 0);
    });

    it('should not award achievements when criteria not met', async () => {
      const userId = 'user1';
      const achievements = [
        {
          _id: 'ach1',
          name: 'Champion',
          sport: 'all',
          criteria: {
            type: 'stat_threshold',
            field: 'wins',
            operator: '>=',
            value: 50,
          },
          points: 100,
        },
      ];

      const userStats = [
        { sport: 'football', wins: 10, matchesPlayed: 15 },
      ];

      mockAchievementRepository.findAll = async () => achievements;
      mockUserRepository.getUserStats = async () => userStats;
      mockUserRepository.getAchievements = async () => [];

      const awarded = await evaluator.evaluateAchievements(userId, 'football');

      assert.strictEqual(awarded.length, 0);
      assert.strictEqual(publishedEvents.length, 0);
    });

    it('should award multiple achievements at once', async () => {
      const userId = 'user1';
      const achievements = [
        {
          _id: 'ach1',
          name: 'First Victory',
          sport: 'all',
          criteria: {
            type: 'stat_threshold',
            field: 'wins',
            operator: '>=',
            value: 1,
          },
          points: 10,
        },
        {
          _id: 'ach2',
          name: 'Getting Started',
          sport: 'all',
          criteria: {
            type: 'stat_threshold',
            field: 'matchesPlayed',
            operator: '>=',
            value: 5,
          },
          points: 10,
        },
      ];

      const userStats = [
        { sport: 'football', wins: 3, matchesPlayed: 5 },
      ];

      mockAchievementRepository.findAll = async () => achievements;
      mockUserRepository.getUserStats = async () => userStats;
      mockUserRepository.getAchievements = async () => [];

      const awarded = await evaluator.evaluateAchievements(userId, 'football');

      assert.strictEqual(awarded.length, 2);
      assert.strictEqual(publishedEvents.length, 2);
    });
  });
});

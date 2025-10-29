/**
 * Achievement System Integration Tests
 * Tests the complete achievement evaluation flow
 */
import { describe, it, before, after, beforeEach } from 'mocha';
import '../helpers/setup.js';
import assert from 'node:assert';
import mongoose from 'mongoose';
import AchievementEvaluator from '@/modules/user/application/AchievementEvaluator.js';
import AchievementRepository from '@/modules/user/infrastructure/persistence/AchievementRepository.js';
import UserRepository from '@/modules/user/infrastructure/persistence/UserRepository.js';
import UserModel from '@/modules/auth/infrastructure/persistence/UserModel.js';
import AchievementModel from '@/modules/user/infrastructure/persistence/AchievementModel.js';
import UserStatModel from '@/modules/user/infrastructure/persistence/UserStatModel.js';
import { achievementSeeds } from '@/modules/user/infrastructure/persistence/achievementSeeds.js';

describe('Achievement System Integration', () => {
  let achievementRepository;
  let userRepository;
  let achievementEvaluator;
  let mockEventBus;
  let mockLogger;
  let testUserId;
  let publishedEvents;

  before(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/milokhelo_test';
    await mongoose.connect(mongoUri);
  });

  after(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear collections
    await AchievementModel.deleteMany({});
    await UserStatModel.deleteMany({});
    await UserModel.deleteMany({});

    // Setup mocks
    publishedEvents = [];
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

    // Create repositories
    achievementRepository = new AchievementRepository(mockLogger);
    userRepository = new UserRepository(mockLogger, UserModel);

    // Create evaluator
    achievementEvaluator = new AchievementEvaluator(
      userRepository,
      achievementRepository,
      mockEventBus,
      mockLogger
    );

    // Seed achievements
    await AchievementModel.insertMany(achievementSeeds);

    // Create test user
    const user = await UserModel.create({
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
    });
    testUserId = user._id.toString();
  });

  it('should award "First Victory" achievement on first win', async () => {
    // Create stats for user with 1 win
    await UserStatModel.create({
      userId: testUserId,
      sport: 'football',
      matchesPlayed: 1,
      wins: 1,
      losses: 0,
      draws: 0,
      elo: 1032,
    });

    // Evaluate achievements
    publishedEvents = [];
    const awarded = await achievementEvaluator.evaluateAchievements(testUserId, 'football');

    // Should award "First Victory" achievement
    assert.ok(awarded.length > 0);
    const firstVictory = awarded.find((a) => a.name === 'First Victory');
    assert.ok(firstVictory);
    assert.strictEqual(firstVictory.points, 10);

    // Should publish event
    assert.ok(publishedEvents.some((e) => e.event === 'user.achievement_awarded'));
  });

  it('should award multiple achievements when criteria are met', async () => {
    // Update user stats to meet multiple criteria
    await UserStatModel.findOneAndUpdate(
      { userId: testUserId, sport: 'football' },
      {
        matchesPlayed: 10,
        wins: 6,
        losses: 3,
        draws: 1,
        elo: 1200,
        goalsScored: 15,
      }
    );

    publishedEvents = [];
    const awarded = await achievementEvaluator.evaluateAchievements(testUserId, 'football');

    // Should award multiple achievements
    // (Getting Started, Winner, Rising Star, etc.)
    assert.ok(awarded.length >= 2);
    assert.ok(awarded.some((a) => a.name === 'Winner'));
    assert.ok(awarded.some((a) => a.name === 'Rising Star'));
  });

  it('should not re-award achievements user already has', async () => {
    // Evaluate again with same stats
    const awardedAgain = await achievementEvaluator.evaluateAchievements(testUserId, 'football');

    // Should not award any new achievements
    assert.strictEqual(awardedAgain.length, 0);
  });

  it('should award streak-based achievements', async () => {
    // Update stats with a winning streak
    await UserStatModel.findOneAndUpdate(
      { userId: testUserId, sport: 'football' },
      {
        matchesPlayed: 13,
        wins: 9,
        streak: 3,
      }
    );

    publishedEvents = [];
    const awarded = await achievementEvaluator.evaluateAchievements(testUserId, 'football');

    // Should award "On Fire" achievement (3 win streak)
    const onFire = awarded.find((a) => a.name === 'On Fire');
    assert.ok(onFire);
  });

  it('should award win rate achievements', async () => {
    // Create new user with high win rate
    const user2 = await UserModel.create({
      username: 'prouser',
      name: 'Pro User',
      email: 'pro@example.com',
      password: 'hashedpassword',
    });
    const user2Id = user2._id.toString();

    await UserStatModel.create({
      userId: user2Id,
      sport: 'football',
      matchesPlayed: 20,
      wins: 16,
      losses: 4,
      draws: 0,
      elo: 1400,
    });

    publishedEvents = [];
    const awarded = await achievementEvaluator.evaluateAchievements(user2Id, 'football');

    // Should award "Skilled Competitor" (60% win rate with 20+ matches)
    const skillAch = awarded.find((a) => a.name === 'Skilled Competitor');
    assert.ok(skillAch);
  });

  it('should handle multi-sport stats correctly', async () => {
    // Add basketball stats for test user
    await UserStatModel.create({
      userId: testUserId,
      sport: 'basketball',
      matchesPlayed: 5,
      wins: 3,
      losses: 2,
      elo: 1050,
    });

    publishedEvents = [];
    const awarded = await achievementEvaluator.evaluateAchievements(testUserId, 'basketball');

    // Should evaluate basketball-specific achievements
    assert.ok(Array.isArray(awarded));
  });

  it('should award total-based achievements across all sports', async () => {
    // Create user with stats across multiple sports
    const user3 = await UserModel.create({
      username: 'multisport',
      name: 'Multi Sport',
      email: 'multi@example.com',
      password: 'hashedpassword',
    });
    const user3Id = user3._id.toString();

    await UserStatModel.create({
      userId: user3Id,
      sport: 'football',
      matchesPlayed: 30,
      wins: 20,
    });

    await UserStatModel.create({
      userId: user3Id,
      sport: 'basketball',
      matchesPlayed: 25,
      wins: 15,
    });

    publishedEvents = [];
    const awarded = await achievementEvaluator.evaluateAchievements(user3Id);

    // Should award "Dedicated Player" (50+ matches total)
    const dedicated = awarded.find((a) => a.name === 'Dedicated Player');
    assert.ok(dedicated);
  });

  it('should handle edge cases gracefully', async () => {
    // Test with user who has no stats
    const user4 = await UserModel.create({
      username: 'newuser',
      name: 'New User',
      email: 'new@example.com',
      password: 'hashedpassword',
    });
    const user4Id = user4._id.toString();

    const awarded = await achievementEvaluator.evaluateAchievements(user4Id);

    // Should not throw error and return empty array
    assert.strictEqual(awarded.length, 0);
  });

  it('should evaluate all achievement categories', async () => {
    // Get all seeded achievements
    const allAchievements = await AchievementModel.find();

    // Verify we have achievements in different categories
    const categories = new Set(allAchievements.map((a) => a.category));
    assert.ok(categories.has('milestone'));
    assert.ok(categories.has('skill'));
    assert.ok(categories.has('participation'));

    // Verify different rarity levels
    const rarities = new Set(allAchievements.map((a) => a.rarity));
    assert.ok(rarities.has('common'));
    assert.ok(rarities.has('rare'));
    assert.ok(rarities.has('epic'));
    assert.ok(rarities.has('legendary'));
  });
});

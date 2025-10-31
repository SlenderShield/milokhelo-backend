/**
 * Stats Auto-Update Integration Test
 * Tests the complete flow of stats updates on match finish
 */
import { describe, it, before, after, beforeEach } from 'mocha';
import '../helpers/setup.js';
import mongoose from 'mongoose';
import InMemoryEventBus from '../../src/core/events/inMemoryBus.js';
import MatchRepository from '@/modules/match/repository/match.repository.js';
import MatchService from '@/modules/match/service/match.service.js';
import UserRepository from '@/modules/user/repository/user.repository.js';
import StatsUpdateHandler from '@/modules/user/service/statsUpdateHandler.service.js';
import MatchModel from '@/modules/match/model/match.model.js';
import UserStatModel from '@/modules/user/model/userStat.model.js';
import UserModel from '@/modules/auth/model/user.model.js';

describe('Stats Auto-Update Integration', () => {
  let eventBus;
  let matchRepository;
  let matchService;
  let userRepository;
  let statsUpdateHandler;
  let mockLogger;

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
    await MatchModel.deleteMany({});
    await UserStatModel.deleteMany({});
    await UserModel.deleteMany({});

    // Setup mock logger
    mockLogger = {
      child: () => mockLogger,
      info: () => {},
      debug: () => {},
      warn: () => {},
      error: () => {},
    };

    // Initialize event bus
    eventBus = new InMemoryEventBus(mockLogger);

    // Initialize repositories
    matchRepository = new MatchRepository(mockLogger);
    userRepository = new UserRepository(mockLogger, UserModel);

    // Initialize services
    matchService = new MatchService(matchRepository, eventBus, mockLogger);
    statsUpdateHandler = new StatsUpdateHandler(userRepository, matchRepository, mockLogger);

    // Subscribe to match.finished event
    eventBus.subscribe('match.finished', async (data) => {
      await statsUpdateHandler.handleMatchFinished(data);
    });
  });

  describe('Individual Match Stats Update', () => {
    it('should automatically update stats when individual match finishes', async () => {
      // Create test users
      const user1 = await UserModel.create({
        username: 'player1',
        email: 'player1@test.com',
        password: 'test123',
      });

      const user2 = await UserModel.create({
        username: 'player2',
        email: 'player2@test.com',
        password: 'test123',
      });

      // Create a match
      const match = await matchRepository.create({
        title: 'Test Match',
        sport: 'football',
        type: 'competitive',
        organizerId: user1._id,
        startAt: new Date(),
        participants: [user1._id, user2._id],
        status: 'scheduled',
      });

      // Finish the match
      await matchService.finishMatch(match._id.toString(), user1._id.toString(), {
        scores: {
          [user1._id.toString()]: 5,
          [user2._id.toString()]: 3,
        },
      });

      // Wait for event processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify stats were updated for winner
      const user1Stats = await UserStatModel.findOne({
        userId: user1._id,
        sport: 'football',
      });

      expect(user1Stats).to.be.ok();
      expect(user1Stats.matchesPlayed).to.equal(1);
      expect(user1Stats.wins).to.equal(1);
      expect(user1Stats.losses).to.equal(0);
      expect(user1Stats.goalsScored).to.equal(5);
      expect(user1Stats.elo).to.equal(1032); // 1000 base + 32 for competitive win
      expect(user1Stats.streak).to.equal(1);

      // Verify stats were updated for loser
      const user2Stats = await UserStatModel.findOne({
        userId: user2._id,
        sport: 'football',
      });

      expect(user2Stats).to.be.ok();
      expect(user2Stats.matchesPlayed).to.equal(1);
      expect(user2Stats.wins).to.equal(0);
      expect(user2Stats.losses).to.equal(1);
      expect(user2Stats.goalsScored).to.equal(3);
      expect(user2Stats.elo).to.equal(968); // 1000 base - 32 for competitive loss
      expect(user2Stats.streak).to.equal(-1);
    });

    it('should handle draw correctly', async () => {
      // Create test users
      const user1 = await UserModel.create({
        username: 'player1',
        email: 'player1@test.com',
        password: 'test123',
      });

      const user2 = await UserModel.create({
        username: 'player2',
        email: 'player2@test.com',
        password: 'test123',
      });

      // Create a match
      const match = await matchRepository.create({
        title: 'Test Match',
        sport: 'football',
        type: 'friendly',
        organizerId: user1._id,
        startAt: new Date(),
        participants: [user1._id, user2._id],
        status: 'scheduled',
      });

      // Finish with draw
      await matchService.finishMatch(match._id.toString(), user1._id.toString(), {
        scores: {
          [user1._id.toString()]: 2,
          [user2._id.toString()]: 2,
        },
      });

      // Wait for event processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify stats for both players
      const user1Stats = await UserStatModel.findOne({
        userId: user1._id,
        sport: 'football',
      });

      expect(user1Stats.matchesPlayed).to.equal(1);
      expect(user1Stats.wins).to.equal(0);
      expect(user1Stats.losses).to.equal(0);
      expect(user1Stats.draws).to.equal(1);
      expect(user1Stats.elo).to.equal(1000); // No change for draw
      expect(user1Stats.streak).to.equal(0);
    });

    it('should update streak correctly over multiple matches', async () => {
      // Create test user
      const user = await UserModel.create({
        username: 'player1',
        email: 'player1@test.com',
        password: 'test123',
      });

      const opponent = await UserModel.create({
        username: 'opponent',
        email: 'opponent@test.com',
        password: 'test123',
      });

      // Win first match
      const match1 = await matchRepository.create({
        title: 'Match 1',
        sport: 'tennis',
        type: 'competitive',
        organizerId: user._id,
        startAt: new Date(),
        participants: [user._id, opponent._id],
        status: 'scheduled',
      });

      await matchService.finishMatch(match1._id.toString(), user._id.toString(), {
        scores: {
          [user._id.toString()]: 10,
          [opponent._id.toString()]: 5,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      let stats = await UserStatModel.findOne({ userId: user._id, sport: 'tennis' });
      expect(stats.wins).to.equal(1);
      expect(stats.streak).to.equal(1);

      // Win second match
      const match2 = await matchRepository.create({
        title: 'Match 2',
        sport: 'tennis',
        type: 'competitive',
        organizerId: user._id,
        startAt: new Date(),
        participants: [user._id, opponent._id],
        status: 'scheduled',
      });

      await matchService.finishMatch(match2._id.toString(), user._id.toString(), {
        scores: {
          [user._id.toString()]: 12,
          [opponent._id.toString()]: 7,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      stats = await UserStatModel.findOne({ userId: user._id, sport: 'tennis' });
      expect(stats.wins).to.equal(2);
      expect(stats.streak).to.equal(2);

      // Lose third match
      const match3 = await matchRepository.create({
        title: 'Match 3',
        sport: 'tennis',
        type: 'competitive',
        organizerId: user._id,
        startAt: new Date(),
        participants: [user._id, opponent._id],
        status: 'scheduled',
      });

      await matchService.finishMatch(match3._id.toString(), user._id.toString(), {
        scores: {
          [user._id.toString()]: 5,
          [opponent._id.toString()]: 10,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      stats = await UserStatModel.findOne({ userId: user._id, sport: 'tennis' });
      expect(stats.wins).to.equal(2);
      expect(stats.losses).to.equal(1);
      expect(stats.streak).to.equal(-1); // Losing streak starts
    });
  });

  describe('Detailed Score Stats', () => {
    it('should handle detailed score objects with assists and fouls', async () => {
      // Create test users
      const user1 = await UserModel.create({
        username: 'player1',
        email: 'player1@test.com',
        password: 'test123',
      });

      const user2 = await UserModel.create({
        username: 'player2',
        email: 'player2@test.com',
        password: 'test123',
      });

      // Create a match
      const match = await matchRepository.create({
        title: 'Test Match',
        sport: 'football',
        type: 'competitive',
        organizerId: user1._id,
        startAt: new Date(),
        participants: [user1._id, user2._id],
        status: 'scheduled',
      });

      // Finish with detailed scores
      await matchService.finishMatch(match._id.toString(), user1._id.toString(), {
        scores: {
          [user1._id.toString()]: {
            goals: 3,
            assists: 2,
            fouls: 1,
          },
          [user2._id.toString()]: {
            goals: 1,
            assists: 0,
            fouls: 3,
          },
        },
      });

      // Wait for event processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify detailed stats
      const user1Stats = await UserStatModel.findOne({
        userId: user1._id,
        sport: 'football',
      });

      expect(user1Stats.goalsScored).to.equal(3);
      expect(user1Stats.assists).to.equal(2);
      expect(user1Stats.fouls).to.equal(1);
    });
  });

  describe('Multiple Sports', () => {
    it('should maintain separate stats for different sports', async () => {
      // Create test user
      const user = await UserModel.create({
        username: 'player1',
        email: 'player1@test.com',
        password: 'test123',
      });

      const opponent = await UserModel.create({
        username: 'opponent',
        email: 'opponent@test.com',
        password: 'test123',
      });

      // Football match
      const footballMatch = await matchRepository.create({
        title: 'Football Match',
        sport: 'football',
        type: 'competitive',
        organizerId: user._id,
        startAt: new Date(),
        participants: [user._id, opponent._id],
        status: 'scheduled',
      });

      await matchService.finishMatch(footballMatch._id.toString(), user._id.toString(), {
        scores: {
          [user._id.toString()]: 5,
          [opponent._id.toString()]: 3,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Basketball match
      const basketballMatch = await matchRepository.create({
        title: 'Basketball Match',
        sport: 'basketball',
        type: 'competitive',
        organizerId: user._id,
        startAt: new Date(),
        participants: [user._id, opponent._id],
        status: 'scheduled',
      });

      await matchService.finishMatch(basketballMatch._id.toString(), user._id.toString(), {
        scores: {
          [user._id.toString()]: 2,
          [opponent._id.toString()]: 10,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify separate stats
      const footballStats = await UserStatModel.findOne({
        userId: user._id,
        sport: 'football',
      });

      const basketballStats = await UserStatModel.findOne({
        userId: user._id,
        sport: 'basketball',
      });

      expect(footballStats.wins).to.equal(1);
      expect(footballStats.losses).to.equal(0);

      expect(basketballStats.wins).to.equal(0);
      expect(basketballStats.losses).to.equal(1);
    });
  });
});

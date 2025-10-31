/**
 * Achievement Seed Data
 * Predefined achievements for the sports platform
 */

export const achievementSeeds = [
  // ============================================================
  // MILESTONE ACHIEVEMENTS - First Steps
  // ============================================================
  {
    name: 'First Victory',
    description: 'Win your first match in any sport',
    category: 'milestone',
    sport: 'all',
    criteria: {
      type: 'stat_threshold',
      field: 'wins',
      operator: '>=',
      value: 1,
    },
    rarity: 'common',
    points: 10,
  },
  {
    name: 'Getting Started',
    description: 'Play your first 5 matches',
    category: 'milestone',
    sport: 'all',
    criteria: {
      type: 'stat_total',
      field: 'matchesPlayed',
      operator: '>=',
      value: 5,
    },
    rarity: 'common',
    points: 10,
  },
  {
    name: 'Dedicated Player',
    description: 'Play 50 matches across all sports',
    category: 'milestone',
    sport: 'all',
    criteria: {
      type: 'stat_total',
      field: 'matchesPlayed',
      operator: '>=',
      value: 50,
    },
    rarity: 'rare',
    points: 50,
  },
  {
    name: 'Century Club',
    description: 'Play 100 matches across all sports',
    category: 'milestone',
    sport: 'all',
    criteria: {
      type: 'stat_total',
      field: 'matchesPlayed',
      operator: '>=',
      value: 100,
    },
    rarity: 'epic',
    points: 100,
  },
  {
    name: 'Veteran',
    description: 'Play 500 matches across all sports',
    category: 'milestone',
    sport: 'all',
    criteria: {
      type: 'stat_total',
      field: 'matchesPlayed',
      operator: '>=',
      value: 500,
    },
    rarity: 'legendary',
    points: 500,
  },

  // ============================================================
  // SKILL ACHIEVEMENTS - Win Count
  // ============================================================
  {
    name: 'Winner',
    description: 'Win 10 matches',
    category: 'skill',
    sport: 'all',
    criteria: {
      type: 'stat_total',
      field: 'wins',
      operator: '>=',
      value: 10,
    },
    rarity: 'common',
    points: 25,
  },
  {
    name: 'Champion',
    description: 'Win 50 matches',
    category: 'skill',
    sport: 'all',
    criteria: {
      type: 'stat_total',
      field: 'wins',
      operator: '>=',
      value: 50,
    },
    rarity: 'rare',
    points: 75,
  },
  {
    name: 'Legend',
    description: 'Win 100 matches',
    category: 'skill',
    sport: 'all',
    criteria: {
      type: 'stat_total',
      field: 'wins',
      operator: '>=',
      value: 100,
    },
    rarity: 'epic',
    points: 150,
  },
  {
    name: 'Unbeatable',
    description: 'Win 250 matches',
    category: 'skill',
    sport: 'all',
    criteria: {
      type: 'stat_total',
      field: 'wins',
      operator: '>=',
      value: 250,
    },
    rarity: 'legendary',
    points: 500,
  },

  // ============================================================
  // SKILL ACHIEVEMENTS - Win Rate
  // ============================================================
  {
    name: 'Skilled Competitor',
    description: 'Maintain a 60% win rate with at least 20 matches played',
    category: 'skill',
    sport: 'all',
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
    rarity: 'rare',
    points: 100,
  },
  {
    name: 'Elite Performer',
    description: 'Maintain a 75% win rate with at least 50 matches played',
    category: 'skill',
    sport: 'all',
    criteria: {
      type: 'composite',
      logic: 'AND',
      conditions: [
        {
          type: 'ratio',
          numerator: 'wins',
          denominator: 'matchesPlayed',
          operator: '>=',
          value: 0.75,
        },
        {
          type: 'stat_threshold',
          field: 'matchesPlayed',
          operator: '>=',
          value: 50,
        },
      ],
    },
    rarity: 'epic',
    points: 250,
  },

  // ============================================================
  // SKILL ACHIEVEMENTS - Streaks
  // ============================================================
  {
    name: 'On Fire',
    description: 'Win 3 matches in a row',
    category: 'skill',
    sport: 'all',
    criteria: {
      type: 'streak',
      streakType: 'winning',
      operator: '>=',
      value: 3,
    },
    rarity: 'common',
    points: 30,
  },
  {
    name: 'Unstoppable',
    description: 'Win 5 matches in a row',
    category: 'skill',
    sport: 'all',
    criteria: {
      type: 'streak',
      streakType: 'winning',
      operator: '>=',
      value: 5,
    },
    rarity: 'rare',
    points: 75,
  },
  {
    name: 'Dominator',
    description: 'Win 10 matches in a row',
    category: 'skill',
    sport: 'all',
    criteria: {
      type: 'streak',
      streakType: 'winning',
      operator: '>=',
      value: 10,
    },
    rarity: 'epic',
    points: 200,
  },
  {
    name: 'Invincible',
    description: 'Win 20 matches in a row',
    category: 'skill',
    sport: 'all',
    criteria: {
      type: 'streak',
      streakType: 'winning',
      operator: '>=',
      value: 20,
    },
    rarity: 'legendary',
    points: 1000,
  },

  // ============================================================
  // SKILL ACHIEVEMENTS - ELO Rating
  // ============================================================
  {
    name: 'Rising Star',
    description: 'Reach ELO rating of 1200',
    category: 'skill',
    sport: 'all',
    criteria: {
      type: 'stat_threshold',
      field: 'elo',
      operator: '>=',
      value: 1200,
    },
    rarity: 'common',
    points: 50,
  },
  {
    name: 'Advanced Player',
    description: 'Reach ELO rating of 1500',
    category: 'skill',
    sport: 'all',
    criteria: {
      type: 'stat_threshold',
      field: 'elo',
      operator: '>=',
      value: 1500,
    },
    rarity: 'rare',
    points: 100,
  },
  {
    name: 'Expert',
    description: 'Reach ELO rating of 1800',
    category: 'skill',
    sport: 'all',
    criteria: {
      type: 'stat_threshold',
      field: 'elo',
      operator: '>=',
      value: 1800,
    },
    rarity: 'epic',
    points: 250,
  },
  {
    name: 'Grandmaster',
    description: 'Reach ELO rating of 2100',
    category: 'skill',
    sport: 'all',
    criteria: {
      type: 'stat_threshold',
      field: 'elo',
      operator: '>=',
      value: 2100,
    },
    rarity: 'legendary',
    points: 750,
  },

  // ============================================================
  // PARTICIPATION ACHIEVEMENTS - Goals/Points
  // ============================================================
  {
    name: 'First Blood',
    description: 'Score your first goal or point',
    category: 'participation',
    sport: 'all',
    criteria: {
      type: 'stat_threshold',
      field: 'goalsScored',
      operator: '>=',
      value: 1,
    },
    rarity: 'common',
    points: 10,
  },
  {
    name: 'Scorer',
    description: 'Score 50 goals or points',
    category: 'participation',
    sport: 'all',
    criteria: {
      type: 'stat_total',
      field: 'goalsScored',
      operator: '>=',
      value: 50,
    },
    rarity: 'rare',
    points: 50,
  },
  {
    name: 'Sharpshooter',
    description: 'Score 100 goals or points',
    category: 'participation',
    sport: 'all',
    criteria: {
      type: 'stat_total',
      field: 'goalsScored',
      operator: '>=',
      value: 100,
    },
    rarity: 'epic',
    points: 150,
  },
  {
    name: 'Goal Machine',
    description: 'Score 250 goals or points',
    category: 'participation',
    sport: 'all',
    criteria: {
      type: 'stat_total',
      field: 'goalsScored',
      operator: '>=',
      value: 250,
    },
    rarity: 'legendary',
    points: 500,
  },

  // ============================================================
  // PARTICIPATION ACHIEVEMENTS - Assists
  // ============================================================
  {
    name: 'Team Player',
    description: 'Record 10 assists',
    category: 'participation',
    sport: 'all',
    criteria: {
      type: 'stat_total',
      field: 'assists',
      operator: '>=',
      value: 10,
    },
    rarity: 'common',
    points: 25,
  },
  {
    name: 'Playmaker',
    description: 'Record 50 assists',
    category: 'participation',
    sport: 'all',
    criteria: {
      type: 'stat_total',
      field: 'assists',
      operator: '>=',
      value: 50,
    },
    rarity: 'rare',
    points: 75,
  },
  {
    name: 'Master Facilitator',
    description: 'Record 100 assists',
    category: 'participation',
    sport: 'all',
    criteria: {
      type: 'stat_total',
      field: 'assists',
      operator: '>=',
      value: 100,
    },
    rarity: 'epic',
    points: 200,
  },

  // ============================================================
  // SPECIAL ACHIEVEMENTS - Resilience
  // ============================================================
  {
    name: 'Never Give Up',
    description: 'Come back and win after a 5-match losing streak',
    category: 'special',
    sport: 'all',
    criteria: {
      type: 'streak',
      streakType: 'winning',
      operator: '>=',
      value: 1,
    },
    rarity: 'rare',
    points: 100,
    // Note: This is a simplified version. In production, you might want
    // to track historical data to verify the comeback
  },
];

/**
 * Function to seed achievements to database
 */
export async function seedAchievements(achievementRepository, logger) {
  try {
    logger.info('Starting achievement seeding');

    const existingCount = await achievementRepository.AchievementModel.countDocuments();

    if (existingCount > 0) {
      logger.info('Achievements already exist, skipping seed', { count: existingCount });
      return { success: true, message: 'Achievements already seeded', count: existingCount };
    }

    const result = await achievementRepository.bulkCreate(achievementSeeds);

    logger.info('Achievement seeding completed', {
      seeded: result.length,
      total: achievementSeeds.length,
    });

    return {
      success: true,
      message: 'Achievements seeded successfully',
      count: result.length,
    };
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - some achievements already exist
      logger.warn('Some achievements already exist', { error: error.message });
      return {
        success: true,
        message: 'Some achievements already exist',
        error: error.message,
      };
    }

    logger.error('Error seeding achievements', { error: error.message, stack: error.stack });
    throw error;
  }
}

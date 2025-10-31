/**
 * Achievement Evaluator
 * Evaluates user stats against achievement criteria and awards achievements
 */
class AchievementEvaluator {
  constructor(userRepository, achievementRepository, eventBus, logger) {
    this.userRepository = userRepository;
    this.achievementRepository = achievementRepository;
    this.eventBus = eventBus;
    this.logger = logger.child({ context: 'AchievementEvaluator' });
  }

  /**
   * Evaluate all achievements for a user based on their current stats
   * Awards new achievements that haven't been earned yet
   * 
   * @param {string} userId - User ID
   * @param {string} sport - Sport to evaluate (optional, evaluates all if not provided)
   * @returns {Promise<Array>} - Array of newly awarded achievements
   */
  async evaluateAchievements(userId, sport = null) {
    try {
      this.logger.debug('Evaluating achievements', { userId, sport });

      // Get user's current achievements
      const userAchievements = await this.userRepository.getAchievements(userId);
      const earnedAchievementIds = new Set(userAchievements.map((a) => a._id.toString()));

      // Get all available achievements
      const allAchievements = await this.achievementRepository.findAll();

      // Get user stats
      const userStats = await this.userRepository.getUserStats(userId);

      // Filter achievements by sport if specified
      const achievementsToCheck = sport
        ? allAchievements.filter((a) => !a.sport || a.sport === sport || a.sport === 'all')
        : allAchievements;

      // Evaluate each achievement
      const newlyAwardedAchievements = [];

      for (const achievement of achievementsToCheck) {
        // Skip if user already has this achievement
        if (earnedAchievementIds.has(achievement._id.toString())) {
          continue;
        }

        // Check if criteria is met
        const isMet = this.evaluateCriteria(achievement, userStats, sport);

        if (isMet) {
          // Award the achievement
          await this.userRepository.addAchievement(userId, achievement._id);
          newlyAwardedAchievements.push(achievement);

          // Publish event
          await this.eventBus.publish('user.achievement_awarded', {
            userId,
            achievementId: achievement._id.toString(),
            achievementName: achievement.name,
            points: achievement.points,
          });

          this.logger.info('Achievement awarded', {
            userId,
            achievementId: achievement._id,
            achievementName: achievement.name,
          });
        }
      }

      return newlyAwardedAchievements;
    } catch (error) {
      this.logger.error('Error evaluating achievements', {
        userId,
        sport,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Evaluate a single achievement criteria against user stats
   * 
   * @param {Object} achievement - Achievement object with criteria
   * @param {Array} userStats - Array of user stats by sport
   * @param {string} targetSport - Specific sport to check (optional)
   * @returns {boolean} - True if criteria is met
   */
  evaluateCriteria(achievement, userStats, targetSport = null) {
    if (!achievement.criteria || typeof achievement.criteria !== 'object') {
      this.logger.warn('Invalid achievement criteria format', {
        achievementId: achievement._id,
        criteria: achievement.criteria,
      });
      return false;
    }

    const criteria = achievement.criteria;

    // Handle sport-specific achievements
    let statsToCheck = userStats;
    if (achievement.sport && achievement.sport !== 'all') {
      statsToCheck = userStats.filter((s) => s.sport === achievement.sport);
    } else if (targetSport) {
      statsToCheck = userStats.filter((s) => s.sport === targetSport);
    }

    // If no stats available for the sport, criteria not met
    if (statsToCheck.length === 0) {
      return false;
    }

    // Evaluate based on criteria type
    if (criteria.type === 'stat_threshold') {
      return this.evaluateStatThreshold(criteria, statsToCheck);
    } else if (criteria.type === 'stat_total') {
      return this.evaluateStatTotal(criteria, statsToCheck);
    } else if (criteria.type === 'ratio') {
      return this.evaluateRatio(criteria, statsToCheck);
    } else if (criteria.type === 'streak') {
      return this.evaluateStreak(criteria, statsToCheck);
    } else if (criteria.type === 'composite') {
      return this.evaluateComposite(criteria, statsToCheck);
    }

    this.logger.warn('Unknown criteria type', {
      achievementId: achievement._id,
      criteriaType: criteria.type,
    });
    return false;
  }

  /**
   * Evaluate stat threshold criteria (e.g., ELO >= 1500)
   * Checks if any sport meets the threshold
   */
  evaluateStatThreshold(criteria, statsArray) {
    const { field, operator, value } = criteria;

    return statsArray.some((stats) => {
      const statValue = stats[field];
      if (statValue === undefined || statValue === null) {
        return false;
      }

      return this.compareValues(statValue, operator, value);
    });
  }

  /**
   * Evaluate stat total criteria (e.g., total wins across all sports >= 100)
   * Sums the stat across all sports
   */
  evaluateStatTotal(criteria, statsArray) {
    const { field, operator, value } = criteria;

    const total = statsArray.reduce((sum, stats) => {
      const statValue = stats[field] || 0;
      return sum + statValue;
    }, 0);

    return this.compareValues(total, operator, value);
  }

  /**
   * Evaluate ratio criteria (e.g., win rate > 0.75)
   * Calculates ratio from two fields
   */
  evaluateRatio(criteria, statsArray) {
    const { numerator, denominator, operator, value } = criteria;

    // Calculate ratio for each sport and check if any meets criteria
    return statsArray.some((stats) => {
      const numeratorValue = stats[numerator] || 0;
      const denominatorValue = stats[denominator] || 0;

      if (denominatorValue === 0) {
        return false; // Can't divide by zero
      }

      const ratio = numeratorValue / denominatorValue;
      return this.compareValues(ratio, operator, value);
    });
  }

  /**
   * Evaluate streak criteria (e.g., current streak >= 5)
   */
  evaluateStreak(criteria, statsArray) {
    const { operator, value } = criteria;

    return statsArray.some((stats) => {
      const streak = stats.streak || 0;

      // For winning streak, check positive values
      if (criteria.streakType === 'winning') {
        return streak > 0 && this.compareValues(streak, operator, value);
      }

      // For losing streak, check negative values
      if (criteria.streakType === 'losing') {
        return streak < 0 && this.compareValues(Math.abs(streak), operator, value);
      }

      // For any streak, check absolute value
      return this.compareValues(Math.abs(streak), operator, value);
    });
  }

  /**
   * Evaluate composite criteria (multiple conditions with AND/OR logic)
   */
  evaluateComposite(criteria, statsArray) {
    const { conditions, logic } = criteria;

    if (!conditions || !Array.isArray(conditions)) {
      return false;
    }

    const results = conditions.map((condition) => {
      // Recursively evaluate each condition
      const conditionAchievement = {
        criteria: condition,
        sport: criteria.sport,
      };
      return this.evaluateCriteria(conditionAchievement, statsArray);
    });

    // Apply logic
    if (logic === 'OR') {
      return results.some((r) => r === true);
    }

    // Default to AND
    return results.every((r) => r === true);
  }

  /**
   * Compare two values using an operator
   */
  compareValues(actual, operator, expected) {
    switch (operator) {
      case '>=':
      case 'gte':
        return actual >= expected;
      case '>':
      case 'gt':
        return actual > expected;
      case '<=':
      case 'lte':
        return actual <= expected;
      case '<':
      case 'lt':
        return actual < expected;
      case '===':
      case '==':
      case 'eq':
        return actual === expected;
      case '!==':
      case '!=':
      case 'ne':
        return actual !== expected;
      default:
        this.logger.warn('Unknown operator', { operator });
        return false;
    }
  }
}

export default AchievementEvaluator;

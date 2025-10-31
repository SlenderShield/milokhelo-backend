/**
 * UserStat DTO (Data Transfer Object)
 * Transforms UserStat model data for safe client consumption
 */
import BaseDTO from './BaseDTO.js';

class UserStatDTO extends BaseDTO {
  static transformOne(stats, options = {}) {
    if (!stats) return null;

    const safe = {
      id: stats._id?.toString(),
      userId: stats.userId?.toString(),
      sport: stats.sport,
      matchesPlayed: stats.matchesPlayed,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      winRate: stats.winRate,
      elo: stats.elo,
      rating: stats.rating,
      currentStreak: stats.currentStreak,
      longestWinStreak: stats.longestWinStreak,
      longestLoseStreak: stats.longestLoseStreak,
      performance: stats.performance,
      achievements: stats.achievements?.map((a) => a.toString()) || [],
      lastMatchAt: stats.lastMatchAt,
    };

    if (options.includeTimestamps) {
      safe.createdAt = stats.createdAt;
      safe.updatedAt = stats.updatedAt;
    }

    return this.clean(safe);
  }

  /**
   * Transform stats summary (across all sports)
   */
  static transformSummary(allStats) {
    if (!Array.isArray(allStats)) return null;

    const summary = {
      totalMatches: 0,
      totalWins: 0,
      totalLosses: 0,
      totalDraws: 0,
      sports: {},
    };

    allStats.forEach((stat) => {
      const obj = stat.toObject ? stat.toObject() : stat;
      summary.totalMatches += obj.matchesPlayed || 0;
      summary.totalWins += obj.wins || 0;
      summary.totalLosses += obj.losses || 0;
      summary.totalDraws += obj.draws || 0;

      if (obj.sport) {
        summary.sports[obj.sport] = {
          matchesPlayed: obj.matchesPlayed,
          wins: obj.wins,
          losses: obj.losses,
          draws: obj.draws,
          winRate: obj.winRate,
          elo: obj.elo,
        };
      }
    });

    summary.overallWinRate =
      summary.totalMatches > 0
        ? ((summary.totalWins / summary.totalMatches) * 100).toFixed(2)
        : 0;

    return summary;
  }
}

export default UserStatDTO;

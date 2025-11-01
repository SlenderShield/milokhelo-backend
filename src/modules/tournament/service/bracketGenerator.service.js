/**
 * Tournament Bracket Generator
 * Handles bracket generation for different tournament formats
 */

export class BracketGenerator {
  /**
   * Generate a tournament bracket based on the tournament type
   * @param {Object} tournament - Tournament object with type, teams, and other details
   * @returns {Object} Generated bracket structure
   */
  static generateBracket(tournament) {
    const { type, teams } = tournament;

    if (!teams || teams.length === 0) {
      throw new Error('Cannot generate bracket: No teams registered');
    }

    switch (type) {
      case 'knockout':
        return this.generateKnockoutBracket(teams, tournament);
      case 'league':
        return this.generateLeagueBracket(teams, tournament);
      default:
        throw new Error(`Unsupported tournament type: ${type}`);
    }
  }

  /**
   * Generate a single elimination knockout bracket
   * @param {Array} teams - Array of team IDs
   * @param {Object} tournament - Tournament details
   * @returns {Object} Knockout bracket structure
   */
  static generateKnockoutBracket(teams, tournament) {
    const teamCount = teams.length;
    
    // Check minimum teams requirement
    if (tournament.minTeams && teamCount < tournament.minTeams) {
      throw new Error(`Not enough teams. Minimum required: ${tournament.minTeams}, registered: ${teamCount}`);
    }

    // Calculate number of rounds needed (log2 of next power of 2)
    const nextPowerOfTwo = this.getNextPowerOfTwo(teamCount);
    const totalRounds = Math.log2(nextPowerOfTwo);
    
    // Shuffle teams for randomization (optional)
    const shuffledTeams = this.shuffleArray([...teams]);
    
    // Generate first round matches
    const firstRoundMatches = this.generateFirstRound(shuffledTeams, nextPowerOfTwo);
    
    // Build complete bracket structure
    const bracket = {
      type: 'knockout',
      totalRounds: totalRounds,
      currentRound: 1,
      rounds: this.buildKnockoutRounds(firstRoundMatches, totalRounds),
      teams: shuffledTeams.map((teamId, index) => ({
        teamId,
        seed: index + 1,
        eliminated: false,
      })),
      winners: {
        champion: null,
        runnerUp: null,
        thirdPlace: null,
      },
    };

    return bracket;
  }

  /**
   * Generate a round-robin league bracket
   * @param {Array} teams - Array of team IDs
   * @param {Object} tournament - Tournament details
   * @returns {Object} League bracket structure
   */
  static generateLeagueBracket(teams, tournament) {
    const teamCount = teams.length;
    
    if (tournament.minTeams && teamCount < tournament.minTeams) {
      throw new Error(`Not enough teams. Minimum required: ${tournament.minTeams}, registered: ${teamCount}`);
    }

    // Generate round-robin fixtures
    const fixtures = this.generateRoundRobinFixtures(teams);
    
    // Calculate total rounds (each team plays every other team once)
    const totalRounds = teamCount % 2 === 0 ? teamCount - 1 : teamCount;

    const bracket = {
      type: 'league',
      totalRounds: totalRounds,
      currentRound: 1,
      rounds: fixtures,
      standings: teams.map((teamId, index) => ({
        teamId,
        position: index + 1,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      })),
    };

    return bracket;
  }

  /**
   * Generate first round matches for knockout tournament
   * @param {Array} teams - Array of team IDs
   * @param {number} slots - Total slots in bracket (power of 2)
   * @returns {Array} First round matches
   */
  static generateFirstRound(teams, slots) {
    const matches = [];
    // Number of byes needed: slots - teams.length
    
    // Create match pairs
    for (let i = 0; i < slots / 2; i++) {
      const team1Index = i;
      const team2Index = slots - 1 - i;
      
      const match = {
        matchNumber: i + 1,
        round: 1,
        team1: team1Index < teams.length ? teams[team1Index] : null, // null = bye
        team2: team2Index < teams.length ? teams[team2Index] : null,
        winner: null,
        score: {
          team1: null,
          team2: null,
        },
        status: 'pending',
        startTime: null,
        nextMatch: Math.floor(i / 2) + 1, // Which match in next round
        nextMatchPosition: i % 2 === 0 ? 'team1' : 'team2', // Position in next match
      };
      
      // Handle byes - team automatically advances
      if (!match.team1 && match.team2) {
        match.winner = match.team2;
        match.status = 'bye';
      } else if (match.team1 && !match.team2) {
        match.winner = match.team1;
        match.status = 'bye';
      }
      
      matches.push(match);
    }
    
    return matches;
  }

  /**
   * Build complete knockout bracket structure
   * @param {Array} firstRoundMatches - Initial matches
   * @param {number} totalRounds - Total number of rounds
   * @returns {Array} Array of rounds with matches
   */
  static buildKnockoutRounds(firstRoundMatches, totalRounds) {
    const rounds = [];
    
    // Add first round
    rounds.push({
      roundNumber: 1,
      name: this.getRoundName(1, totalRounds),
      matches: firstRoundMatches,
      completed: false,
    });
    
    // Generate subsequent rounds
    let prevRoundMatchCount = firstRoundMatches.length;
    let matchNumberOffset = firstRoundMatches.length;
    
    for (let round = 2; round <= totalRounds; round++) {
      const matchCount = Math.floor(prevRoundMatchCount / 2);
      const roundMatches = [];
      
      for (let i = 0; i < matchCount; i++) {
        roundMatches.push({
          matchNumber: matchNumberOffset + i + 1,
          round: round,
          team1: null, // To be filled from previous round winner
          team2: null,
          winner: null,
          score: {
            team1: null,
            team2: null,
          },
          status: 'pending',
          startTime: null,
          nextMatch: round < totalRounds ? Math.floor(i / 2) + 1 : null,
          nextMatchPosition: round < totalRounds ? (i % 2 === 0 ? 'team1' : 'team2') : null,
        });
      }
      
      rounds.push({
        roundNumber: round,
        name: this.getRoundName(round, totalRounds),
        matches: roundMatches,
        completed: false,
      });
      
      prevRoundMatchCount = matchCount;
      matchNumberOffset += matchCount;
    }
    
    return rounds;
  }

  /**
   * Generate round-robin fixtures for league tournament
   * @param {Array} teams - Array of team IDs
   * @returns {Array} Array of rounds with fixtures
   */
  static generateRoundRobinFixtures(teams) {
    const teamCount = teams.length;
    const isEven = teamCount % 2 === 0;
    const workingTeams = isEven ? [...teams] : [...teams, null]; // Add dummy for odd count
    const rounds = [];
    const totalRounds = workingTeams.length - 1;
    
    for (let round = 0; round < totalRounds; round++) {
      const roundMatches = [];
      
      for (let i = 0; i < workingTeams.length / 2; i++) {
        const team1 = workingTeams[i];
        const team2 = workingTeams[workingTeams.length - 1 - i];
        
        // Skip if dummy team (null)
        if (team1 && team2) {
          roundMatches.push({
            matchNumber: round * (workingTeams.length / 2) + i + 1,
            round: round + 1,
            team1: team1,
            team2: team2,
            score: {
              team1: null,
              team2: null,
            },
            status: 'pending',
            startTime: null,
            played: false,
          });
        }
      }
      
      rounds.push({
        roundNumber: round + 1,
        name: `Round ${round + 1}`,
        matches: roundMatches,
        completed: false,
      });
      
      // Rotate teams (keep first team fixed, rotate others)
      if (round < totalRounds - 1) {
        const fixed = workingTeams[0];
        const rotating = workingTeams.slice(1);
        const last = rotating.pop();
        rotating.unshift(last);
        workingTeams[0] = fixed;
        for (let i = 1; i < workingTeams.length; i++) {
          workingTeams[i] = rotating[i - 1];
        }
      }
    }
    
    return rounds;
  }

  /**
   * Get the next power of 2 greater than or equal to n
   * @param {number} n - Input number
   * @returns {number} Next power of 2
   */
  static getNextPowerOfTwo(n) {
    let power = 1;
    while (power < n) {
      power *= 2;
    }
    return power;
  }

  /**
   * Get human-readable round name
   * @param {number} roundNumber - Current round number
   * @param {number} totalRounds - Total rounds in tournament
   * @returns {string} Round name
   */
  static getRoundName(roundNumber, totalRounds) {
    const roundsFromEnd = totalRounds - roundNumber;
    
    switch (roundsFromEnd) {
      case 0:
        return 'Final';
      case 1:
        return 'Semi-Final';
      case 2:
        return 'Quarter-Final';
      case 3:
        return 'Round of 16';
      case 4:
        return 'Round of 32';
      default:
        return `Round ${roundNumber}`;
    }
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Update bracket with match result
   * @param {Object} bracket - Current bracket
   * @param {string} matchNumber - Match number
   * @param {Object} result - Match result with winner and scores
   * @returns {Object} Updated bracket
   */
  static updateBracketWithResult(bracket, matchNumber, result) {
    const { type } = bracket;
    
    if (type === 'knockout') {
      return this.updateKnockoutBracket(bracket, matchNumber, result);
    } else if (type === 'league') {
      return this.updateLeagueBracket(bracket, matchNumber, result);
    }
    
    throw new Error(`Unsupported tournament type: ${type}`);
  }

  /**
   * Update knockout bracket with match result
   * @param {Object} bracket - Knockout bracket
   * @param {string} matchNumber - Match number
   * @param {Object} result - Match result
   * @returns {Object} Updated bracket
   */
  static updateKnockoutBracket(bracket, matchNumber, result) {
    const { rounds } = bracket;
    
    // Find the match
    for (const round of rounds) {
      const match = round.matches.find(m => m.matchNumber === matchNumber);
      
      if (match) {
        // Update match with result
        match.winner = result.winner;
        match.score = result.score;
        match.status = 'completed';
        
        // Check if round is completed
        round.completed = round.matches.every(m => m.status === 'completed' || m.status === 'bye');
        
        // Advance winner to next round
        if (match.nextMatch && result.winner) {
          const nextRound = rounds.find(r => r.roundNumber === round.roundNumber + 1);
          if (nextRound) {
            const nextMatch = nextRound.matches.find(m => m.matchNumber === match.nextMatch);
            if (nextMatch) {
              nextMatch[match.nextMatchPosition] = result.winner;
            }
          }
        }
        
        // Update eliminated status
        const loser = match.team1 === result.winner ? match.team2 : match.team1;
        if (loser) {
          const teamEntry = bracket.teams.find(t => t.teamId.toString() === loser.toString());
          if (teamEntry) {
            teamEntry.eliminated = true;
          }
        }
        
        // Check if this is the final
        if (round.roundNumber === bracket.totalRounds) {
          bracket.winners.champion = result.winner;
          bracket.winners.runnerUp = loser;
        }
        
        break;
      }
    }
    
    return bracket;
  }

  /**
   * Update league bracket with match result
   * @param {Object} bracket - League bracket
   * @param {string} matchNumber - Match number
   * @param {Object} result - Match result
   * @returns {Object} Updated bracket
   */
  static updateLeagueBracket(bracket, matchNumber, result) {
    const { rounds, standings } = bracket;
    
    // Find the match
    for (const round of rounds) {
      const match = round.matches.find(m => m.matchNumber === matchNumber);
      
      if (match) {
        // Update match
        match.score = result.score;
        match.status = 'completed';
        match.played = true;
        
        // Update standings
        const team1Standing = standings.find(s => s.teamId.toString() === match.team1.toString());
        const team2Standing = standings.find(s => s.teamId.toString() === match.team2.toString());
        
        if (team1Standing && team2Standing) {
          team1Standing.played += 1;
          team2Standing.played += 1;
          
          team1Standing.goalsFor += result.score.team1;
          team1Standing.goalsAgainst += result.score.team2;
          team2Standing.goalsFor += result.score.team2;
          team2Standing.goalsAgainst += result.score.team1;
          
          // Determine winner
          if (result.score.team1 > result.score.team2) {
            team1Standing.won += 1;
            team1Standing.points += 3;
            team2Standing.lost += 1;
          } else if (result.score.team2 > result.score.team1) {
            team2Standing.won += 1;
            team2Standing.points += 3;
            team1Standing.lost += 1;
          } else {
            team1Standing.drawn += 1;
            team1Standing.points += 1;
            team2Standing.drawn += 1;
            team2Standing.points += 1;
          }
          
          team1Standing.goalDifference = team1Standing.goalsFor - team1Standing.goalsAgainst;
          team2Standing.goalDifference = team2Standing.goalsFor - team2Standing.goalsAgainst;
        }
        
        // Check if round is completed
        round.completed = round.matches.every(m => m.played);
        
        break;
      }
    }
    
    // Sort standings
    bracket.standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
    
    // Update positions
    bracket.standings.forEach((standing, index) => {
      standing.position = index + 1;
    });
    
    return bracket;
  }
}

export default BracketGenerator;

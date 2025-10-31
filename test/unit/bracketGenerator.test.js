/**
 * Tournament Bracket Generator Tests
 */
import { describe, it, beforeEach } from 'mocha';
import '../helpers/setup.js';
import BracketGenerator from '@/modules/tournament/service/bracketGenerator.service.js';

describe('BracketGenerator', () => {
  describe('Knockout Tournament', () => {
    it('should generate bracket for 4 teams', () => {
      const tournament = {
        type: 'knockout',
        teams: ['team1', 'team2', 'team3', 'team4'],
        minTeams: 2,
      };

      const bracket = BracketGenerator.generateBracket(tournament);

      expect(bracket.type).to.equal('knockout');
      expect(bracket.totalRounds).to.equal(2); // 4 teams = 2 rounds
      expect(bracket.rounds).to.have.lengthOf(2);
      expect(bracket.rounds[0].matches).to.have.lengthOf(2); // 2 semi-finals
      expect(bracket.rounds[1].matches).to.have.lengthOf(1); // 1 final
    });

    it('should generate bracket for 8 teams', () => {
      const tournament = {
        type: 'knockout',
        teams: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'],
        minTeams: 2,
      };

      const bracket = BracketGenerator.generateBracket(tournament);

      expect(bracket.type).to.equal('knockout');
      expect(bracket.totalRounds).to.equal(3); // 8 teams = 3 rounds
      expect(bracket.rounds).to.have.lengthOf(3);
      expect(bracket.rounds[0].matches).to.have.lengthOf(4); // 4 quarter-finals
      expect(bracket.rounds[1].matches).to.have.lengthOf(2); // 2 semi-finals
      expect(bracket.rounds[2].matches).to.have.lengthOf(1); // 1 final
    });

    it('should handle odd number of teams with byes', () => {
      const tournament = {
        type: 'knockout',
        teams: ['team1', 'team2', 'team3', 'team4', 'team5'],
        minTeams: 2,
      };

      const bracket = BracketGenerator.generateBracket(tournament);

      expect(bracket.type).to.equal('knockout');
      expect(bracket.totalRounds).to.equal(3); // 5 teams need 8 slots = 3 rounds
      
      // Check that some matches have byes
      const firstRound = bracket.rounds[0];
      const byeMatches = firstRound.matches.filter(m => m.status === 'bye');
      expect(byeMatches.length).to.be.greaterThan(0);
      
      // Teams with byes should automatically advance
      byeMatches.forEach(match => {
        expect(match.winner).not.to.be.null;
      });
    });

    it('should assign correct round names', () => {
      const tournament = {
        type: 'knockout',
        teams: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'],
        minTeams: 2,
      };

      const bracket = BracketGenerator.generateBracket(tournament);

      expect(bracket.rounds[0].name).to.equal('Quarter-Final');
      expect(bracket.rounds[1].name).to.equal('Semi-Final');
      expect(bracket.rounds[2].name).to.equal('Final');
    });

    it('should throw error if not enough teams', () => {
      const tournament = {
        type: 'knockout',
        teams: ['team1'],
        minTeams: 4,
      };

      expect(() => BracketGenerator.generateBracket(tournament)).toThrow(
        'Not enough teams'
      );
    });

    it('should throw error if no teams registered', () => {
      const tournament = {
        type: 'knockout',
        teams: [],
        minTeams: 2,
      };

      expect(() => BracketGenerator.generateBracket(tournament)).toThrow(
        'Cannot generate bracket: No teams registered'
      );
    });

    it('should seed teams correctly', () => {
      const tournament = {
        type: 'knockout',
        teams: ['team1', 'team2', 'team3', 'team4'],
        minTeams: 2,
      };

      const bracket = BracketGenerator.generateBracket(tournament);

      expect(bracket.teams).to.have.lengthOf(4);
      bracket.teams.forEach((team, index) => {
        expect(team.seed).to.equal(index + 1);
        expect(team.eliminated).to.equal(false);
      });
    });
  });

  describe('League Tournament', () => {
    it('should generate round-robin fixtures for 4 teams', () => {
      const tournament = {
        type: 'league',
        teams: ['team1', 'team2', 'team3', 'team4'],
        minTeams: 2,
      };

      const bracket = BracketGenerator.generateBracket(tournament);

      expect(bracket.type).to.equal('league');
      expect(bracket.totalRounds).to.equal(3); // 4 teams = 3 rounds in round-robin
      
      // Total matches = n * (n-1) / 2 where n = 4
      const totalMatches = bracket.rounds.reduce(
        (sum, round) => sum + round.matches.length,
        0
      );
      expect(totalMatches).to.equal(6); // 4 * 3 / 2 = 6 matches
    });

    it('should generate round-robin fixtures for odd number of teams', () => {
      const tournament = {
        type: 'league',
        teams: ['team1', 'team2', 'team3', 'team4', 'team5'],
        minTeams: 2,
      };

      const bracket = BracketGenerator.generateBracket(tournament);

      expect(bracket.type).to.equal('league');
      expect(bracket.totalRounds).to.equal(5); // 5 teams = 5 rounds
      
      // Total matches = n * (n-1) / 2 where n = 5
      const totalMatches = bracket.rounds.reduce(
        (sum, round) => sum + round.matches.length,
        0
      );
      expect(totalMatches).to.equal(10); // 5 * 4 / 2 = 10 matches
    });

    it('should initialize standings correctly', () => {
      const tournament = {
        type: 'league',
        teams: ['team1', 'team2', 'team3', 'team4'],
        minTeams: 2,
      };

      const bracket = BracketGenerator.generateBracket(tournament);

      expect(bracket.standings).to.have.lengthOf(4);
      bracket.standings.forEach((standing, index) => {
        expect(standing.position).to.equal(index + 1);
        expect(standing.played).to.equal(0);
        expect(standing.won).to.equal(0);
        expect(standing.drawn).to.equal(0);
        expect(standing.lost).to.equal(0);
        expect(standing.points).to.equal(0);
      });
    });

    it('should ensure each team plays every other team exactly once', () => {
      const tournament = {
        type: 'league',
        teams: ['team1', 'team2', 'team3', 'team4'],
        minTeams: 2,
      };

      const bracket = BracketGenerator.generateBracket(tournament);

      // Count fixtures for each team
      const teamMatchCounts = {};
      tournament.teams.forEach(team => {
        teamMatchCounts[team] = 0;
      });

      bracket.rounds.forEach(round => {
        round.matches.forEach(match => {
          teamMatchCounts[match.team1]++;
          teamMatchCounts[match.team2]++;
        });
      });

      // Each team should play 3 matches (n-1 where n=4)
      Object.values(teamMatchCounts).forEach(count => {
        expect(count).to.equal(3);
      });
    });
  });

  describe('Match Result Updates', () => {
    describe('Knockout Updates', () => {
      let bracket;

      beforeEach(() => {
        const tournament = {
          type: 'knockout',
          teams: ['team1', 'team2', 'team3', 'team4'],
          minTeams: 2,
        };
        bracket = BracketGenerator.generateBracket(tournament);
      });

      it('should update match with result', () => {
        const matchNumber = 1;
        const result = {
          winner: bracket.rounds[0].matches[0].team1,
          score: { team1: 3, team2: 1 },
        };

        const updatedBracket = BracketGenerator.updateBracketWithResult(
          bracket,
          matchNumber,
          result
        );

        const match = updatedBracket.rounds[0].matches[0];
        expect(match.winner).to.equal(result.winner);
        expect(match.score).toEqual(result.score);
        expect(match.status).to.equal('completed');
      });

      it('should advance winner to next round', () => {
        const matchNumber = 1;
        const firstRoundMatch = bracket.rounds[0].matches[0];
        const result = {
          winner: firstRoundMatch.team1,
          score: { team1: 2, team2: 1 },
        };

        const updatedBracket = BracketGenerator.updateBracketWithResult(
          bracket,
          matchNumber,
          result
        );

        // Check that winner advanced to final
        const finalMatch = updatedBracket.rounds[1].matches[0];
        expect(finalMatch.team1).to.equal(result.winner);
      });

      it('should mark loser as eliminated', () => {
        const matchNumber = 1;
        const firstRoundMatch = bracket.rounds[0].matches[0];
        const result = {
          winner: firstRoundMatch.team1,
          score: { team1: 2, team2: 0 },
        };

        const updatedBracket = BracketGenerator.updateBracketWithResult(
          bracket,
          matchNumber,
          result
        );

        const eliminatedTeam = updatedBracket.teams.find(
          t => t.teamId.toString() === firstRoundMatch.team2.toString()
        );
        expect(eliminatedTeam.eliminated).to.equal(true);
      });

      it('should identify champion after final', () => {
        // Complete semi-finals first
        let updatedBracket = BracketGenerator.updateBracketWithResult(
          bracket,
          1,
          {
            winner: bracket.rounds[0].matches[0].team1,
            score: { team1: 2, team2: 1 },
          }
        );

        updatedBracket = BracketGenerator.updateBracketWithResult(
          updatedBracket,
          2,
          {
            winner: updatedBracket.rounds[0].matches[1].team1,
            score: { team1: 3, team2: 0 },
          }
        );

        // Complete final
        const finalWinner = updatedBracket.rounds[1].matches[0].team1;
        updatedBracket = BracketGenerator.updateBracketWithResult(
          updatedBracket,
          3,
          {
            winner: finalWinner,
            score: { team1: 2, team2: 1 },
          }
        );

        expect(updatedBracket.winners.champion).to.equal(finalWinner);
        expect(updatedBracket.winners.runnerUp).not.to.be.null;
      });
    });

    describe('League Updates', () => {
      let bracket;

      beforeEach(() => {
        const tournament = {
          type: 'league',
          teams: ['team1', 'team2', 'team3', 'team4'],
          minTeams: 2,
        };
        bracket = BracketGenerator.generateBracket(tournament);
      });

      it('should update match result', () => {
        const matchNumber = 1;
        const result = {
          score: { team1: 2, team2: 1 },
        };

        const updatedBracket = BracketGenerator.updateBracketWithResult(
          bracket,
          matchNumber,
          result
        );

        const match = updatedBracket.rounds[0].matches[0];
        expect(match.score).toEqual(result.score);
        expect(match.status).to.equal('completed');
        expect(match.played).to.equal(true);
      });

      it('should update standings after win', () => {
        const matchNumber = 1;
        const match = bracket.rounds[0].matches[0];
        const result = {
          score: { team1: 3, team2: 1 },
        };

        const updatedBracket = BracketGenerator.updateBracketWithResult(
          bracket,
          matchNumber,
          result
        );

        const team1Standing = updatedBracket.standings.find(
          s => s.teamId.toString() === match.team1.toString()
        );
        const team2Standing = updatedBracket.standings.find(
          s => s.teamId.toString() === match.team2.toString()
        );

        // Winner gets 3 points
        expect(team1Standing.won).to.equal(1);
        expect(team1Standing.points).to.equal(3);
        expect(team1Standing.goalsFor).to.equal(3);
        expect(team1Standing.goalsAgainst).to.equal(1);

        // Loser gets 0 points
        expect(team2Standing.lost).to.equal(1);
        expect(team2Standing.points).to.equal(0);
        expect(team2Standing.goalsFor).to.equal(1);
        expect(team2Standing.goalsAgainst).to.equal(3);
      });

      it('should update standings after draw', () => {
        const matchNumber = 1;
        const match = bracket.rounds[0].matches[0];
        const result = {
          score: { team1: 2, team2: 2 },
        };

        const updatedBracket = BracketGenerator.updateBracketWithResult(
          bracket,
          matchNumber,
          result
        );

        const team1Standing = updatedBracket.standings.find(
          s => s.teamId.toString() === match.team1.toString()
        );
        const team2Standing = updatedBracket.standings.find(
          s => s.teamId.toString() === match.team2.toString()
        );

        // Both teams get 1 point
        expect(team1Standing.drawn).to.equal(1);
        expect(team1Standing.points).to.equal(1);
        expect(team2Standing.drawn).to.equal(1);
        expect(team2Standing.points).to.equal(1);
      });

      it('should sort standings by points', () => {
        // Play multiple matches
        let updatedBracket = bracket;
        
        // Team1 wins
        updatedBracket = BracketGenerator.updateBracketWithResult(
          updatedBracket,
          1,
          { score: { team1: 3, team2: 0 } }
        );

        // Team2 wins
        updatedBracket = BracketGenerator.updateBracketWithResult(
          updatedBracket,
          2,
          { score: { team1: 0, team2: 2 } }
        );

        // Check that standings are sorted
        const points = updatedBracket.standings.map(s => s.points);
        const sortedPoints = [...points].sort((a, b) => b - a);
        expect(points).toEqual(sortedPoints);
      });
    });
  });

  describe('Utility Functions', () => {
    it('should calculate next power of two', () => {
      expect(BracketGenerator.getNextPowerOfTwo(1)).toBe(1);
      expect(BracketGenerator.getNextPowerOfTwo(2)).toBe(2);
      expect(BracketGenerator.getNextPowerOfTwo(3)).toBe(4);
      expect(BracketGenerator.getNextPowerOfTwo(5)).toBe(8);
      expect(BracketGenerator.getNextPowerOfTwo(8)).toBe(8);
      expect(BracketGenerator.getNextPowerOfTwo(9)).toBe(16);
    });

    it('should shuffle array', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8];
      const shuffled = BracketGenerator.shuffleArray(original);

      // Same length
      expect(shuffled.length).to.equal(original.length);

      // Same elements
      expect(shuffled.sort()).toEqual(original.sort());

      // Different order (statistically very likely)
      // This test might occasionally fail due to randomness, but it's very unlikely
      const isDifferent = shuffled.some((val, idx) => val !== original[idx]);
      expect(isDifferent).to.equal(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unsupported tournament type', () => {
      const tournament = {
        type: 'invalid',
        teams: ['team1', 'team2'],
        minTeams: 2,
      };

      expect(() => BracketGenerator.generateBracket(tournament)).toThrow(
        'Unsupported tournament type'
      );
    });

    it('should throw error for empty teams array', () => {
      const tournament = {
        type: 'knockout',
        teams: [],
        minTeams: 2,
      };

      expect(() => BracketGenerator.generateBracket(tournament)).toThrow(
        'Cannot generate bracket'
      );
    });

    it('should throw error when updating invalid tournament type', () => {
      const bracket = {
        type: 'invalid',
        rounds: [],
      };

      expect(() =>
        BracketGenerator.updateBracketWithResult(bracket, 1, {})
      ).toThrow('Unsupported tournament type');
    });
  });
});

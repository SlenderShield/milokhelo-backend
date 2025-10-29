/**
 * Tournament Service
 */
import { BracketGenerator } from '../domain/BracketGenerator.js';

export class TournamentService {
  constructor(tournamentRepository, eventBus, logger) {
    this.tournamentRepository = tournamentRepository;
    this.eventBus = eventBus;
    this.logger = logger.child({ context: 'TournamentService' });
  }

  async createTournament(data, organizerId) {
    const tournament = await this.tournamentRepository.create({ ...data, organizerId });
    await this.eventBus.publish('tournament.created', { tournamentId: tournament._id });
    return tournament;
  }

  async getTournamentById(id) {
    return this.tournamentRepository.findById(id);
  }

  async listTournaments(filters = {}) {
    return this.tournamentRepository.find(filters);
  }

  async updateTournament(id, data, userId) {
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament || tournament.organizerId.toString() !== userId) {
      throw new Error('Not authorized');
    }
    return this.tournamentRepository.update(id, data);
  }

  async cancelTournament(id, userId) {
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament || tournament.organizerId.toString() !== userId) {
      throw new Error('Not authorized');
    }
    await this.tournamentRepository.update(id, { status: 'cancelled' });
    await this.eventBus.publish('tournament.cancelled', { tournamentId: id });
  }

  async registerTeam(tournamentId, teamId) {
    await this.tournamentRepository.addTeam(tournamentId, teamId);
    await this.eventBus.publish('tournament.team_registered', { tournamentId, teamId });
  }

  async startTournament(tournamentId, userId) {
    const tournament = await this.tournamentRepository.findById(tournamentId);
    if (!tournament || tournament.organizerId.toString() !== userId) {
      throw new Error('Not authorized');
    }

    // Check if tournament has enough teams
    if (!tournament.teams || tournament.teams.length === 0) {
      throw new Error('Cannot start tournament: No teams registered');
    }

    // Generate bracket based on tournament type
    try {
      const bracket = BracketGenerator.generateBracket(tournament);
      
      // Update tournament with bracket and status
      const updateData = {
        status: 'ongoing',
        currentRound: 1,
        bracket: bracket,
        rounds: bracket.totalRounds,
      };
      
      await this.tournamentRepository.update(tournamentId, updateData);
      await this.eventBus.publish('tournament.started', { 
        tournamentId, 
        bracket,
        totalRounds: bracket.totalRounds,
      });
      
      this.logger.info(`Tournament ${tournamentId} started with ${bracket.totalRounds} rounds`);
      
      return { 
        message: 'Tournament started successfully',
        bracket,
        totalRounds: bracket.totalRounds,
        currentRound: 1,
      };
    } catch (error) {
      this.logger.error(`Failed to start tournament ${tournamentId}:`, error);
      throw new Error(`Failed to start tournament: ${error.message}`);
    }
  }

  async getBracket(tournamentId) {
    const tournament = await this.tournamentRepository.findById(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }
    
    if (!tournament.bracket) {
      throw new Error('Tournament bracket not generated yet');
    }
    
    return tournament.bracket;
  }

  async updateMatchResult(tournamentId, matchNumber, result, userId) {
    const tournament = await this.tournamentRepository.findById(tournamentId);
    
    if (!tournament) {
      throw new Error('Tournament not found');
    }
    
    if (tournament.organizerId.toString() !== userId) {
      throw new Error('Not authorized');
    }
    
    if (!tournament.bracket) {
      throw new Error('Tournament bracket not found');
    }
    
    try {
      // Update bracket with match result
      const updatedBracket = BracketGenerator.updateBracketWithResult(
        tournament.bracket,
        matchNumber,
        result
      );
      
      // Determine if we should advance to next round
      const currentRound = updatedBracket.rounds.find(r => r.roundNumber === tournament.currentRound);
      let updateData = { bracket: updatedBracket };
      
      if (currentRound && currentRound.completed) {
        updateData.currentRound = tournament.currentRound + 1;
        
        // Check if tournament is completed
        if (tournament.currentRound >= tournament.rounds) {
          updateData.status = 'completed';
          await this.eventBus.publish('tournament.completed', {
            tournamentId,
            winner: updatedBracket.winners?.champion || updatedBracket.standings?.[0]?.teamId,
          });
        } else {
          await this.eventBus.publish('tournament.round_completed', {
            tournamentId,
            round: tournament.currentRound,
          });
        }
      }
      
      await this.tournamentRepository.update(tournamentId, updateData);
      await this.eventBus.publish('tournament.match_updated', {
        tournamentId,
        matchNumber,
        result,
      });
      
      return updatedBracket;
    } catch (error) {
      this.logger.error(`Failed to update match result:`, error);
      throw new Error(`Failed to update match result: ${error.message}`);
    }
  }
}

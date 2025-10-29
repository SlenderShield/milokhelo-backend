/**
 * Tournament Repository, Service, Controller - Comprehensive Stubs
 */
import TournamentModel from './TournamentModel.js';

export class TournamentRepository {
  constructor(logger) {
    this.logger = logger.child({ context: 'TournamentRepository' });
  }

  async create(data) {
    const tournament = new TournamentModel(data);
    await tournament.save();
    return tournament.toObject();
  }

  async findById(id) {
    return TournamentModel.findById(id).lean();
  }

  async find(query = {}) {
    return TournamentModel.find(query).lean();
  }

  async update(id, data) {
    return TournamentModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async delete(id) {
    return TournamentModel.findByIdAndDelete(id);
  }

  async addTeam(tournamentId, teamId) {
    return TournamentModel.findByIdAndUpdate(tournamentId, { $addToSet: { teams: teamId } }, { new: true }).lean();
  }
}

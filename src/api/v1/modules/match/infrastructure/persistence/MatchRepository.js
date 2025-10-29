/**
 * Match Repository
 */
import MatchModel from './MatchModel.js';

class MatchRepository {
  constructor(logger) {
    this.logger = logger.child({ context: 'MatchRepository' });
  }

  async create(matchData) {
    const match = new MatchModel(matchData);
    await match.save();
    return match.toObject();
  }

  async findById(id) {
    return MatchModel.findById(id).lean();
  }

  async find(query = {}) {
    return MatchModel.find(query).sort({ startAt: 1 }).lean();
  }

  async update(id, data) {
    return MatchModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async delete(id) {
    return MatchModel.findByIdAndDelete(id);
  }

  async addParticipant(matchId, userId) {
    return MatchModel.findByIdAndUpdate(matchId, { $addToSet: { participants: userId } }, { new: true }).lean();
  }

  async removeParticipant(matchId, userId) {
    return MatchModel.findByIdAndUpdate(matchId, { $pull: { participants: userId } }, { new: true }).lean();
  }
}

export default MatchRepository;

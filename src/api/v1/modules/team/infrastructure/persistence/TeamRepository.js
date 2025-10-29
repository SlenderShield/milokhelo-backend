/**
 * Team Repository
 */
import TeamModel from './TeamModel.js';

class TeamRepository {
  constructor(logger) {
    this.logger = logger.child({ context: 'TeamRepository' });
  }

  async create(teamData) {
    const team = new TeamModel(teamData);
    await team.save();
    return team.toObject();
  }

  async findById(id) {
    return TeamModel.findById(id).lean();
  }

  async find(query = {}) {
    return TeamModel.find(query).lean();
  }

  async update(id, data) {
    return TeamModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async delete(id) {
    return TeamModel.findByIdAndDelete(id);
  }

  async addMember(teamId, userId, role = 'member') {
    return TeamModel.findByIdAndUpdate(
      teamId,
      { $push: { members: { userId, role, joinedAt: new Date() } } },
      { new: true }
    ).lean();
  }

  async removeMember(teamId, userId) {
    return TeamModel.findByIdAndUpdate(teamId, { $pull: { members: { userId } } }, { new: true }).lean();
  }
}

export default TeamRepository;

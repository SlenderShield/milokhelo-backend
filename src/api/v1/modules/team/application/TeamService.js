/**
 * Team Service
 */
class TeamService {
  constructor(teamRepository, eventBus, logger) {
    this.teamRepository = teamRepository;
    this.eventBus = eventBus;
    this.logger = logger.child({ context: 'TeamService' });
  }

  async createTeam(teamData, captainId) {
    const team = await this.teamRepository.create({
      ...teamData,
      captainId,
      members: [{ userId: captainId, role: 'captain', joinedAt: new Date() }],
    });
    await this.eventBus.publish('team.created', { teamId: team._id, captainId });
    return team;
  }

  async getTeamById(teamId) {
    return this.teamRepository.findById(teamId);
  }

  async listTeams(filters = {}) {
    return this.teamRepository.find(filters);
  }

  async updateTeam(teamId, data, userId) {
    const team = await this.teamRepository.findById(teamId);
    if (!team || team.captainId.toString() !== userId) {
      throw new Error('Not authorized');
    }
    const updated = await this.teamRepository.update(teamId, data);
    await this.eventBus.publish('team.updated', { teamId, data });
    return updated;
  }

  async deleteTeam(teamId, userId) {
    const team = await this.teamRepository.findById(teamId);
    if (!team || team.captainId.toString() !== userId) {
      throw new Error('Not authorized');
    }
    await this.teamRepository.delete(teamId);
    await this.eventBus.publish('team.deleted', { teamId });
  }

  async joinTeam(teamId, userId) {
    await this.teamRepository.addMember(teamId, userId);
    await this.eventBus.publish('team.member_joined', { teamId, userId });
  }

  async leaveTeam(teamId, userId) {
    await this.teamRepository.removeMember(teamId, userId);
    await this.eventBus.publish('team.member_left', { teamId, userId });
  }
}

export default TeamService;

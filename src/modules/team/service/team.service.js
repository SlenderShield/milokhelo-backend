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

  async updateTeam(teamId, data, userId, userRoles = []) {
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      const error = new Error('Team not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if user is captain or admin
    const isCaptain = team.captainId.toString() === userId;
    const isAdmin = userRoles.includes('admin') || userRoles.includes('superadmin');

    if (!isCaptain && !isAdmin) {
      const error = new Error('Not authorized. Only team captain or admin can update the team');
      error.statusCode = 403;
      throw error;
    }

    // If changing captain, verify new captain is a team member
    if (data.captainId && data.captainId !== team.captainId.toString()) {
      const isMember = team.members.some((m) => m.userId.toString() === data.captainId);
      if (!isMember) {
        const error = new Error('New captain must be a team member');
        error.statusCode = 400;
        throw error;
      }

      // Update the members array to reflect captain change
      const membersUpdate = team.members.map((m) => {
        if (m.userId.toString() === data.captainId) {
          return { ...m, role: 'captain' };
        } else if (m.userId.toString() === team.captainId.toString()) {
          return { ...m, role: 'member' };
        }
        return m;
      });
      data.members = membersUpdate;
    }

    const updated = await this.teamRepository.update(teamId, data);
    await this.eventBus.publish('team.updated', { teamId, data });
    return updated;
  }

  async deleteTeam(teamId, userId, userRoles = []) {
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      const error = new Error('Team not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if user is captain or admin
    const isCaptain = team.captainId.toString() === userId;
    const isAdmin = userRoles.includes('admin') || userRoles.includes('superadmin');

    if (!isCaptain && !isAdmin) {
      const error = new Error('Not authorized. Only team captain or admin can delete the team');
      error.statusCode = 403;
      throw error;
    }

    await this.teamRepository.delete(teamId);
    await this.eventBus.publish('team.deleted', { teamId });
  }

  async joinTeam(teamId, userId, joinCode) {
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      const error = new Error('Team not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if user is already a member
    const isMember = team.members.some((m) => m.userId.toString() === userId);
    if (isMember) {
      const error = new Error('You are already a member of this team');
      error.statusCode = 400;
      throw error;
    }

    // Check if team is private and requires join code
    if (team.isPrivate && team.joinCode) {
      if (!joinCode || joinCode !== team.joinCode) {
        const error = new Error('Invalid or missing join code');
        error.statusCode = 403;
        throw error;
      }
    }

    await this.teamRepository.addMember(teamId, userId);
    await this.eventBus.publish('team.member_joined', { teamId, userId });
  }

  async leaveTeam(teamId, userId) {
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      const error = new Error('Team not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if user is a member
    const isMember = team.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      const error = new Error('You are not a member of this team');
      error.statusCode = 400;
      throw error;
    }

    // Prevent captain from leaving (they must transfer captaincy first)
    if (team.captainId.toString() === userId) {
      const error = new Error(
        'Captain cannot leave the team. Transfer captaincy first or delete the team'
      );
      error.statusCode = 400;
      throw error;
    }

    await this.teamRepository.removeMember(teamId, userId);
    await this.eventBus.publish('team.member_left', { teamId, userId });
  }
}

export default TeamService;

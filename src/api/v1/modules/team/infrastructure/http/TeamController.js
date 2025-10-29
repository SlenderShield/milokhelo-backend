/**
 * Team Controller
 */
import { asyncHandler, HTTP_STATUS } from '../../../../../../core/http/index.js';

class TeamController {
  constructor(teamService, logger) {
    this.teamService = teamService;
    this.logger = logger.child({ context: 'TeamController' });
  }

  create() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const team = await this.teamService.createTeam(req.body, userId);
      res.status(HTTP_STATUS.CREATED).json(team);
    });
  }

  list() {
    return asyncHandler(async (req, res) => {
      const { sport, q } = req.query;
      const filters = {};
      if (sport) filters.sport = sport;
      if (q) filters.name = new RegExp(q, 'i');
      const teams = await this.teamService.listTeams(filters);
      res.status(HTTP_STATUS.OK).json(teams);
    });
  }

  getById() {
    return asyncHandler(async (req, res) => {
      const team = await this.teamService.getTeamById(req.params.id);
      res.status(HTTP_STATUS.OK).json(team);
    });
  }

  update() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const team = await this.teamService.updateTeam(req.params.id, req.body, userId);
      res.status(HTTP_STATUS.OK).json(team);
    });
  }

  delete() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      await this.teamService.deleteTeam(req.params.id, userId);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    });
  }

  join() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      await this.teamService.joinTeam(req.params.id, userId);
      res.status(HTTP_STATUS.OK).json({ message: 'Joined team' });
    });
  }

  leave() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      await this.teamService.leaveTeam(req.params.id, userId);
      res.status(HTTP_STATUS.OK).json({ message: 'Left team' });
    });
  }
}

export default TeamController;

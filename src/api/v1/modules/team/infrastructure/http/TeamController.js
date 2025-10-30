/**
 * Team Controller
 */
import { asyncHandler, HTTP_STATUS } from '@/core/http/index.js';

class TeamController {
  constructor(teamService, logger) {
    this.teamService = teamService;
    this.logger = logger.child({ context: 'TeamController' });
  }

  create() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const team = await this.teamService.createTeam(req.body, userId);
      res.status(HTTP_STATUS.CREATED).json({
        status: 'success',
        data: team,
      });
    });
  }

  list() {
    return asyncHandler(async (req, res) => {
      const { sport, q } = req.query;
      const filters = {};
      if (sport) filters.sport = sport;
      if (q) filters.name = new RegExp(q, 'i');
      const teams = await this.teamService.listTeams(filters);
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: teams,
      });
    });
  }

  getById() {
    return asyncHandler(async (req, res) => {
      const team = await this.teamService.getTeamById(req.params.id);
      if (!team) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Team not found',
        });
      }
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: team,
      });
    });
  }

  update() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;
      const userRoles = req.user?.roles || [];

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const team = await this.teamService.updateTeam(req.params.id, req.body, userId, userRoles);
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: team,
      });
    });
  }

  delete() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;
      const userRoles = req.user?.roles || [];

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      await this.teamService.deleteTeam(req.params.id, userId, userRoles);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    });
  }

  join() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      const { joinCode } = req.body;
      await this.teamService.joinTeam(req.params.id, userId, joinCode);
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Successfully joined team',
      });
    });
  }

  leave() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;

      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }

      await this.teamService.leaveTeam(req.params.id, userId);
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Successfully left team',
      });
    });
  }
}

export default TeamController;

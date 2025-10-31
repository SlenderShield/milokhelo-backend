/**
 * Tournament Controller
 */
import express from 'express';
import { asyncHandler, HTTP_STATUS, requireAuth, validate } from '@/core/http/index.js';
import {
  createTournamentValidation,
  updateTournamentValidation,
  joinTournamentValidation,
  tournamentIdValidation,
  startTournamentValidation,
} from '../validation/tournament.validation.js';

export class TournamentController {
  constructor(tournamentService, logger) {
    this.tournamentService = tournamentService;
    this.logger = logger.child({ context: 'TournamentController' });
  }

  create() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const tournament = await this.tournamentService.createTournament(req.body, userId);
      res.status(HTTP_STATUS.CREATED).json(tournament);
    });
  }

  list() {
    return asyncHandler(async (req, res) => {
      const { sport, type } = req.query;
      const filters = {};
      if (sport) filters.sport = sport;
      if (type) filters.type = type;
      const tournaments = await this.tournamentService.listTournaments(filters);
      res.status(HTTP_STATUS.OK).json(tournaments);
    });
  }

  getById() {
    return asyncHandler(async (req, res) => {
      const tournament = await this.tournamentService.getTournamentById(req.params.id);
      res.status(HTTP_STATUS.OK).json(tournament);
    });
  }

  update() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;
      const userRoles = req.user?.roles || req.session?.user?.roles || ['user'];
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }
      const tournament = await this.tournamentService.updateTournament(
        req.params.id,
        req.body,
        userId,
        userRoles
      );
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Tournament updated successfully',
        data: tournament,
      });
    });
  }

  cancel() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;
      const userRoles = req.user?.roles || req.session?.user?.roles || ['user'];
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }
      await this.tournamentService.cancelTournament(req.params.id, userId, userRoles);
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
      const { teamId } = req.body;
      await this.tournamentService.joinTournament(req.params.id, teamId, userId);
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Successfully joined tournament',
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
      const { teamId } = req.body;
      await this.tournamentService.leaveTournament(req.params.id, teamId, userId);
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Successfully left tournament',
      });
    });
  }

  register() {
    return asyncHandler(async (req, res) => {
      const { teamId } = req.body;
      await this.tournamentService.registerTeam(req.params.id, teamId);
      res.status(HTTP_STATUS.OK).json({ message: 'Team registered' });
    });
  }

  start() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }
      const result = await this.tournamentService.startTournament(req.params.id, userId);
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        ...result,
      });
    });
  }

  getBracket() {
    return asyncHandler(async (req, res) => {
      const bracket = await this.tournamentService.getBracket(req.params.id);
      res.status(HTTP_STATUS.OK).json(bracket);
    });
  }

  updateMatchResult() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const { matchNumber, result } = req.body;
      const updatedBracket = await this.tournamentService.updateMatchResult(
        req.params.id,
        matchNumber,
        result,
        userId
      );
      res.status(HTTP_STATUS.OK).json(updatedBracket);
    });
  }
}

export function createTournamentRoutes(controller) {
  const router = express.Router();

  // Public endpoints
  router.get('/', controller.list());
  router.get('/:id', controller.getById());
  router.get('/:id/bracket', controller.getBracket());

  // Protected endpoints - require authentication
  router.post('/', requireAuth(), validate(createTournamentValidation), controller.create());

  router.put('/:id', requireAuth(), validate(updateTournamentValidation), controller.update());

  // Delete endpoint - organizer or admin only (checked in service)
  router.delete('/:id', requireAuth(), validate(tournamentIdValidation), controller.cancel());

  // Tournament participation endpoints
  router.post('/:id/join', requireAuth(), validate(joinTournamentValidation), controller.join());

  router.post('/:id/leave', requireAuth(), validate(joinTournamentValidation), controller.leave());

  // Tournament management endpoints
  router.put('/:id/start', requireAuth(), validate(startTournamentValidation), controller.start());

  // Legacy/additional endpoints
  router.post('/:id/register', requireAuth(), controller.register());
  router.post('/:id/match-result', requireAuth(), controller.updateMatchResult());

  return router;
}

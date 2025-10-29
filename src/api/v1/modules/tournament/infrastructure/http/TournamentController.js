/**
 * Tournament Controller
 */
import express from 'express';
import { asyncHandler } from '../../../../../../common/utils/index.js';
import { HTTP_STATUS } from '../../../../../../common/constants/index.js';

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
      const userId = req.session?.userId;
      const tournament = await this.tournamentService.updateTournament(req.params.id, req.body, userId);
      res.status(HTTP_STATUS.OK).json(tournament);
    });
  }

  cancel() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      await this.tournamentService.cancelTournament(req.params.id, userId);
      res.status(HTTP_STATUS.NO_CONTENT).send();
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
      const userId = req.session?.userId;
      const result = await this.tournamentService.startTournament(req.params.id, userId);
      res.status(HTTP_STATUS.OK).json(result);
    });
  }
}

export function createTournamentRoutes(controller) {
  const router = express.Router();

  router.post('/', controller.create());
  router.get('/', controller.list());
  router.get('/:id', controller.getById());
  router.patch('/:id', controller.update());
  router.delete('/:id', controller.cancel());
  router.post('/:id/register', controller.register());
  router.post('/:id/start', controller.start());

  return router;
}

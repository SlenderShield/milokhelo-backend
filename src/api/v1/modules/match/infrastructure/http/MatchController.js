/**
 * Match Controller
 */
import { asyncHandler, HTTP_STATUS } from '../../../../../../core/http/index.js';

class MatchController {
  constructor(matchService, logger) {
    this.matchService = matchService;
    this.logger = logger.child({ context: 'MatchController' });
  }

  create() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const match = await this.matchService.createMatch(req.body, userId);
      res.status(HTTP_STATUS.CREATED).json(match);
    });
  }

  list() {
    return asyncHandler(async (req, res) => {
      const { sport, city, startAt } = req.query;
      const filters = {};
      if (sport) filters.sport = sport;
      if (city) filters['location.city'] = city;
      if (startAt) filters.startAt = { $gte: new Date(startAt) };
      const matches = await this.matchService.listMatches(filters);
      res.status(HTTP_STATUS.OK).json(matches);
    });
  }

  getById() {
    return asyncHandler(async (req, res) => {
      const match = await this.matchService.getMatchById(req.params.id);
      res.status(HTTP_STATUS.OK).json(match);
    });
  }

  update() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const match = await this.matchService.updateMatch(req.params.id, req.body, userId);
      res.status(HTTP_STATUS.OK).json(match);
    });
  }

  cancel() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      await this.matchService.cancelMatch(req.params.id, userId, req.body.cancelReason);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    });
  }

  join() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      await this.matchService.joinMatch(req.params.id, userId);
      res.status(HTTP_STATUS.OK).json({ message: 'Joined match' });
    });
  }

  leave() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      await this.matchService.leaveMatch(req.params.id, userId);
      res.status(HTTP_STATUS.OK).json({ message: 'Left match' });
    });
  }

  start() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      await this.matchService.startMatch(req.params.id, userId);
      res.status(HTTP_STATUS.OK).json({ message: 'Match started' });
    });
  }

  finish() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const result = await this.matchService.finishMatch(req.params.id, userId, req.body);
      res.status(HTTP_STATUS.OK).json(result);
    });
  }
}

export default MatchController;

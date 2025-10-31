/**
 * Match Controller
 */
import { asyncHandler, HTTP_STATUS } from '@/core/http/index.js';
import { MatchDTO } from '@/common/dto/index.js';

class MatchController {
  constructor(matchService, logger) {
    this.matchService = matchService;
    this.logger = logger.child({ context: 'MatchController' });
  }

  create() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const match = await this.matchService.createMatch(req.body, userId);
      const safeMatch = MatchDTO.transform(match, { includeTimestamps: true });
      res.status(HTTP_STATUS.CREATED).json(safeMatch);
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
      const safeMatches = matches.map((m) => MatchDTO.transformMinimal(m));
      res.status(HTTP_STATUS.OK).json(safeMatches);
    });
  }

  getById() {
    return asyncHandler(async (req, res) => {
      const match = await this.matchService.getMatchById(req.params.id);
      const safeMatch = MatchDTO.transform(match, { includeTimestamps: true });
      res.status(HTTP_STATUS.OK).json(safeMatch);
    });
  }

  update() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const match = await this.matchService.updateMatch(req.params.id, req.body, userId);
      const safeMatch = MatchDTO.transform(match, { includeTimestamps: true });
      res.status(HTTP_STATUS.OK).json(safeMatch);
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
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }
      await this.matchService.joinMatch(req.params.id, userId);
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Successfully joined match',
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
      await this.matchService.leaveMatch(req.params.id, userId);
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Successfully left match',
      });
    });
  }

  updateScore() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }
      const match = await this.matchService.updateScore(req.params.id, req.body.scores, userId);
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Score updated successfully',
        data: match,
      });
    });
  }

  updateStatus() {
    return asyncHandler(async (req, res) => {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Authentication required',
        });
      }
      const match = await this.matchService.updateStatus(req.params.id, req.body.status, userId);
      res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Match status updated successfully',
        data: match,
      });
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

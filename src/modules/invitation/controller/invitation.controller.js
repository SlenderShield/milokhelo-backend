/**
 * Invitation Controller
 */
import { asyncHandler, HTTP_STATUS } from '@/core/http/index.js';

class InvitationController {
  constructor(invitationService, logger) {
    this.invitationService = invitationService;
    this.logger = logger.child({ context: 'InvitationController' });
  }

  createInvitation() {
    return asyncHandler(async (req, res) => {
      const senderId = req.session?.userId;
      const invitation = await this.invitationService.createInvitation(senderId, req.body);
      res.status(HTTP_STATUS.CREATED).json(invitation);
    });
  }

  getInvitations() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const invitations = await this.invitationService.getUserInvitations(userId);
      res.status(HTTP_STATUS.OK).json(invitations);
    });
  }

  respondToInvitation() {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { action } = req.body;
      const invitation = await this.invitationService.respondToInvitation(id, action);
      res.status(HTTP_STATUS.OK).json(invitation);
    });
  }
}

export default InvitationController;

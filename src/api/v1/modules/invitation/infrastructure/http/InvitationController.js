/**
 * Invitation Controller
 */
import { asyncHandler, HTTP_STATUS } from '@/core/http/index.js';
import { InvitationDTO } from '@/common/dto/index.js';

class InvitationController {
  constructor(invitationService, logger) {
    this.invitationService = invitationService;
    this.logger = logger.child({ context: 'InvitationController' });
  }

  createInvitation() {
    return asyncHandler(async (req, res) => {
      const senderId = req.session?.userId;
      const invitation = await this.invitationService.createInvitation(senderId, req.body);
      const safeInvitation = InvitationDTO.transform(invitation, { includeTimestamps: true });
      res.status(HTTP_STATUS.CREATED).json(safeInvitation);
    });
  }

  getInvitations() {
    return asyncHandler(async (req, res) => {
      const userId = req.session?.userId;
      const invitations = await this.invitationService.getUserInvitations(userId);
      const safeInvitations = InvitationDTO.transformMany(invitations);
      res.status(HTTP_STATUS.OK).json(safeInvitations);
    });
  }

  respondToInvitation() {
    return asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { action } = req.body;
      const invitation = await this.invitationService.respondToInvitation(id, action);
      const safeInvitation = InvitationDTO.transform(invitation, { includeTimestamps: true });
      res.status(HTTP_STATUS.OK).json(safeInvitation);
    });
  }
}

export default InvitationController;

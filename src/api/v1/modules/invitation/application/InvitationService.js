/**
 * Invitation Service - Business logic for invitations
 */
class InvitationService {
  constructor(invitationRepository, eventBus, logger) {
    this.invitationRepository = invitationRepository;
    this.eventBus = eventBus;
    this.logger = logger.child({ context: 'InvitationService' });
  }

  async createInvitation(senderId, data) {
    this.logger.info({ senderId, recipientId: data.recipientId }, 'Creating invitation');
    
    const invitation = await this.invitationRepository.create({ senderId, ...data });
    
    await this.eventBus.publish('invitation.created', {
      invitationId: invitation._id,
      recipientId: data.recipientId,
    });
    
    return invitation;
  }

  async getUserInvitations(userId) {
    this.logger.debug({ userId }, 'Fetching user invitations');
    return this.invitationRepository.findByRecipientId(userId);
  }

  async respondToInvitation(invitationId, action) {
    this.logger.info({ invitationId, action }, 'Responding to invitation');
    
    const status = action === 'accept' ? 'accepted' : 'declined';
    const invitation = await this.invitationRepository.update(invitationId, { status });
    
    await this.eventBus.publish('invitation.responded', { invitationId, action });
    
    return invitation;
  }
}

export default InvitationService;

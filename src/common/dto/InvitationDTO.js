/**
 * Invitation DTO (Data Transfer Object)
 * Transforms Invitation model data for safe client consumption
 */
import BaseDTO from './BaseDTO.js';

class InvitationDTO extends BaseDTO {
  static transformOne(invitation, options = {}) {
    if (!invitation) return null;

    const safe = {
      id: invitation._id?.toString(),
      senderId: invitation.senderId?.toString(),
      recipientId: invitation.recipientId?.toString(),
      type: invitation.type,
      relatedId: invitation.relatedId?.toString(),
      relatedType: invitation.relatedType,
      status: invitation.status,
      message: invitation.message,
      expiresAt: invitation.expiresAt,
      respondedAt: invitation.respondedAt,
    };

    if (options.includeTimestamps) {
      safe.createdAt = invitation.createdAt;
      safe.updatedAt = invitation.updatedAt;
    }

    return this.clean(safe);
  }
}

export default InvitationDTO;

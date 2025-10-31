/**
 * Invitation Repository
 */
import { InvitationModel } from '../model/invitation.model.js';

class InvitationRepository {
  constructor(logger) {
    this.logger = logger.child({ context: 'InvitationRepository' });
  }

  async create(data) {
    const invitation = new InvitationModel(data);
    await invitation.save();
    return invitation.toObject();
  }

  async findById(id) {
    return InvitationModel.findById(id).lean();
  }

  async findByRecipientId(recipientId) {
    return InvitationModel.find({ recipientId, status: 'pending' }).lean();
  }

  async update(id, data) {
    return InvitationModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async delete(id) {
    return InvitationModel.findByIdAndDelete(id);
  }
}

export default InvitationRepository;

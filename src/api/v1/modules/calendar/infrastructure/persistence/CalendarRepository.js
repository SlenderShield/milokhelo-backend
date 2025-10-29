/**
 * Calendar Repository
 */
import { EventModel } from './CalendarModel.js';

class CalendarRepository {
  constructor(logger) {
    this.logger = logger.child({ context: 'CalendarRepository' });
  }

  async create(data) {
    const event = new EventModel(data);
    await event.save();
    return event.toObject();
  }

  async findByUserId(userId) {
    return EventModel.find({ userId }).lean();
  }

  async findById(id) {
    return EventModel.findById(id).lean();
  }

  async update(id, data) {
    return EventModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async delete(id) {
    return EventModel.findByIdAndDelete(id);
  }
}

export default CalendarRepository;

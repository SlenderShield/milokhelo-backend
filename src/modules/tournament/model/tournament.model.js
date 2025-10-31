/**
 * Tournament Model
 */
import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    sport: { type: String, required: true },
    sportCategory: String,
    type: { type: String, enum: ['knockout', 'league'], required: true },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rules: String,
    registrationWindow: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    entryFee: Number,
    prizePool: String,
    minTeams: Number,
    maxTeams: Number,
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    status: {
      type: String,
      enum: ['registration', 'ongoing', 'completed', 'cancelled'],
      default: 'registration',
    },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],
    rounds: Number,
    currentRound: { type: Number, default: 0 },
    bracket: mongoose.Schema.Types.Mixed,
    chatRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
  },
  { timestamps: true }
);

const TournamentModel = mongoose.model('Tournament', tournamentSchema);
export default TournamentModel;

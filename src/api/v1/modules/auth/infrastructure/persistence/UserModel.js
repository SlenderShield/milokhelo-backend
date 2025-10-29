/**
 * User Model - Mongoose Schema
 * Represents users in the database
 */
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    password: {
      type: String,
      // Password is optional for OAuth users
    },
    phone: String,
    avatar: String,
    bio: String,
    roles: {
      type: [String],
      default: ['user'],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    privacy: {
      showPhone: { type: Boolean, default: false },
      showStats: { type: Boolean, default: true },
      showLocation: { type: Boolean, default: true },
    },
    sportsPreferences: [String],
    location: {
      city: String,
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
        },
        coordinates: [Number], // [longitude, latitude]
      },
    },
    // OAuth related fields
    oauthProviders: {
      google: {
        id: String,
        email: String,
      },
      facebook: {
        id: String,
        email: String,
      },
    },
    // Encrypted OAuth tokens (refresh tokens)
    oauthTokens: {
      type: Map,
      of: String,
      select: false, // Don't return by default
    },
    achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }],
    // Last login tracking
    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.oauthTokens;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ 'oauthProviders.google.id': 1 });
userSchema.index({ 'oauthProviders.facebook.id': 1 });
userSchema.index({ 'location.coordinates': '2dsphere' });

const UserModel = mongoose.model('User', userSchema);

export default UserModel;

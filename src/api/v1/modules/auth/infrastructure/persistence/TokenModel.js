/**
 * Token Models - Mongoose Schemas
 * Represents email verification and password reset tokens
 */
import mongoose from 'mongoose';

/**
 * Email Verification Token Schema
 */
const emailVerificationTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired tokens after 30 days
emailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 2592000 });

/**
 * Password Reset Token Schema
 */
const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired tokens after 7 days
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 604800 });

/**
 * Refresh Token Schema
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    revokedAt: {
      type: Date,
    },
    deviceInfo: {
      userAgent: String,
      ip: String,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired tokens after 30 days
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 2592000 });

export const EmailVerificationToken = mongoose.model(
  'EmailVerificationToken',
  emailVerificationTokenSchema
);
export const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

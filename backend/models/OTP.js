'use strict';

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, 'Phone number is required.'],
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true, // stored as bcrypt hash
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    },
    attempts: {
      type: Number,
      default: 0,
      max: [5, 'Maximum OTP verification attempts exceeded.'],
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index — MongoDB auto-deletes documents once expiresAt is past
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for quick lookup
otpSchema.index({ phone: 1, isUsed: 1 });

const OTP = mongoose.model('OTP', otpSchema);
module.exports = OTP;

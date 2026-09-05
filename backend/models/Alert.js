'use strict';

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    cattle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cattle',
      required: [true, 'Cattle reference is required.'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner reference is required.'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['HIGH_RISK', 'MEDIUM_RISK', 'RECOVERY', 'REMINDER'],
        message: '{VALUE} is not a valid alert type.',
      },
      required: [true, 'Alert type is required.'],
    },
    message: {
      type: String,
      required: [true, 'Alert message is required.'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters.'],
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    predictionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prediction',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
alertSchema.index({ owner: 1, createdAt: -1 });
alertSchema.index({ owner: 1, isRead: 1 });

const Alert = mongoose.model('Alert', alertSchema);
module.exports = Alert;

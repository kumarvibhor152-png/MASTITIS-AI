'use strict';

const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    cattle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cattle',
      required: [true, 'Cattle reference is required.'],
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner reference is required.'],
      index: true,
    },
    inputData: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Input data is required.'],
      comment: 'Raw form data submitted for this prediction',
    },
    riskLevel: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH'],
        message: '{VALUE} is not a valid risk level.',
      },
      required: [true, 'Risk level is required.'],
    },
    confidence: {
      type: Number,
      min: [0, 'Confidence cannot be less than 0.'],
      max: [1, 'Confidence cannot exceed 1.'],
      required: [true, 'Confidence score is required.'],
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: [2000, 'Explanation cannot exceed 2000 characters.'],
    },
    recommendedActions: {
      type: [String],
      default: [],
    },
    shapValues: {
      type: mongoose.Schema.Types.Mixed,
      comment: 'SHAP feature importance values from AI model',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for paginated queries and analytics
predictionSchema.index({ owner: 1, createdAt: -1 });
predictionSchema.index({ cattle: 1, createdAt: -1 });
predictionSchema.index({ riskLevel: 1 });

const Prediction = mongoose.model('Prediction', predictionSchema);
module.exports = Prediction;

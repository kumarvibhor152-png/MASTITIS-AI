'use strict';

const mongoose = require('mongoose');

const cattleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required.'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Cattle name is required.'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters.'],
    },
    tagNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Tag number cannot exceed 50 characters.'],
    },
    breed: {
      type: String,
      trim: true,
      enum: {
        values: ['Gir', 'HF', 'Jersey', 'Sahiwal', 'Tharparkar', 'Rathi', 'Kankrej', 'Red Sindhi', 'Crossbred', 'Other'],
        message: '{VALUE} is not a recognized breed.',
      },
      default: 'Crossbred',
    },
    age: {
      type: Number,
      min: [0, 'Age cannot be negative.'],
      comment: 'Age in months',
    },
    sex: {
      type: String,
      enum: {
        values: ['cow', 'heifer'],
        message: '{VALUE} is not valid. Must be cow or heifer.',
      },
      required: [true, 'Sex is required.'],
      default: 'cow',
    },
    lactationStage: {
      type: Number,
      min: [0, 'Lactation stage cannot be negative.'],
      comment: 'Days in milk (DIM)',
    },
    milkYield: {
      type: Number,
      min: [0, 'Milk yield cannot be negative.'],
      comment: 'Liters per day',
    },
    lastCalvingDate: {
      type: Date,
    },
    previousMastitis: {
      type: Number,
      default: 0,
      min: [0, 'Previous mastitis count cannot be negative.'],
      comment: 'Number of previous mastitis episodes',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters.'],
    },
    currentRiskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
    lastPredictionAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: days in milk derived from last calving date if lactationStage not set
cattleSchema.virtual('computedDIM').get(function () {
  if (this.lactationStage != null) return this.lactationStage;
  if (this.lastCalvingDate) {
    const diffMs = Date.now() - new Date(this.lastCalvingDate).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Compound index for quick owner queries
cattleSchema.index({ owner: 1, createdAt: -1 });

const Cattle = mongoose.model('Cattle', cattleSchema);
module.exports = Cattle;

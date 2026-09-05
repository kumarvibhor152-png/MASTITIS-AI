'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, 'Phone number is required.'],
      unique: true,
      trim: true,
      match: [/^\d{10}$/, 'Phone number must be exactly 10 digits.'],
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters.'],
    },
    farmName: {
      type: String,
      trim: true,
      maxlength: [150, 'Farm name cannot exceed 150 characters.'],
    },
    village: {
      type: String,
      trim: true,
      maxlength: [100, 'Village cannot exceed 100 characters.'],
    },
    district: {
      type: String,
      trim: true,
      maxlength: [100, 'District cannot exceed 100 characters.'],
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters.'],
    },
    herdSize: {
      type: Number,
      min: [0, 'Herd size cannot be negative.'],
      default: 0,
    },
    language: {
      type: String,
      enum: ['hi', 'en', 'mr', 'gu', 'pa', 'bn', 'te', 'ta', 'kn', 'ml'],
      default: 'hi',
    },
    emergencyVet: {
      type: String,
      trim: true,
      maxlength: [15, 'Emergency vet contact cannot exceed 15 characters.'],
    },
    isVerified: {
      type: Boolean,
      default: true, // verified upon OTP success
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: full location string
userSchema.virtual('location').get(function () {
  return [this.village, this.district, this.state].filter(Boolean).join(', ');
});

// Index for faster queries
userSchema.index({ phone: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;

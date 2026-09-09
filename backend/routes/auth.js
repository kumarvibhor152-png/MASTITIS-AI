'use strict';

const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { generateOTP, sendOTP, storeOTP, verifyOTP } = require('../services/otpService');
const User = require('../models/User');

const router = express.Router();

// ─── Per-route Rate Limiters ──────────────────────────────────────────────────

/** Limit OTP send requests: 3 per 10 minutes per IP */
const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.body.phone || req.ip,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait 10 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Limit OTP verify requests: 10 per 15 minutes per IP */
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many verification attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── Validation Schemas ───────────────────────────────────────────────────────

const phoneValidation = body('phone')
  .trim()
  .notEmpty()
  .withMessage('Phone number is required.')
  .matches(/^\d{10}$/)
  .withMessage('Phone must be exactly 10 digits.');

const otpValidation = body('otp')
  .trim()
  .notEmpty()
  .withMessage('OTP is required.')
  .matches(/^\d{6}$/)
  .withMessage('OTP must be exactly 6 digits.');

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/send-otp
 * Generate and send a 6-digit OTP to the provided phone number.
 */
router.post(
  '/send-otp',
  otpSendLimiter,
  validate([phoneValidation]),
  async (req, res, next) => {
    try {
      const { phone } = req.body;

      const otp = generateOTP();
      await storeOTP(phone, otp);
      const result = await sendOTP(phone, otp);

      if (!result.success) {
        return errorResponse(res, result.message, 502);
      }

      return successResponse(res, null, 'OTP sent successfully.');
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/verify-otp
 * Verify OTP, create user if first-time, and return a JWT.
 */
router.post(
  '/verify-otp',
  otpVerifyLimiter,
  validate([phoneValidation, otpValidation]),
  async (req, res, next) => {
    try {
      const { phone, otp } = req.body;

      const verification = await verifyOTP(phone, otp);
      if (!verification.valid) {
        return errorResponse(res, verification.message, 400);
      }

      // Find or create user
      let user = await User.findOne({ phone });
      const isNewUser = !user;

      if (isNewUser) {
        user = await User.create({ phone, isVerified: true });
      }

      const token = signToken(user._id);

      return successResponse(
        res,
        {
          token,
          user: {
            id: user._id,
            phone: user.phone,
            name: user.name,
            farmName: user.farmName,
            village: user.village,
            district: user.district,
            state: user.state,
            herdSize: user.herdSize,
            language: user.language,
            isVerified: user.isVerified,
          },
          isNewUser,
        },
        isNewUser ? 'Account created. Welcome to LactoGuard!' : 'Login successful. Welcome back!'
      );
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/auth/me
 * Return the currently authenticated user's profile.
 */
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');
    return successResponse(res, { user }, 'Profile fetched successfully.');
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/auth/profile
 * Update the authenticated user's profile.
 */
router.put(
  '/profile',
  protect,
  validate([
    body('name').optional().trim().isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters.'),
    body('farmName').optional().trim().isLength({ max: 150 }).withMessage('Farm name cannot exceed 150 characters.'),
    body('village').optional().trim().isLength({ max: 100 }).withMessage('Village cannot exceed 100 characters.'),
    body('district').optional().trim().isLength({ max: 100 }).withMessage('District cannot exceed 100 characters.'),
    body('state').optional().trim().isLength({ max: 100 }).withMessage('State cannot exceed 100 characters.'),
    body('herdSize').optional().isInt({ min: 0 }).withMessage('Herd size must be a non-negative integer.'),
    body('language')
      .optional()
      .isIn(['hi', 'en', 'mr', 'gu', 'pa', 'bn', 'te', 'ta', 'kn', 'ml'])
      .withMessage('Invalid language code.'),
    body('emergencyVet')
      .optional()
      .trim()
      .isLength({ max: 15 })
      .withMessage('Emergency vet contact cannot exceed 15 characters.'),
  ]),
  async (req, res, next) => {
    try {
      const allowedFields = ['name', 'farmName', 'village', 'district', 'state', 'herdSize', 'language', 'emergencyVet'];
      const updates = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      const user = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true,
        select: '-__v',
      });

      return successResponse(res, { user }, 'Profile updated successfully.');
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

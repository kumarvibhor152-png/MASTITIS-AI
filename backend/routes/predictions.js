'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const mongoose = require('mongoose');
const axios = require('axios');

const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const Prediction = require('../models/Prediction');
const Cattle = require('../models/Cattle');
const Alert = require('../models/Alert');

const router = express.Router();
router.use(protect);

// ─── Validation ───────────────────────────────────────────────────────────────

const mongoIdParam = (paramName) =>
  param(paramName)
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage(`${paramName} must be a valid ID.`);

const predictionValidation = [
  body('cattleId')
    .notEmpty().withMessage('cattleId is required.')
    .custom((val) => mongoose.Types.ObjectId.isValid(val)).withMessage('cattleId must be a valid ID.'),
  body('milkYield').notEmpty().isFloat({ min: 0 }).withMessage('milkYield must be >= 0.'),
  body('lactationStage').notEmpty().isInt({ min: 0 }).withMessage('lactationStage must be >= 0.'),
  body('previousMastitis').optional().isInt({ min: 0 }).withMessage('previousMastitis must be >= 0.'),
  body('sccValue').optional().isFloat({ min: 0 }).withMessage('sccValue must be >= 0.'),
  body('bodyTemperature').optional().isFloat({ min: 30, max: 45 }).withMessage('bodyTemperature must be between 30–45 °C.'),
  body('udderEdema').optional().isBoolean().withMessage('udderEdema must be a boolean.'),
  body('teat1Score').optional().isInt({ min: 0, max: 5 }),
  body('teat2Score').optional().isInt({ min: 0, max: 5 }),
  body('teat3Score').optional().isInt({ min: 0, max: 5 }),
  body('teat4Score').optional().isInt({ min: 0, max: 5 }),
];

// ─── Helper: build alert message ──────────────────────────────────────────────

const buildAlertMessage = (riskLevel, cattleName) => {
  if (riskLevel === 'HIGH') {
    return `⚠️ HIGH mastitis risk detected for ${cattleName}. Immediate veterinary attention recommended.`;
  }
  if (riskLevel === 'MEDIUM') {
    return `🔶 MEDIUM mastitis risk detected for ${cattleName}. Monitor closely and consider a vet visit.`;
  }
  return null;
};

// ─── POST /api/predictions ────────────────────────────────────────────────────
/**
 * Create a new prediction by forwarding input to the AI service.
 */
router.post('/', validate(predictionValidation), async (req, res, next) => {
  try {
    const { cattleId, ...inputFields } = req.body;

    // Verify cattle ownership
    const cattle = await Cattle.findOne({ _id: cattleId, owner: req.user._id });
    if (!cattle) {
      return errorResponse(res, 'Cattle not found or does not belong to you.', 404);
    }

    // Build input payload for AI service
    const inputData = {
      breed: cattle.breed,
      age: cattle.age,
      sex: cattle.sex,
      milkYield: inputFields.milkYield ?? cattle.milkYield,
      lactationStage: inputFields.lactationStage ?? cattle.lactationStage,
      previousMastitis: inputFields.previousMastitis ?? cattle.previousMastitis ?? 0,
      ...inputFields,
    };

    // ── Call AI Service ────────────────────────────────────────────────────────
    let aiResult;
    try {
      const aiResponse = await axios.post(
        `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/predict`,
        inputData,
        { timeout: 15000, headers: { 'Content-Type': 'application/json' } }
      );
      aiResult = aiResponse.data;
    } catch (aiErr) {
      // In development, return a mock result if AI service is unavailable
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  AI service unavailable. Using mock prediction result.');
        const mock = ['LOW', 'MEDIUM', 'HIGH'];
        const riskLevel = mock[Math.floor(Math.random() * mock.length)];
        aiResult = {
          riskLevel,
          confidence: parseFloat((0.5 + Math.random() * 0.49).toFixed(4)),
          explanation: `Mock prediction: ${riskLevel} risk based on input data.`,
          recommendedActions: riskLevel === 'HIGH'
            ? ['Contact veterinarian immediately', 'Segregate the animal', 'Conduct SCC test']
            : riskLevel === 'MEDIUM'
            ? ['Monitor milk yield daily', 'Check for udder inflammation', 'Improve hygiene']
            : ['Continue routine monitoring', 'Maintain hygiene protocols'],
          shapValues: {},
        };
      } else {
        console.error('AI service error:', aiErr.message);
        return errorResponse(res, 'AI prediction service is currently unavailable. Please try again later.', 503);
      }
    }

    const { riskLevel, confidence, explanation, recommendedActions, shapValues } = aiResult;

    // ── Save Prediction ────────────────────────────────────────────────────────
    const prediction = await Prediction.create({
      cattle: cattle._id,
      owner: req.user._id,
      inputData,
      riskLevel,
      confidence,
      explanation,
      recommendedActions: recommendedActions || [],
      shapValues: shapValues || {},
    });

    // ── Update Cattle Risk Level ───────────────────────────────────────────────
    await Cattle.findByIdAndUpdate(cattle._id, {
      currentRiskLevel: riskLevel,
      lastPredictionAt: new Date(),
    });

    // ── Create Alert if Needed ────────────────────────────────────────────────
    if (riskLevel === 'HIGH' || riskLevel === 'MEDIUM') {
      const alertMessage = buildAlertMessage(riskLevel, cattle.name);
      await Alert.create({
        cattle: cattle._id,
        owner: req.user._id,
        type: riskLevel === 'HIGH' ? 'HIGH_RISK' : 'MEDIUM_RISK',
        message: alertMessage,
        predictionId: prediction._id,
        isRead: false,
      });
    }

    return successResponse(res, { prediction }, 'Prediction created successfully.', 201);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/predictions ─────────────────────────────────────────────────────
/**
 * Paginated list of all predictions for the authenticated user.
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const filter = { owner: req.user._id };
    if (req.query.cattleId && mongoose.Types.ObjectId.isValid(req.query.cattleId)) {
      filter.cattle = req.query.cattleId;
    }
    if (req.query.riskLevel && ['LOW', 'MEDIUM', 'HIGH'].includes(req.query.riskLevel)) {
      filter.riskLevel = req.query.riskLevel;
    }

    const [predictions, total] = await Promise.all([
      Prediction.find(filter)
        .populate('cattle', 'name tagNumber breed')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Prediction.countDocuments(filter),
    ]);

    return successResponse(
      res,
      { predictions, pagination: { total, page, limit, pages: Math.ceil(total / limit) } },
      'Predictions fetched successfully.'
    );
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/predictions/stats ───────────────────────────────────────────────
/**
 * Aggregated statistics for the analytics dashboard.
 * NOTE: Must be defined BEFORE /:id to avoid route conflict.
 */
router.get('/stats', async (req, res, next) => {
  try {
    const ownerId = req.user._id;

    const [riskBreakdown, totalPredictions, recentTrend, cattleAtRisk] = await Promise.all([
      // Risk level distribution
      Prediction.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
      ]),

      // Total predictions
      Prediction.countDocuments({ owner: ownerId }),

      // Last 30 days daily counts
      Prediction.aggregate([
        {
          $match: {
            owner: ownerId,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            highRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'HIGH'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Cattle currently at high/medium risk
      Cattle.countDocuments({ owner: ownerId, currentRiskLevel: { $in: ['HIGH', 'MEDIUM'] } }),
    ]);

    // Normalize risk breakdown into a map
    const riskMap = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    riskBreakdown.forEach(({ _id, count }) => {
      if (_id) riskMap[_id] = count;
    });

    return successResponse(
      res,
      {
        totalPredictions,
        riskBreakdown: riskMap,
        cattleAtRisk,
        recentTrend,
      },
      'Stats fetched successfully.'
    );
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/predictions/:id ─────────────────────────────────────────────────
router.get('/:id', validate([mongoIdParam('id')]), async (req, res, next) => {
  try {
    const prediction = await Prediction.findOne({ _id: req.params.id, owner: req.user._id })
      .populate('cattle', 'name tagNumber breed age sex')
      .lean();

    if (!prediction) {
      return errorResponse(res, 'Prediction not found.', 404);
    }

    return successResponse(res, { prediction }, 'Prediction fetched successfully.');
  } catch (err) {
    next(err);
  }
});

module.exports = router;

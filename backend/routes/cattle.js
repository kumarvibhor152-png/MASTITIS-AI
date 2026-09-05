'use strict';

const express = require('express');
const { body, param } = require('express-validator');
const mongoose = require('mongoose');

const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const Cattle = require('../models/Cattle');
const Prediction = require('../models/Prediction');

const router = express.Router();

// All cattle routes are protected
router.use(protect);

// ─── Validation Schemas ───────────────────────────────────────────────────────

const mongoIdParam = (paramName) =>
  param(paramName)
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage(`${paramName} must be a valid ID.`);

const cattleBodyValidation = [
  body('name').trim().notEmpty().withMessage('Cattle name is required.').isLength({ max: 100 }),
  body('tagNumber').optional().trim().isLength({ max: 50 }),
  body('breed')
    .optional()
    .isIn(['Gir', 'HF', 'Jersey', 'Sahiwal', 'Tharparkar', 'Rathi', 'Kankrej', 'Red Sindhi', 'Crossbred', 'Other'])
    .withMessage('Invalid breed.'),
  body('age').optional().isInt({ min: 0 }).withMessage('Age must be a non-negative integer (months).'),
  body('sex').optional().isIn(['cow', 'heifer']).withMessage('Sex must be cow or heifer.'),
  body('lactationStage').optional().isInt({ min: 0 }).withMessage('Lactation stage must be >= 0.'),
  body('milkYield').optional().isFloat({ min: 0 }).withMessage('Milk yield must be >= 0.'),
  body('lastCalvingDate').optional().isISO8601().withMessage('Invalid date format for lastCalvingDate.'),
  body('previousMastitis').optional().isInt({ min: 0 }).withMessage('Previous mastitis count must be >= 0.'),
  body('notes').optional().trim().isLength({ max: 1000 }),
];

// ─── GET /api/cattle ──────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const cattle = await Cattle.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, { cattle, count: cattle.length }, 'Cattle fetched successfully.');
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/cattle ─────────────────────────────────────────────────────────
router.post('/', validate(cattleBodyValidation), async (req, res, next) => {
  try {
    const {
      name, tagNumber, breed, age, sex, lactationStage,
      milkYield, lastCalvingDate, previousMastitis, notes,
    } = req.body;

    const cattle = await Cattle.create({
      owner: req.user._id,
      name,
      tagNumber,
      breed,
      age,
      sex,
      lactationStage,
      milkYield,
      lastCalvingDate,
      previousMastitis,
      notes,
    });

    return successResponse(res, { cattle }, 'Cattle added successfully.', 201);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/cattle/:id ──────────────────────────────────────────────────────
router.get('/:id', validate([mongoIdParam('id')]), async (req, res, next) => {
  try {
    const cattle = await Cattle.findOne({ _id: req.params.id, owner: req.user._id }).lean();

    if (!cattle) {
      return errorResponse(res, 'Cattle not found.', 404);
    }

    // Fetch last 5 predictions for this cattle
    const recentPredictions = await Prediction.find({ cattle: cattle._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return successResponse(res, { cattle, recentPredictions }, 'Cattle details fetched.');
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/cattle/:id ──────────────────────────────────────────────────────
router.put('/:id', validate([mongoIdParam('id'), ...cattleBodyValidation]), async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'tagNumber', 'breed', 'age', 'sex', 'lactationStage',
      'milkYield', 'lastCalvingDate', 'previousMastitis', 'notes',
    ];

    const updates = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const cattle = await Cattle.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!cattle) {
      return errorResponse(res, 'Cattle not found.', 404);
    }

    return successResponse(res, { cattle }, 'Cattle updated successfully.');
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/cattle/:id ───────────────────────────────────────────────────
router.delete('/:id', validate([mongoIdParam('id')]), async (req, res, next) => {
  try {
    const cattle = await Cattle.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

    if (!cattle) {
      return errorResponse(res, 'Cattle not found.', 404);
    }

    // Optionally cascade delete predictions and alerts
    await Prediction.deleteMany({ cattle: cattle._id });
    const Alert = require('../models/Alert');
    await Alert.deleteMany({ cattle: cattle._id });

    return successResponse(res, null, 'Cattle deleted successfully.');
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/cattle/:id/predictions ─────────────────────────────────────────
router.get('/:id/predictions', validate([mongoIdParam('id')]), async (req, res, next) => {
  try {
    // Verify ownership
    const cattle = await Cattle.findOne({ _id: req.params.id, owner: req.user._id }).lean();
    if (!cattle) {
      return errorResponse(res, 'Cattle not found.', 404);
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [predictions, total] = await Promise.all([
      Prediction.find({ cattle: req.params.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Prediction.countDocuments({ cattle: req.params.id }),
    ]);

    return successResponse(
      res,
      {
        predictions,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      },
      'Prediction history fetched.'
    );
  } catch (err) {
    next(err);
  }
});

module.exports = router;

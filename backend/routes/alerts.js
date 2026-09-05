'use strict';

const express = require('express');
const { param } = require('express-validator');
const mongoose = require('mongoose');

const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const Alert = require('../models/Alert');

const router = express.Router();
router.use(protect);

// ─── Validation ───────────────────────────────────────────────────────────────

const mongoIdParam = (paramName) =>
  param(paramName)
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage(`${paramName} must be a valid ID.`);

// ─── GET /api/alerts/unread-count ────────────────────────────────────────────
/**
 * Must be declared before /:id to avoid Express treating 'unread-count' as an ID.
 */
router.get('/unread-count', async (req, res, next) => {
  try {
    const count = await Alert.countDocuments({ owner: req.user._id, isRead: false });
    return successResponse(res, { unreadCount: count }, 'Unread count fetched.');
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/alerts ──────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = { owner: req.user._id };
    if (req.query.isRead !== undefined) {
      filter.isRead = req.query.isRead === 'true';
    }
    if (req.query.type && ['HIGH_RISK', 'MEDIUM_RISK', 'RECOVERY', 'REMINDER'].includes(req.query.type)) {
      filter.type = req.query.type;
    }

    const [alerts, total] = await Promise.all([
      Alert.find(filter)
        .populate('cattle', 'name tagNumber')
        .populate('predictionId', 'riskLevel confidence')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Alert.countDocuments(filter),
    ]);

    return successResponse(
      res,
      { alerts, pagination: { total, page, limit, pages: Math.ceil(total / limit) } },
      'Alerts fetched successfully.'
    );
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/alerts/read-all ─────────────────────────────────────────────────
/**
 * Must be declared before /:id to avoid Express matching 'read-all' as an ID.
 */
router.put('/read-all', async (req, res, next) => {
  try {
    const result = await Alert.updateMany(
      { owner: req.user._id, isRead: false },
      { isRead: true }
    );

    return successResponse(
      res,
      { modifiedCount: result.modifiedCount },
      `${result.modifiedCount} alert(s) marked as read.`
    );
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/alerts/:id/read ─────────────────────────────────────────────────
router.put('/:id/read', validate([mongoIdParam('id')]), async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!alert) {
      return errorResponse(res, 'Alert not found.', 404);
    }

    return successResponse(res, { alert }, 'Alert marked as read.');
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/alerts/:id ───────────────────────────────────────────────────
router.delete('/:id', validate([mongoIdParam('id')]), async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

    if (!alert) {
      return errorResponse(res, 'Alert not found.', 404);
    }

    return successResponse(res, null, 'Alert deleted successfully.');
  } catch (err) {
    next(err);
  }
});

module.exports = router;

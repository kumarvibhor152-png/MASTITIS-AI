'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/responseHelper');

/**
 * JWT authentication middleware.
 * Extracts Bearer token from Authorization header, verifies it,
 * fetches the user from DB, and attaches it to req.user.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'No token provided. Access denied.', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return errorResponse(res, 'Malformed token. Access denied.', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user from DB (catches deleted/suspended accounts)
    const user = await User.findById(decoded.id).select('-__v');

    if (!user) {
      return errorResponse(res, 'User associated with this token no longer exists.', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Session expired. Please log in again.', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token. Access denied.', 401);
    }
    next(err);
  }
};

module.exports = { protect };

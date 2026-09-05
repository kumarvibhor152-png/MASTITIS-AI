'use strict';

const { validationResult } = require('express-validator');

/**
 * Middleware factory that runs a list of express-validator chains
 * and sends a 422 response if any validation fails.
 *
 * Usage:
 *   router.post('/route', validate([body('field').notEmpty()]), handler);
 *
 * @param {import('express-validator').ValidationChain[]} validations
 * @returns {import('express').RequestHandler[]}
 */
const validate = (validations) => {
  return [
    // Run all validation chains in parallel
    async (req, res, next) => {
      await Promise.all(validations.map((v) => v.run(req)));
      next();
    },
    // Inspect results and short-circuit on failure
    (req, res, next) => {
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }
      const formattedErrors = errors.array().map((e) => ({
        field: e.path || e.param,
        message: e.msg,
      }));
      return res.status(422).json({
        success: false,
        message: 'Validation failed.',
        errors: formattedErrors,
      });
    },
  ];
};

module.exports = { validate };

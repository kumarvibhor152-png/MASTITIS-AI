'use strict';

/**
 * Send a standardized success response.
 *
 * @param {import('express').Response} res - Express response object
 * @param {*} data - Payload to include in the response
 * @param {string} [message='Success'] - Human-readable message
 * @param {number} [statusCode=200] - HTTP status code
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  const payload = { success: true, message };
  if (data !== null && data !== undefined) {
    payload.data = data;
  }
  return res.status(statusCode).json(payload);
};

/**
 * Send a standardized error response.
 *
 * @param {import('express').Response} res - Express response object
 * @param {string} [message='An error occurred'] - Human-readable error message
 * @param {number} [statusCode=500] - HTTP status code
 * @param {*} [errors=null] - Optional detailed error info
 */
const errorResponse = (res, message = 'An error occurred.', statusCode = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
};

module.exports = { successResponse, errorResponse };

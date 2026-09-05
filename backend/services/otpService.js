'use strict';

const bcrypt = require('bcryptjs');
const axios = require('axios');
const OTP = require('../models/OTP');

const BCRYPT_ROUNDS = 10;
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;

/**
 * Generate a cryptographically-random 6-digit OTP string.
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  // Generates a number between 100000 and 999999
  return String(Math.floor(100000 + Math.random() * 900000));
};

/**
 * Send OTP via MSG91 API.
 * Falls back gracefully in development mode (logs OTP to console).
 *
 * @param {string} phone - 10-digit Indian mobile number
 * @param {string} otp   - Plain-text OTP to send
 * @returns {Promise<{ success: boolean, message: string }>}
 */
const sendOTP = async (phone, otp) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  // Development bypass: log OTP to console instead of calling MSG91
  if (!authKey || authKey === 'your_msg91_auth_key' || process.env.NODE_ENV === 'development') {
    console.log(`\n📱  [DEV] OTP for ${phone}: ${otp}\n`);
    return { success: true, message: 'OTP logged to console (dev mode).' };
  }

  try {
    const response = await axios.post(
      'https://api.msg91.com/api/v5/otp',
      {
        template_id: templateId,
        mobile: `91${phone}`,
        otp,
      },
      {
        headers: {
          authkey: authKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    if (response.data && response.data.type === 'success') {
      return { success: true, message: 'OTP sent successfully.' };
    }

    console.error('MSG91 non-success response:', response.data);
    return { success: false, message: 'Failed to send OTP via SMS provider.' };
  } catch (err) {
    console.error('MSG91 API error:', err.response?.data || err.message);
    return { success: false, message: 'SMS service unavailable. Please try again.' };
  }
};

/**
 * Hash an OTP and store it in the DB, invalidating all previous OTPs for the phone.
 *
 * @param {string} phone     - 10-digit mobile number
 * @param {string} plainOTP  - Plain-text OTP
 * @returns {Promise<import('../models/OTP').default>}
 */
const storeOTP = async (phone, plainOTP) => {
  // Invalidate any existing unused OTPs for this phone
  await OTP.deleteMany({ phone, isUsed: false });

  const hashed = await bcrypt.hash(plainOTP, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const otpDoc = await OTP.create({
    phone,
    otp: hashed,
    expiresAt,
    attempts: 0,
    isUsed: false,
  });

  return otpDoc;
};

/**
 * Verify a submitted OTP against the stored hash.
 *
 * @param {string} phone    - 10-digit mobile number
 * @param {string} plainOTP - User-submitted plain-text OTP
 * @returns {Promise<{ valid: boolean, message: string }>}
 */
const verifyOTP = async (phone, plainOTP) => {
  const otpDoc = await OTP.findOne({
    phone,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otpDoc) {
    return { valid: false, message: 'OTP expired or not found. Please request a new OTP.' };
  }

  if (otpDoc.attempts >= MAX_ATTEMPTS) {
    await otpDoc.deleteOne();
    return { valid: false, message: 'Maximum verification attempts exceeded. Please request a new OTP.' };
  }

  const isMatch = await bcrypt.compare(plainOTP, otpDoc.otp);

  if (!isMatch) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    const remaining = MAX_ATTEMPTS - otpDoc.attempts;
    return {
      valid: false,
      message: `Incorrect OTP. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'No attempts remaining.'}`,
    };
  }

  // Mark OTP as used
  otpDoc.isUsed = true;
  await otpDoc.save();

  return { valid: true, message: 'OTP verified successfully.' };
};

module.exports = { generateOTP, sendOTP, storeOTP, verifyOTP };

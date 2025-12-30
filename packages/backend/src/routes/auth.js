import express from 'express';
import { body, validationResult } from 'express-validator';
import { dbPromise } from '../config/database.js';
import mellipayamakService from '../services/mellipayamak.js';
import crypto from 'crypto';

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

/**
 * POST /auth/send-otp
 * Send OTP to phone number
 * 
 * TODO: Add rate limiting to prevent abuse (e.g., express-rate-limit)
 */
router.post('/send-otp', [
  body('phone')
    .trim()
    .matches(/^09\d{9}$/)
    .withMessage('Invalid Iranian phone number format')
], validate, async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone number
    if (!mellipayamakService.validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: 'شماره موبایل معتبر نیست'
      });
    }

    // Generate OTP and session ID
    const otp = mellipayamakService.generateOTP();
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store OTP session in database
    await dbPromise.query(
      `INSERT INTO otp_sessions (phone, otp_code, session_id, expires_at) 
       VALUES (?, ?, ?, ?)`,
      [phone, otp, sessionId, expiresAt]
    );

    // Send OTP via Mellipayamak
    try {
      await mellipayamakService.sendOTP(phone, otp);
      
      console.log(`📱 OTP sent to ${phone} (session: ${sessionId})`);
      
      res.json({
        success: true,
        session: sessionId,
        message: 'کد تایید با موفقیت ارسال شد'
      });
    } catch (smsError) {
      // If SMS sending fails, clean up the session
      await dbPromise.query(
        'DELETE FROM otp_sessions WHERE session_id = ?',
        [sessionId]
      );
      
      console.error('Failed to send OTP via SMS:', smsError);
      
      res.status(500).json({
        success: false,
        message: 'خطا در ارسال پیامک. لطفاً دوباره تلاش کنید'
      });
    }
  } catch (error) {
    console.error('Error in send-otp:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور. لطفاً دوباره تلاش کنید'
    });
  }
});

/**
 * POST /auth/verify-otp
 * Verify OTP and authenticate user
 * 
 * TODO: Add rate limiting to prevent brute force attacks
 */
router.post('/verify-otp', [
  body('phone')
    .trim()
    .matches(/^09\d{9}$/)
    .withMessage('Invalid Iranian phone number format'),
  body('otp')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('OTP must be 6 digits')
], validate, async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Find valid OTP session
    const [sessions] = await dbPromise.query(
      `SELECT * FROM otp_sessions 
       WHERE phone = ? AND otp_code = ? AND verified = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone, otp]
    );

    if (sessions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'کد تایید نامعتبر یا منقضی شده است'
      });
    }

    const session = sessions[0];

    // Mark session as verified
    await dbPromise.query(
      'UPDATE otp_sessions SET verified = TRUE WHERE id = ?',
      [session.id]
    );

    // Check if user exists
    const [users] = await dbPromise.query(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );

    if (users.length > 0) {
      // Existing user - sign in
      const user = users[0];
      
      // Generate auth token (simple token for now, should use JWT in production)
      const token = crypto.randomBytes(32).toString('hex');

      console.log(`✅ User signed in: ${phone}`);

      res.json({
        success: true,
        token: token,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          birthday: user.birthday,
          gender: user.gender,
          educationLevel: user.education_level,
          fieldOfStudy: user.field_of_study,
          color: user.color,
          playerId: user.player_id,
          profilePicture: user.profile_picture
        },
        message: 'ورود با موفقیت انجام شد'
      });
    } else {
      // New user - OTP verified but user needs to complete registration
      // For now, return success so frontend can proceed with registration
      console.log(`✅ OTP verified for new user: ${phone}`);

      res.json({
        success: true,
        message: 'کد تایید با موفقیت تایید شد',
        newUser: true
      });
    }
  } catch (error) {
    console.error('Error in verify-otp:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور. لطفاً دوباره تلاش کنید'
    });
  }
});

/**
 * POST /auth/register
 * Register a new user
 * 
 * TODO: Add rate limiting to prevent abuse
 * TODO: Add OTP verification check before allowing registration
 */
router.post('/register', [
  body('phone')
    .trim()
    .matches(/^09\d{9}$/)
    .withMessage('Invalid Iranian phone number format'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('birthday').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('educationLevel').optional().trim(),
  body('fieldOfStudy').optional().trim(),
  body('color').optional().trim(),
  body('profilePicture').optional()
], validate, async (req, res) => {
  try {
    const {
      phone,
      name,
      birthday,
      gender,
      educationLevel,
      fieldOfStudy,
      color,
      profilePicture
    } = req.body;

    // Check if user already exists
    const [existingUsers] = await dbPromise.query(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'این شماره قبلاً ثبت شده است'
      });
    }

    // Generate unique player ID
    const playerId = `INF-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // Create user
    await dbPromise.query(
      `INSERT INTO users (
        phone, name, birthday, gender, education_level, 
        field_of_study, color, profile_picture, player_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        phone,
        name,
        birthday || null,
        gender || null,
        educationLevel || null,
        fieldOfStudy || null,
        color || null,
        profilePicture || null,
        playerId
      ]
    );

    // Generate auth token
    const token = crypto.randomBytes(32).toString('hex');

    console.log(`✅ New user registered: ${phone} (${playerId})`);

    res.json({
      success: true,
      token: token,
      user: {
        phone,
        name,
        birthday,
        gender,
        educationLevel,
        fieldOfStudy,
        color,
        playerId,
        profilePicture
      },
      message: 'ثبت نام با موفقیت انجام شد'
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور. لطفاً دوباره تلاش کنید'
    });
  }
});

export default router;

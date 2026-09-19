import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Generate secure JSON Web Token with Role and Region claims
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id ? user._id.toString() : user.id,
      name: user.name,
      badgeId: user.badgeId,
      role: user.role,
      region: user.region,
    },
    process.env.JWT_SECRET || 'trinetra_enterprise_super_secret_jwt_key_2026_metrology_secure',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

/**
 * @desc    Register a new Officer or Admin user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, badgeId, username, password, role, region } = req.body;

    // Accept either badgeId or username for client flexibility
    const rawBadgeId = badgeId || username;

    // Required fields check
    if (!name || !rawBadgeId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, badgeId, and password',
      });
    }

    const cleanName = String(name).trim();
    const cleanBadgeId = String(rawBadgeId).trim().toUpperCase();
    const cleanPassword = String(password).trim();

    // Enforce minimum password length matching Mongoose schema
    if (cleanPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if user already exists in MongoDB
    const userExists = await User.findOne({ badgeId: cleanBadgeId });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: `An account with Badge ID '${cleanBadgeId}' is already registered`,
      });
    }

    // Create user (password is automatically hashed via pre-save hook in User model)
    const user = await User.create({
      name: cleanName,
      badgeId: cleanBadgeId,
      password: cleanPassword,
      role: role === 'Admin' ? 'Admin' : 'Field Officer',
      region: region ? String(region).trim() : 'Gujarat',
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully in National Metrology Database',
      token,
      user: {
        id: user._id,
        name: user.name,
        badgeId: user.badgeId,
        role: user.role,
        region: user.region,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map((val) => val.message)
        .join(', ');
      return res.status(400).json({
        success: false,
        message: messages || 'Registration validation failed',
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this Badge ID or Username already exists',
      });
    }
    next(error);
  }
};

/**
 * @desc    Authenticate user & return JWT token with Role and Region
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { badgeId, username, password } = req.body;

    // Accept either badgeId or username field for client flexibility
    const identifier = String(badgeId || username || '').trim().toUpperCase();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both Badge ID / Username and Password',
      });
    }

    // Look up user in database
    const user = await User.findOne({ badgeId: identifier });

    // Developer / testing bootstrap fallback if user is admin and DB was just created
    if (!user && (identifier === 'ADMIN' || identifier === 'ADMINISTRATOR') && password === 'admin123') {
      const defaultAdmin = await User.create({
        name: 'National Metrology Director',
        badgeId: 'ADMIN',
        password: 'admin123',
        role: 'Admin',
        region: 'National HQ (New Delhi)',
      });

      const token = generateToken(defaultAdmin);
      return res.status(200).json({
        success: true,
        message: 'Default admin account bootstrapped successfully',
        token,
        user: {
          id: defaultAdmin._id,
          name: defaultAdmin.name,
          badgeId: defaultAdmin.badgeId,
          role: defaultAdmin.role,
          region: defaultAdmin.region,
        },
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: `Invalid credentials: No account found for Badge ID '${identifier}'`,
      });
    }

    // Verify hashed password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials: Password does not match',
      });
    }

    // Role verification (if role was selected by user)
    const { role } = req.body;
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: `Role mismatch: This account is registered as '${user.role}', but you selected '${role}'. Please switch role to proceed.`,
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        badgeId: user.badgeId,
        role: user.role,
        region: user.region,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private (Protected by authMiddleware)
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id || req.user._id).select('-password');

    if (!user) {
      return res.status(200).json({
        success: true,
        user: req.user,
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        badgeId: user.badgeId,
        role: user.role,
        region: user.region,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  getMe,
  generateToken,
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isDbConnected } = require('../config/db');

class AuthService {
  constructor() {
    // In-memory fallback repository when MongoDB is not connected
    this.inMemoryUsers = new Map();
  }

  /**
   * Register a new user
   */
  async registerUser({ name, email, password }) {
    // 1. Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      const err = new Error('Name is required');
      err.code = 'INVALID_NAME';
      throw err;
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      const err = new Error('Email is required');
      err.code = 'INVALID_EMAIL';
      throw err;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(normalizedEmail)) {
      const err = new Error('Invalid email format');
      err.code = 'INVALID_EMAIL';
      throw err;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      const err = new Error('Password is required and must be at least 6 characters');
      err.code = 'INVALID_PASSWORD';
      throw err;
    }

    // 2. Duplicate Check & Database Insertion
    if (isDbConnected()) {
      try {
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
          const err = new Error('User with this email already exists');
          err.code = 'DUPLICATE_EMAIL';
          throw err;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword
        });

        return {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          createdAt: newUser.createdAt
        };
      } catch (err) {
        if (err.code === 'DUPLICATE_EMAIL') throw err;
        if (err.code === 11000) {
          const dupErr = new Error('User with this email already exists');
          dupErr.code = 'DUPLICATE_EMAIL';
          throw dupErr;
        }
        console.warn(`[AuthService] MongoDB error (${err.message}). Falling back to in-memory store.`);
      }
    }

    // In-Memory Fallback Mode
    if (this.inMemoryUsers.has(normalizedEmail)) {
      const err = new Error('User with this email already exists');
      err.code = 'DUPLICATE_EMAIL';
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    const mockUser = {
      _id: userId,
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    this.inMemoryUsers.set(normalizedEmail, mockUser);

    return {
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      createdAt: mockUser.createdAt
    };
  }

  /**
   * Login user and issue JWT token
   */
  async loginUser({ email, password }) {
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const normalizedEmail = email.trim().toLowerCase();
    let foundUser = null;

    if (isDbConnected()) {
      try {
        foundUser = await User.findOne({ email: normalizedEmail });
      } catch (err) {
        console.warn(`[AuthService] MongoDB lookup failed (${err.message}). Using in-memory fallback.`);
      }
    }

    if (!foundUser) {
      foundUser = this.inMemoryUsers.get(normalizedEmail);
    }

    if (!foundUser) {
      const err = new Error('Invalid email or password');
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const userId = foundUser._id ? foundUser._id.toString() : foundUser.id;
    const jwtSecret = process.env.JWT_SECRET || 'paper_pulse_jwt_secret_key_2026_antigravity';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      {
        userId,
        id: userId,
        email: foundUser.email,
        name: foundUser.name
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    return {
      user: {
        id: userId,
        name: foundUser.name,
        email: foundUser.email
      },
      token
    };
  }

  /**
   * Get user profile by userId
   */
  async getUserProfile(userId) {
    if (isDbConnected()) {
      try {
        const user = await User.findById(userId).select('-password');
        if (user) {
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
          };
        }
      } catch (err) {
        console.warn(`[AuthService] MongoDB findById error (${err.message}).`);
      }
    }

    // In-Memory Search
    for (const [, user] of this.inMemoryUsers.entries()) {
      if (user.id === userId || user._id === userId) {
        return {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        };
      }
    }

    const err = new Error('User not found');
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  /**
   * Helper for testing: clear in-memory user map
   */
  clearUsers() {
    this.inMemoryUsers.clear();
  }
}

module.exports = new AuthService();

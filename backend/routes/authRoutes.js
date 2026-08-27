const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// POST /api/auth/register - Register a new user
router.post('/register', (req, res, next) => authController.register(req, res, next));

// POST /api/auth/login - Authenticate user and return JWT
router.post('/login', (req, res, next) => authController.login(req, res, next));

// GET /api/auth/me - Retrieve current authenticated user profile
router.get('/me', authMiddleware, (req, res, next) => authController.getProfile(req, res, next));

module.exports = router;

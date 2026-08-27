const express = require('express');
const router = Router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply JWT Authentication middleware to all portfolio endpoints
router.use(authMiddleware);

// GET /api/portfolio - Retrieve all stock holdings for the logged-in user
router.get('/', (req, res, next) => portfolioController.getPortfolioHoldings(req, res, next));

// GET /api/portfolio/:symbol - Retrieve a specific holding details for the user
router.get('/:symbol', (req, res, next) => portfolioController.getHoldingBySymbol(req, res, next));

module.exports = router;

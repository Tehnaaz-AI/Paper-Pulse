const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');
const { validateTradePayload } = require('../middleware/validateTrade');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply JWT auth middleware globally to secure all trading operations
router.use(authMiddleware);

// POST /api/trades/execute - Execute a manual paper trade (BUY/SELL/HOLD)
router.post('/execute', validateTradePayload, (req, res, next) => tradeController.executeManualTrade(req, res, next));

// POST /api/trades/auto-signal - Execute an automatic trade driven by the live ML forecast
router.post('/auto-signal', (req, res, next) => tradeController.executeAutoTrade(req, res, next));

// GET /api/trades - Retrieve trade logs for the authenticated user
router.get('/', (req, res, next) => tradeController.getTradeHistory(req, res, next));

// GET /api/trades/:symbol - Retrieve trade logs filtered by stock symbol
router.get('/:symbol', (req, res, next) => tradeController.getTradeHistory(req, res, next));

module.exports = router;

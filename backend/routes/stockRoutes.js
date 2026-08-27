const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

// GET /api/stocks/compare?symbols=A,B
router.get('/compare', (req, res, next) => stockController.compareStocks(req, res, next));

// GET /api/stocks - Get list of supported stock symbols from CSV
router.get('/', (req, res, next) => stockController.getAvailableStocks(req, res, next));

// GET /api/stocks/:symbol - Get details (resolved symbol, latest price)
router.get('/:symbol', (req, res, next) => stockController.getStockDetails(req, res, next));

// GET /api/stocks/:symbol/history - Get historical market price rows
router.get('/:symbol/history', (req, res, next) => stockController.getStockHistory(req, res, next));

module.exports = router;

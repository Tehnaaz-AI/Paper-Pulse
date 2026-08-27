const express = require('express');
const router = express.Router();
const mlController = require('../controllers/mlController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply JWT Authentication middleware
router.use(authMiddleware);

// GET /api/ml/predict/:symbol - Fetch prediction direction and signals for a symbol
router.get('/predict/:symbol', (req, res, next) => mlController.getPrediction(req, res, next));

// POST /api/ml/predict - Fetch prediction direction (passed in request body)
router.post('/predict', (req, res, next) => mlController.getPrediction(req, res, next));

module.exports = router;

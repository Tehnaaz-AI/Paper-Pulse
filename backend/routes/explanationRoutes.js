const express = require('express');
const router = express.Router();
const explanationController = require('../controllers/explanationController');

// GET /api/explanations - Retrieve all financial term explanations
router.get('/', (req, res, next) => explanationController.getAllExplanations(req, res, next));

// GET /api/explanations/:term - Retrieve explanation for a specific term
router.get('/:term', (req, res, next) => explanationController.getExplanationByTerm(req, res, next));

module.exports = router;

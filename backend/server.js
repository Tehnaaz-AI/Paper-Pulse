const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const tradeRoutes = require('./routes/tradeRoutes');
const explanationRoutes = require('./routes/explanationRoutes');
const walletRoutes = require('./routes/walletRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const stockRoutes = require('./routes/stockRoutes');
const mlRoutes = require('./routes/mlRoutes');
const explanationService = require('./services/explanationService');
const errorHandler = require('./middleware/errorHandler');
const { successResponse } = require('./utils/apiResponse');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/explanations', explanationRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/ml', mlRoutes);

// Base Health Check Route
app.get('/health', (req, res) => {
  return successResponse(res, 200, 'Trading and Educational Backend service is running healthy', {
    status: 'UP',
    module: "Hasrith's Trading, Auth & Educational Backend",
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  return successResponse(res, 200, 'Paper Pulse Trading Engine API Server', {
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'POST /api/trades/execute',
      'POST /api/trades/auto-signal',
      'GET /api/trades',
      'GET /api/trades/:symbol',
      'GET /api/explanations',
      'GET /api/explanations/:term'
    ]
  });
});

// Error Handler Middleware
app.use(errorHandler);

// Start Server & Initialize Database
const startServer = async () => {
  const isDbConnected = await connectDB();
  if (isDbConnected) {
    await explanationService.seedExplanationsIfEmpty();
  }

  // Only start listening if run directly (not required by test suite)
  if (require.main === module) {
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` Paper Pulse - Hasrith's Trading, Auth & Educational Backend`);
      console.log(` Server running on http://localhost:${PORT}`);
      console.log(` Database: ${isDbConnected ? 'MongoDB Connected' : 'Mock/In-Memory Mode Active'}`);
      console.log(`====================================================`);
    });
  }
};

startServer();

module.exports = app;

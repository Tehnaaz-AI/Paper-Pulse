const mockSignalProvider = require('../mocks/mockSignalProvider');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class MLController {
  /**
   * GET /api/ml/predict/:symbol
   * POST /api/ml/predict
   */
  async getPrediction(req, res, next) {
    try {
      const symbol = (req.params.symbol || req.body.symbol || 'TCS').trim().toUpperCase();

      // Attempt to contact Python FastAPI prediction service
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

        const apiResponse = await fetch(`http://127.0.0.1:8000/predict/${symbol}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (apiResponse.ok) {
          const mlResult = await apiResponse.json();
          return successResponse(res, 200, 'ML Prediction generated successfully', {
            symbol: mlResult.symbol,
            prediction: mlResult.signal,
            confidence: Math.round((mlResult.prediction === 'UP' ? mlResult.probability_up : mlResult.probability_down) * 100) / 100,
            model: mlResult.model,
            trend: mlResult.trend,
            reasons: mlResult.reasons,
            price: mlResult.current_price,
            generatedAt: mlResult.generated_at,
            isMock: false
          });
        }
      } catch (err) {
        console.warn(`[MLController Warning] Python ML API offline at http://127.0.0.1:8000. Error: ${err.message}. Using fallback prediction.`);
      }

      // Fallback mode if Python service is offline
      const mockResult = mockSignalProvider.getSignal(symbol);
      return successResponse(res, 200, 'ML Prediction generated successfully (Fallback Backup Mode)', {
        symbol: mockResult.symbol,
        prediction: mockResult.action,
        confidence: mockResult.confidence || 0.75,
        model: 'MockRandomForestClassifier',
        trend: mockResult.action === 'BUY' ? 'POSITIVE' : (mockResult.action === 'SELL' ? 'NEGATIVE' : 'NEUTRAL'),
        reasons: [
          'Python FastAPI service is offline. Returning simulated mock prediction for testing.',
          'Model relies on cached fallback parameters.'
        ],
        price: mockResult.price,
        generatedAt: mockResult.timestamp,
        isMock: true
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MLController();

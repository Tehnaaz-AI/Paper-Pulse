const csvStockService = require('../services/csvStockService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Mock data for fundamental metrics for educational purposes
const getMockMetrics = (symbol) => {
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return {
    peRatio: ((hash % 20) + 10).toFixed(2),
    roe: ((hash % 15) + 5).toFixed(2) + '%',
    eps: ((hash % 50) + 10).toFixed(2),
    marketCap: ((hash % 900) + 100) + 'B',
    dividendYield: ((hash % 5) + 1).toFixed(2) + '%',
    debtToEquity: ((hash % 200) / 100).toFixed(2)
  };
};

class StockController {
  /**
   * GET /api/stocks
   */
  async getAvailableStocks(req, res, next) {
    try {
      const symbols = csvStockService.getAvailableSymbols();
      return successResponse(res, 200, 'Available stock symbols retrieved successfully from CSV datasets', symbols);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stocks/:symbol
   */
  async getStockDetails(req, res, next) {
    try {
      const { symbol } = req.params;
      const cleanSymbol = symbol.trim().toUpperCase();
      
      const available = csvStockService.getAvailableSymbols();
      const resolved = csvStockService._resolveSymbol(cleanSymbol);
      
      if (!available.includes(resolved)) {
        return errorResponse(res, 404, `Stock symbol '${cleanSymbol}' is not supported in the database CSV files.`, 'UNSUPPORTED_SYMBOL');
      }

      const price = csvStockService.getLatestPrice(cleanSymbol);
      return successResponse(res, 200, `Details for stock ${cleanSymbol} retrieved successfully`, {
        symbol: cleanSymbol,
        resolvedSymbol: resolved,
        price
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stocks/:symbol/history
   */
  async getStockHistory(req, res, next) {
    try {
      const { symbol } = req.params;
      const cleanSymbol = symbol.trim().toUpperCase();
      const limit = Number(req.query.limit) || 100;
      
      const available = csvStockService.getAvailableSymbols();
      const resolved = csvStockService._resolveSymbol(cleanSymbol);
      
      if (!available.includes(resolved)) {
        return errorResponse(res, 404, `Stock symbol '${cleanSymbol}' is not supported in the database CSV files.`, 'UNSUPPORTED_SYMBOL');
      }

      const history = csvStockService.getHistoricalData(cleanSymbol, limit);
      return successResponse(res, 200, `Historical market records retrieved successfully for ${cleanSymbol}`, history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stocks/compare?symbols=A,B
   * Compare two stocks
   */
  async compareStocks(req, res, next) {
    try {
      const { symbols } = req.query;
      if (!symbols || typeof symbols !== 'string') {
        return errorResponse(res, 400, 'Please provide symbols query parameter (e.g., symbols=TCS,INFY)');
      }

      const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase());
      if (symbolArray.length !== 2) {
        return errorResponse(res, 400, 'Please provide exactly two symbols separated by a comma');
      }

      const comparisons = symbolArray.map(symbol => {
        const history = csvStockService.getHistoricalData(symbol, 30);
        const currentPrice = csvStockService.getLatestPrice(symbol);
        const metrics = getMockMetrics(symbol);
        
        let trend = 'Stable';
        let signal = 'HOLD';
        if (history.length >= 2) {
          const first = history[0].close;
          const last = history[history.length - 1].close;
          if (last > first * 1.05) {
            trend = 'Positive';
            signal = 'BUY';
          } else if (last < first * 0.95) {
            trend = 'Negative';
            signal = 'SELL';
          }
        }

        return {
          symbol,
          currentPrice,
          metrics,
          analysis: { trend, signal }
        };
      });

      return successResponse(res, 200, 'Stock comparison data', comparisons);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StockController();

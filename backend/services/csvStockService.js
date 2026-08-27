const fs = require('fs');
const path = require('path');

class CSVStockService {
  constructor() {
    this.csvDir = path.join(__dirname, '../data/csv');
    this.stockData = new Map();
    this.symbolAliases = new Map([
      ['INFY', 'INFOSYS'],
      ['INFOSYS', 'INFY'],
      ['HDFCBANK', 'HDFC'],
      ['HDFC', 'HDFCBANK'],
      ['SBIN', 'SBI'],
      ['SBI', 'SBIN']
    ]);
    this.loadCSVFiles();
  }

  /**
   * Normalize filename into a clean symbol key
   * e.g. "HDFC - Sheet1.csv" -> "HDFC"
   * e.g. "INFOSYS - Sheet1.csv" -> "INFOSYS"
   * e.g. "TCS.csv" -> "TCS"
   */
  _extractSymbolFromFilename(filename) {
    const nameWithoutExt = path.basename(filename, path.extname(filename));
    // Extract primary symbol before space, dash, or underscore
    const cleanSymbol = nameWithoutExt.split(/[\s_-]+/)[0].toUpperCase();
    return cleanSymbol;
  }

  /**
   * Load and parse all CSV files in the data/csv directory
   */
  loadCSVFiles() {
    try {
      if (!fs.existsSync(this.csvDir)) {
        console.warn(`[CSVStockService Warning] CSV directory not found at ${this.csvDir}`);
        return;
      }

      const files = fs.readdirSync(this.csvDir).filter((file) => file.endsWith('.csv'));

      for (const file of files) {
        const symbol = this._extractSymbolFromFilename(file);
        const filePath = path.join(this.csvDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const lines = fileContent.trim().split('\n');
        if (lines.length <= 1) continue;

        // Skip header: Date,Open,High,Low,Close,Volume
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const [date, open, high, low, close, volume] = line.split(',');
          rows.push({
            date: date ? date.trim() : '',
            open: parseFloat(open) || 0,
            high: parseFloat(high) || 0,
            low: parseFloat(low) || 0,
            close: parseFloat(close) || 0,
            volume: parseInt(volume, 10) || 0
          });
        }

        this.stockData.set(symbol, rows);

        // Also index under the full basename without extension if different (e.g. TCS - SHEET1)
        const fullKey = path.basename(file, path.extname(file)).toUpperCase();
        if (fullKey !== symbol) {
          this.stockData.set(fullKey, rows);
        }
      }

      console.log(`[CSVStockService] Loaded market CSV data for symbols: ${Array.from(this.stockData.keys()).join(', ')}`);
    } catch (err) {
      console.error(`[CSVStockService Error] Failed to load CSV stock data: ${err.message}`);
    }
  }

  /**
   * Resolve symbol to primary mapped symbol or alias
   */
  _resolveSymbol(symbol) {
    if (!symbol) return null;
    const upper = symbol.toUpperCase();
    if (this.stockData.has(upper)) return upper;
    const alias = this.symbolAliases.get(upper);
    if (alias && this.stockData.has(alias)) return alias;
    return upper;
  }

  /**
   * Get list of all available stock symbols from loaded CSV files
   */
  getAvailableSymbols() {
    return Array.from(new Set(Array.from(this.stockData.keys()).map((s) => s.split(' ')[0])));
  }

  /**
   * Get historical records for a given stock symbol
   */
  getHistoricalData(symbol, limit = 100) {
    const resolved = this._resolveSymbol(symbol);
    const rows = this.stockData.get(resolved);
    if (!rows) return [];
    return rows.slice(-limit);
  }

  /**
   * Get the latest close price for a stock symbol from the CSV data
   */
  getLatestPrice(symbol) {
    if (!symbol) return 1000;
    const resolved = this._resolveSymbol(symbol);
    const rows = this.stockData.get(resolved);

    if (rows && rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      return lastRow.close;
    }

    // Default fallback if symbol is not in CSV dataset
    const fallbacks = {
      TCS: 2270,
      INFY: 1120,
      INFOSYS: 1120,
      HDFC: 727.2,
      HDFCBANK: 727.2,
      SBI: 364,
      SBIN: 364,
      TATAPOWER: 1052
    };

    return fallbacks[resolved] || 1000;
  }

  /**
   * Construct an AI signal using actual prices from the CSV file
   */
  generateSignalFromCSV(symbol = 'TCS', action = 'BUY', quantity = 10) {
    const resolved = this._resolveSymbol(symbol);
    const actUpper = action.toUpperCase();
    const price = this.getLatestPrice(resolved);

    return {
      symbol: symbol.toUpperCase(),
      action: actUpper,
      price,
      quantity: actUpper === 'HOLD' ? 0 : quantity,
      signal: actUpper,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new CSVStockService();

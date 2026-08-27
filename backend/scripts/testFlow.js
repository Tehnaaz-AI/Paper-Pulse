const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const walletService = require('../services/walletService');
const portfolioService = require('../services/portfolioService');
const tradingService = require('../services/tradingService');
const autoTradingService = require('../services/autoTradingService');
const tradeHistoryService = require('../services/tradeHistoryService');
const explanationService = require('../services/explanationService');
const csvStockService = require('../services/csvStockService');

async function runTests() {
  await connectDB();
  console.log('\n================================================================');
  console.log(' RUNNING COMPREHENSIVE PAPER TRADING TEST SUITE (UPDATED CSV DATA)');
  console.log('================================================================\n');

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(` ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(` ❌ FAIL: ${message}`);
      throw new Error(`Assertion Failed: ${message}`);
    }
  }

  const userId = 'test_user_' + Date.now();

  try {
    // ----------------------------------------------------------------
    // Setup initial state
    // ----------------------------------------------------------------
    await walletService.resetBalance(userId, 100000);
    await portfolioService.resetHoldings();
    await tradeHistoryService.clearHistory();

    // Step 0: Check initial balance & CSV symbols
    const initBalance = await walletService.getBalance(userId);
    assert(initBalance === 100000, `Initial wallet balance is ₹100,000 (Actual: ₹${initBalance})`);

    const symbols = csvStockService.getAvailableSymbols();
    assert(symbols.length >= 5, `CSV Stock Service loaded ${symbols.length} CSV dataset symbols (${symbols.join(', ')})`);

    const tcsPrice = csvStockService.getLatestPrice('TCS');
    assert(tcsPrice === 2270, `TCS close price from updated CSV dataset is ₹2,270 (Actual: ₹${tcsPrice})`);

    // ----------------------------------------------------------------
    // Step 1: Automatic BUY trade TCS 10 @ CSV price (₹2,270)
    // ----------------------------------------------------------------
    console.log('\n--- Scenario 1: Execute Automatic BUY Trade (TCS 10 @ CSV price ₹2,270) ---');
    const buyResult = await autoTradingService.processSignal(
      {
        symbol: 'TCS',
        action: 'BUY',
        price: tcsPrice,
        quantity: 10,
        signal: 'BUY',
        timestamp: new Date().toISOString()
      },
      userId
    );

    assert(buyResult.executed === true, 'BUY Trade executed successfully');
    assert(buyResult.totalValue === 22700, 'Total trade value is ₹22,700');
    assert(buyResult.walletBalance === 77300, 'Wallet balance reduced to ₹77,300');
    assert(buyResult.portfolioHolding.quantity === 10, 'Portfolio holds 10 shares of TCS');
    assert(buyResult.portfolioHolding.averagePurchasePrice === 2270, 'Average purchase price is ₹2,270');

    // ----------------------------------------------------------------
    // Step 2: Automatic SELL trade TCS 5 @ ₹2,500
    // ----------------------------------------------------------------
    console.log('\n--- Scenario 2: Execute Automatic SELL Trade (TCS 5 @ ₹2,500) ---');
    const sellResult = await autoTradingService.processSignal(
      {
        symbol: 'TCS',
        action: 'SELL',
        price: 2500,
        quantity: 5,
        signal: 'SELL',
        timestamp: new Date().toISOString()
      },
      userId
    );

    assert(sellResult.executed === true, 'SELL Trade executed successfully');
    assert(sellResult.totalValue === 12500, 'Total sale value is ₹12,500');
    assert(sellResult.walletBalance === 89800, 'Wallet balance updated to ₹89,800');
    assert(sellResult.realizedProfitLoss === 1150, 'Realized P/L calculated correctly as ₹1,150');
    assert(sellResult.portfolioHolding.quantity === 5, 'Remaining portfolio holds 5 shares of TCS');

    // ----------------------------------------------------------------
    // Step 3: Trade History Verification
    // ----------------------------------------------------------------
    console.log('\n--- Scenario 3: Verify Trade History Logs ---');
    const history = await tradeHistoryService.getTradeHistory(userId);
    assert(history.length === 2, `Trade history contains exactly 2 records (Actual: ${history.length})`);
    assert(history[1].action === 'BUY' && history[1].symbol === 'TCS', 'First record is BUY TCS');
    assert(history[0].action === 'SELL' && history[0].symbol === 'TCS', 'Second record is SELL TCS');

    // ----------------------------------------------------------------
    // Edge Case 1: BUY with Insufficient Balance
    // ----------------------------------------------------------------
    console.log('\n--- Scenario 4: BUY with Insufficient Wallet Balance ---');
    try {
      await tradingService.executeTrade({
        userId,
        symbol: 'HDFC',
        action: 'BUY',
        price: 100000,
        quantity: 5,
        tradeType: 'MANUAL'
      });
      assert(false, 'Should have rejected trade due to insufficient balance');
    } catch (err) {
      assert(err.code === 'INSUFFICIENT_BALANCE', `Rejected correctly with INSUFFICIENT_BALANCE (${err.message})`);
    }

    // ----------------------------------------------------------------
    // Edge Case 2: SELL More Shares Than Owned
    // ----------------------------------------------------------------
    console.log('\n--- Scenario 5: SELL More Shares Than Owned ---');
    try {
      await tradingService.executeTrade({
        userId,
        symbol: 'TCS',
        action: 'SELL',
        price: 2500,
        quantity: 20,
        tradeType: 'MANUAL'
      });
      assert(false, 'Should have rejected trade due to insufficient holdings');
    } catch (err) {
      assert(err.code === 'INSUFFICIENT_HOLDINGS', `Rejected correctly with INSUFFICIENT_HOLDINGS (${err.message})`);
    }

    // ----------------------------------------------------------------
    // Edge Case 3: HOLD Signal Execution
    // ----------------------------------------------------------------
    console.log('\n--- Scenario 6: Process HOLD Signal ---');
    const holdResult = await tradingService.executeTrade({
      userId,
      symbol: 'INFOSYS',
      action: 'HOLD',
      quantity: 0,
      price: 1120,
      tradeType: 'AUTOMATIC'
    });
    assert(holdResult.executed === false, 'HOLD result executed is false');
    assert(holdResult.action === 'HOLD', 'Action returned as HOLD');
    assert(holdResult.walletBalance === 89800, 'Wallet balance remains unchanged at ₹89,800');

    // ----------------------------------------------------------------
    // Edge Case 4: Invalid Quantity
    // ----------------------------------------------------------------
    console.log('\n--- Scenario 7: Reject Invalid Quantity (-5) ---');
    try {
      await tradingService.executeTrade({
        userId,
        symbol: 'TCS',
        action: 'BUY',
        price: 2270,
        quantity: -5,
        tradeType: 'MANUAL'
      });
      assert(false, 'Should have rejected invalid quantity');
    } catch (err) {
      assert(err.code === 'INVALID_QUANTITY', `Rejected correctly with INVALID_QUANTITY (${err.message})`);
    }

    // ----------------------------------------------------------------
    // Edge Case 5: Invalid Price
    // ----------------------------------------------------------------
    console.log('\n--- Scenario 8: Reject Invalid Price (0) ---');
    try {
      await tradingService.executeTrade({
        userId,
        symbol: 'TCS',
        action: 'BUY',
        price: 0,
        quantity: 10,
        tradeType: 'MANUAL'
      });
      assert(false, 'Should have rejected invalid price');
    } catch (err) {
      assert(err.code === 'INVALID_PRICE', `Rejected correctly with INVALID_PRICE (${err.message})`);
    }

    // ----------------------------------------------------------------
    // Edge Case 6: Manual Trade Execution with HDFC CSV price
    // ----------------------------------------------------------------
    console.log('\n--- Scenario 9: Execute Manual BUY Trade with HDFC CSV price ---');
    const hdfcPrice = csvStockService.getLatestPrice('HDFC');
    const manualBuy = await tradingService.executeTrade({
      userId,
      symbol: 'HDFC',
      action: 'BUY',
      price: hdfcPrice,
      quantity: 10,
      tradeType: 'MANUAL'
    });
    assert(manualBuy.executed === true && manualBuy.tradeType === 'MANUAL', 'Manual trade executed successfully');
    assert(manualBuy.totalValue === hdfcPrice * 10, `Manual trade total value is ₹${hdfcPrice * 10}`);

    // ----------------------------------------------------------------
    // Edge Case 7: Financial Term Explanation Feature
    // ----------------------------------------------------------------
    console.log('\n--- Scenario 10: Explain-It Feature Verification ---');
    const allExplanations = await explanationService.getAllExplanations();
    assert(allExplanations.length === 9, `Retrieved all 9 required terms (Actual: ${allExplanations.length})`);

    const peRatio = await explanationService.getExplanationByTerm('P/E Ratio');
    assert(peRatio !== null && peRatio.term === 'P/E Ratio', 'Retrieved P/E Ratio explanation correctly');

    // ----------------------------------------------------------------
    // Summary
    // ----------------------------------------------------------------
    console.log('\n================================================================');
    console.log(` ALL ${passedTests} OF ${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('================================================================\n');
    await mongoose.connection.close();
    console.log('Database disconnected. Exiting test process.');
  } catch (error) {
    console.error('\n================================================================');
    console.error(` TEST SUITE FAILED AT STEP: ${error.message}`);
    console.error('================================================================\n');
    try {
      await mongoose.connection.close();
    } catch (e) {}
    process.exit(1);
  }
}

runTests();

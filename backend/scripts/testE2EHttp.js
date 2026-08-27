const mongoose = require('mongoose');
const app = require('../server');
const http = require('http');

const PORT = 5050;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runE2ETests() {
  console.log('\n==================================================');
  console.log('STARTING PAPER PULSE E2E HTTP INTEGRATION TESTS');
  console.log('==================================================\n');

  // Spawn Express server on port 5060
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Test server active on ${BASE_URL}`);
  console.log('PORT TYPE:', typeof PORT, 'PORT VALUE:', PORT);
  console.log('BASE_URL TYPE:', typeof BASE_URL, 'BASE_URL VALUE:', BASE_URL);

  let total = 0;
  let passed = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`   ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`   ❌ FAIL: ${message}`);
      throw new Error(`Assertion Failed: ${message}`);
    }
  }

  // Generate unique test users
  const uniqueId = Date.now();
  const userA_payload = {
    name: 'User A',
    email: `usera_${uniqueId}@test.com`,
    password: 'password123'
  };
  const userB_payload = {
    name: 'User B',
    email: `userb_${uniqueId}@test.com`,
    password: 'password123'
  };

  let tokenA = '';
  let tokenB = '';
  let userIdA = '';
  let userIdB = '';

  try {
    // 1. Test registration
    console.log('1. Testing User A Registration (POST /api/auth/register)...');
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userA_payload)
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'User A registered successfully (201)');
    assert(regData.success === true, 'Success flag is true');
    assert(regData.data.email === userA_payload.email, 'Email matches');
    assert(!regData.data.password, 'Password field is deleted from response');
    userIdA = regData.data.id;

    // 2. Test duplicate registration prevention
    console.log('2. Testing Duplicate Email Registration...');
    const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userA_payload)
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 409, 'Duplicate email rejected with 409 Conflict');
    assert(dupData.success === false, 'Success flag is false');
    assert(dupData.error === 'DUPLICATE_EMAIL', 'Error code matches DUPLICATE_EMAIL');

    // 3. Test invalid input validation
    console.log('3. Testing Registration Input Validation (Short password)...');
    const badRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userA_payload, email: 'bad@test.com', password: '12' })
    });
    assert(badRes.status === 400, 'Registration with short password rejected with 400');

    // 4. Test login
    console.log('4. Testing User A Login (POST /api/auth/login)...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userA_payload.email, password: userA_payload.password })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'User A logged in successfully (200)');
    assert(loginData.success === true, 'Success flag is true');
    assert(loginData.data.token, 'Token was returned');
    tokenA = loginData.data.token;

    // 5. Test wrong password login rejection
    console.log('5. Testing Login with Wrong Password...');
    const wrongRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userA_payload.email, password: 'wrongpassword' })
    });
    assert(wrongRes.status === 401, 'Login with wrong password rejected with 401');

    // 6. Test GET /api/auth/me
    console.log('6. Testing /auth/me profile retrieval (GET /api/auth/me)...');
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'Profile fetched successfully (200)');
    assert(meData.data.user.email === userA_payload.email, 'Profile email matches');

    // Register & login User B
    const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userB_payload)
    });
    const regBData = await regBRes.json();
    userIdB = regBData.data.id;

    const loginBRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userB_payload.email, password: userB_payload.password })
    });
    const loginBData = await loginBRes.json();
    tokenB = loginBData.data.token;

    // 7. Test Wallet Balance Retrieve & Initial Balance
    console.log('7. Testing Wallet balance fetch (GET /api/wallet)...');
    const wallRes = await fetch(`${BASE_URL}/api/wallet`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const wallData = await wallRes.json();
    assert(wallRes.status === 200, 'Wallet fetched successfully (200)');
    assert(wallData.data.balance === 100000, 'Initial balance is ₹100,000');

    // 8. Test Stocks metadata endpoints
    console.log('8. Testing market stock data endpoints...');
    const stocksRes = await fetch(`${BASE_URL}/api/stocks`);
    const stocksData = await stocksRes.json();
    assert(stocksRes.status === 200, 'GET /api/stocks successful');
    assert(stocksData.data.includes('TCS'), 'TCS in stocks list');

    const detailsRes = await fetch(`${BASE_URL}/api/stocks/TCS`);
    const detailsData = await detailsRes.json();
    assert(detailsRes.status === 200, 'GET /api/stocks/TCS successful');
    assert(detailsData.data.price === 2270, 'TCS latest close price is ₹2,270');

    const histRes = await fetch(`${BASE_URL}/api/stocks/TCS/history?limit=10`);
    const histData = await histRes.json();
    assert(histRes.status === 200, 'GET /api/stocks/TCS/history successful');
    assert(histData.data.length === 10, 'Returned requested history limit of 10');

    // 9. Test ML prediction endpoint (GET /api/ml/predict/:symbol)
    console.log('9. Testing ML prediction retrieval (GET /api/ml/predict/TCS)...');
    const mlRes = await fetch(`${BASE_URL}/api/ml/predict/TCS`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const mlData = await mlRes.json();
    assert(mlRes.status === 200, 'GET /api/ml/predict/TCS successful');
    assert(mlData.data.symbol === 'TCS', 'Signal for TCS');
    assert(['BUY', 'SELL', 'HOLD'].includes(mlData.data.prediction), 'Valid prediction class returned');
    assert(mlData.data.confidence > 0, 'Confidence is reported');

    // 10. Test Manual BUY trade
    console.log('10. Testing Manual BUY trade execution (POST /api/trades/execute)...');
    const buyRes = await fetch(`${BASE_URL}/api/trades/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        symbol: 'TCS',
        action: 'BUY',
        quantity: 10,
        price: 2270
      })
    });
    const buyData = await buyRes.json();
    assert(buyRes.status === 200, 'BUY trade completed successfully (200)');
    assert(buyData.data.executed === true, 'Executed flag is true');
    assert(buyData.data.walletBalance === 77300, 'User A Wallet decreased to ₹77,300');
    assert(buyData.data.portfolioHolding.quantity === 10, 'User A Portfolio increased to 10 TCS');

    // 11. Test Manual BUY validation (insufficient balance)
    console.log('11. Testing BUY validation (insufficient balance)...');
    const failBuyRes = await fetch(`${BASE_URL}/api/trades/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        symbol: 'TCS',
        action: 'BUY',
        quantity: 50,
        price: 2270
      })
    });
    const failBuyData = await failBuyRes.json();
    assert(failBuyRes.status === 400, 'BUY rejected with 400 Bad Request');
    assert(failBuyData.error === 'INSUFFICIENT_BALANCE', 'Error code is INSUFFICIENT_BALANCE');

    // 12. Test GET /api/portfolio
    console.log('12. Testing Portfolio retrieval (GET /api/portfolio)...');
    const portRes = await fetch(`${BASE_URL}/api/portfolio`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const portData = await portRes.json();
    assert(portRes.status === 200, 'GET /api/portfolio successful');
    assert(portData.data.length === 1, 'User A has 1 active holding');
    assert(portData.data[0].symbol === 'TCS', 'Holding symbol is TCS');
    assert(portData.data[0].quantity === 10, 'Holding quantity is 10');

    // 13. Test GET /api/portfolio/:symbol
    const portSymRes = await fetch(`${BASE_URL}/api/portfolio/TCS`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const portSymData = await portSymRes.json();
    assert(portSymRes.status === 200, 'GET /api/portfolio/TCS successful');
    assert(portSymData.data.symbol === 'TCS', 'Holding details for TCS fetched');

    // 14. Test User Isolation (User B cannot view or modify User A's data)
    console.log('14. Testing User Isolation...');
    // User B fetches portfolio (should be empty, since they haven't traded yet!)
    const portBRes = await fetch(`${BASE_URL}/api/portfolio`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const portBData = await portBRes.json();
    assert(portBRes.status === 200, 'GET /api/portfolio for User B successful');
    assert(portBData.data.length === 0, "User B's portfolio is empty (isolated from User A)");

    // User B tries to sell TCS shares (should fail since User B doesn't own any, even though User A owns 10!)
    const sellBRes = await fetch(`${BASE_URL}/api/trades/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        symbol: 'TCS',
        action: 'SELL',
        quantity: 5,
        price: 2500
      })
    });
    assert(sellBRes.status === 400, 'User B sell rejected due to insufficient holdings (isolated)');

    // 15. Test Manual SELL trade
    console.log('15. Testing Manual SELL trade execution (POST /api/trades/execute)...');
    const sellRes = await fetch(`${BASE_URL}/api/trades/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        symbol: 'TCS',
        action: 'SELL',
        quantity: 5,
        price: 2500
      })
    });
    const sellData = await sellRes.json();
    assert(sellRes.status === 200, 'SELL trade completed successfully');
    assert(sellData.data.executed === true, 'Executed flag is true');
    assert(sellData.data.walletBalance === 89800, 'User A Wallet updated to ₹89,800');
    assert(sellData.data.realizedProfitLoss === 1150, 'User A realized P/L is ₹1,150');
    assert(sellData.data.portfolioHolding.quantity === 5, 'User A Portfolio decreased to 5 TCS');

    // 16. Test GET /api/trades history
    console.log('16. Testing Trade history retrieval (GET /api/trades)...');
    const histTradesRes = await fetch(`${BASE_URL}/api/trades`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const histTradesData = await histTradesRes.json();
    assert(histTradesRes.status === 200, 'GET /api/trades successful');
    assert(histTradesData.data.length === 2, 'User A has 2 trade records in logs');

    // 17. Test Auto-signal trade triggered by real ML service predict
    console.log('17. Testing automatic trade via ML signal (POST /api/trades/auto-signal)...');
    const autoRes = await fetch(`${BASE_URL}/api/trades/auto-signal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        symbol: 'TCS',
        quantity: 10
      })
    });
    const autoData = await autoRes.json();
    assert(autoRes.status === 200, 'Automatic signal trade executed successfully');
    assert(autoData.data.executed === true || autoData.data.action === 'HOLD', 'Auto trade action handled (BUY, SELL, or HOLD)');

    console.log('\n==================================================');
    console.log(` 🎉 ALL ${passed} OF ${total} E2E TESTS PASSED SUCCESSFULLY! 🎉`);
    console.log('==================================================\n');
  } catch (error) {
    console.error('==================================================\n');
    console.error(` ❌ E2E TEST SUITE FAILED AT STEP:`);
    console.error(error);
    console.log('==================================================\n');
  } finally {
    // Teardown
    console.log('Cleaning up database test records...');
    try {
      await mongoose.model('User').deleteMany({ email: { $in: [userA_payload.email, userB_payload.email] } });
      await mongoose.model('Wallet').deleteMany({ userId: { $in: [userIdA, userIdB] } });
      await mongoose.model('Portfolio').deleteMany({ userId: { $in: [userIdA, userIdB] } });
      await mongoose.model('Trade').deleteMany({ userId: { $in: [userIdA, userIdB] } });
      console.log('Test records cleaned up.');
    } catch (err) {
      console.warn('Cleanup failed:', err.message);
    }
    
    await mongoose.connection.close();
    await new Promise((resolve) => server.close(resolve));
    console.log('Server closed. Database disconnected. Exiting test process.');
  }
}

runE2ETests();

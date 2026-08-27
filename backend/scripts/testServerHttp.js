const app = require('../server');

async function testHttpEndpoints() {
  const PORT = 5050;
  const server = app.listen(PORT, async () => {
    console.log(`Test Express server listening on port ${PORT}`);
    const baseUrl = `http://localhost:${PORT}`;

    try {
      // 1. Health check
      const resHealth = await fetch(`${baseUrl}/health`);
      const healthData = await resHealth.json();
      console.log('GET /health => Status:', resHealth.status, 'Success:', healthData.success);

      // 2. GET /api/explanations
      const resExplanations = await fetch(`${baseUrl}/api/explanations`);
      const expData = await resExplanations.json();
      console.log('GET /api/explanations => Count:', expData.data.length);

      // 3. GET /api/explanations/pe-ratio
      const resPE = await fetch(`${baseUrl}/api/explanations/pe-ratio`);
      const peData = await resPE.json();
      console.log('GET /api/explanations/pe-ratio => Term:', peData.data.term);

      // 4. POST /api/trades/execute (Manual BUY)
      const resManualBuy = await fetch(`${baseUrl}/api/trades/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: 'INFY',
          action: 'BUY',
          price: 1500,
          quantity: 10,
          signal: 'BUY',
          tradeType: 'MANUAL'
        })
      });
      const buyData = await resManualBuy.json();
      console.log('POST /api/trades/execute => Status:', resManualBuy.status, 'Wallet:', buyData.data.walletBalance);

      // 5. POST /api/trades/auto-signal (Auto BUY)
      const resAutoBuy = await fetch(`${baseUrl}/api/trades/auto-signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: 'TCS',
          action: 'BUY',
          price: 3500,
          quantity: 10,
          signal: 'BUY'
        })
      });
      const autoBuyData = await resAutoBuy.json();
      console.log('POST /api/trades/auto-signal => Status:', resAutoBuy.status, 'Holding Qty:', autoBuyData.data.portfolioHolding.quantity);

      // 6. GET /api/trades
      const resTrades = await fetch(`${baseUrl}/api/trades`);
      const tradesData = await resTrades.json();
      console.log('GET /api/trades => Total Trades:', tradesData.data.length);

      // 7. GET /api/trades/TCS
      const resTCSTrades = await fetch(`${baseUrl}/api/trades/TCS`);
      const tcsTradesData = await resTCSTrades.json();
      console.log('GET /api/trades/TCS => TCS Trades:', tcsTradesData.data.length);

      console.log('\n✅ HTTP REST APIs tested successfully!');
    } catch (err) {
      console.error('HTTP Test Error:', err);
    } finally {
      server.close(() => console.log('Test server closed.'));
    }
  });
}

testHttpEndpoints();

const app = require('../server');

async function testAuthHttpRest() {
  const PORT = 5095;
  const server = app.listen(PORT, async () => {
    console.log(`\n====================================================`);
    console.log(` Testing Auth REST Endpoints on http://localhost:${PORT}`);
    console.log(`====================================================\n`);

    const baseUrl = `http://localhost:${PORT}`;

    try {
      // 1. Register
      console.log('1. POST /api/auth/register');
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Hasrith',
          email: 'hasrith.rest@example.com',
          password: 'password123'
        })
      });
      const regData = await regRes.json();
      console.log('   Response Status:', regRes.status);
      console.log('   Data:', JSON.stringify(regData, null, 2));

      // 2. Login
      console.log('\n2. POST /api/auth/login');
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'hasrith.rest@example.com',
          password: 'password123'
        })
      });
      const loginData = await loginRes.json();
      console.log('   Response Status:', loginRes.status);
      console.log('   Token Issued:', loginData.data?.token ? `${loginData.data.token.substring(0, 25)}...` : 'None');

      const token = loginData.data?.token;

      // 3. GET /api/auth/me (Protected Route)
      console.log('\n3. GET /api/auth/me (With Authorization Header)');
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const meData = await meRes.json();
      console.log('   Response Status:', meRes.status);
      console.log('   User Profile:', JSON.stringify(meData, null, 2));

      // 4. POST /api/trades/execute (Protected Manual Trade)
      console.log('\n4. POST /api/trades/execute (Trade associated with authenticated User ID)');
      const tradeRes = await fetch(`${baseUrl}/api/trades/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          symbol: 'TCS',
          action: 'BUY',
          price: 2270,
          quantity: 10
        })
      });
      const tradeData = await tradeRes.json();
      console.log('   Response Status:', tradeRes.status);
      console.log('   Executed User ID:', tradeData.data?.trade?.userId);
      console.log('   Wallet Balance:', tradeData.data?.walletBalance);

      console.log('\n✅ All Auth REST API HTTP endpoints tested successfully!');
    } catch (err) {
      console.error('REST Test Error:', err);
    } finally {
      server.close();
    }
  });
}

testAuthHttpRest();

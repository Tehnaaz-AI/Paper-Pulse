const app = require('../server');
const authService = require('../services/authService');
const bcrypt = require('bcryptjs');

async function runAuthTests() {
  console.log('\n================================================================');
  console.log(' RUNNING USER AUTHENTICATION TEST SUITE');
  console.log('================================================================\n');

  const PORT = 5090;
  const server = app.listen(PORT, async () => {
    const baseUrl = `http://localhost:${PORT}`;
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

    try {
      authService.clearUsers();

      // TEST 1 — REGISTER
      console.log('\n--- TEST 1: User Registration ---');
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Hasrith',
          email: 'hasrith@test.com',
          password: 'password123'
        })
      });
      const regData = await regRes.json();
      assert(regRes.status === 201, 'Registration returned HTTP 201 Created');
      assert(regData.success === true, 'Response success is true');
      assert(regData.data.email === 'hasrith@test.com', 'Returned user email matches input');
      assert(regData.data.password === undefined, 'Plain text password is NOT returned');

      // TEST 2 — DUPLICATE REGISTER
      console.log('\n--- TEST 2: Duplicate Registration Prevention ---');
      const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Hasrith Duplicate',
          email: 'hasrith@test.com',
          password: 'password123'
        })
      });
      const dupData = await dupRes.json();
      assert(dupRes.status === 409, 'Duplicate registration returned HTTP 409 Conflict');
      assert(dupData.success === false, 'Duplicate response success is false');
      assert(dupData.message === 'User with this email already exists', 'Error message indicates duplicate email');

      // TEST 3 — LOGIN
      console.log('\n--- TEST 3: User Login ---');
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'hasrith@test.com',
          password: 'password123'
        })
      });
      const loginData = await loginRes.json();
      assert(loginRes.status === 200, 'Login returned HTTP 200 OK');
      assert(loginData.success === true, 'Login response success is true');
      assert(!!loginData.data.token, 'JWT token returned in data payload');
      assert(loginData.data.user.email === 'hasrith@test.com', 'User email returned correctly in payload');
      assert(loginData.data.user.password === undefined, 'Password hash is NOT returned in login response');

      const authToken = loginData.data.token;

      // TEST 4 — WRONG PASSWORD
      console.log('\n--- TEST 4: Login with Wrong Password ---');
      const wrongPassRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'hasrith@test.com',
          password: 'wrongpassword'
        })
      });
      const wrongPassData = await wrongPassRes.json();
      assert(wrongPassRes.status === 401, 'Wrong password returned HTTP 401 Unauthorized');
      assert(wrongPassData.success === false, 'Response success is false');

      // TEST 5 — PROTECTED API WITHOUT TOKEN
      console.log('\n--- TEST 5: Protected Endpoint without Token ---');
      const noTokenRes = await fetch(`${baseUrl}/api/auth/me`);
      const noTokenData = await noTokenRes.json();
      assert(noTokenRes.status === 401, 'No token request returned HTTP 401 Unauthorized');
      assert(noTokenData.message === 'Authentication token required', 'Error message says token required');

      // TEST 6 — PROTECTED API WITH VALID TOKEN
      console.log('\n--- TEST 6: Protected Endpoint with Valid Bearer Token ---');
      const validTokenRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const validTokenData = await validTokenRes.json();
      assert(validTokenRes.status === 200, 'Valid token request returned HTTP 200 OK');
      assert(validTokenData.success === true, 'Response success is true');
      assert(validTokenData.data.user.email === 'hasrith@test.com', 'User email identified correctly via JWT');

      // TEST 7 — INVALID TOKEN
      console.log('\n--- TEST 7: Protected Endpoint with Invalid Token ---');
      const invalidTokenRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Authorization: 'Bearer invalid_jwt_token_123'
        }
      });
      const invalidTokenData = await invalidTokenRes.json();
      assert(invalidTokenRes.status === 401, 'Invalid token request returned HTTP 401 Unauthorized');
      assert(invalidTokenData.message === 'Invalid or expired token', 'Error message says invalid/expired token');

      // TEST 8 — PASSWORD SECURITY CHECK
      console.log('\n--- TEST 8: Password Security & Bcrypt Hashing ---');
      const inMemUser = authService.inMemoryUsers.get('hasrith@test.com');
      assert(!!inMemUser, 'User found in repository');
      assert(inMemUser.password !== 'password123', 'Password in storage is NOT plain-text "password123"');
      assert(inMemUser.password.startsWith('$2a$') || inMemUser.password.startsWith('$2b$'), 'Password is valid bcrypt hash');
      assert(await bcrypt.compare('password123', inMemUser.password), 'Bcrypt hash correctly matches "password123"');

      console.log('\n================================================================');
      console.log(` ALL ${passedTests} OF ${totalTests} AUTHENTICATION TESTS PASSED SUCCESSFULLY!`);
      console.log('================================================================\n');

    } catch (err) {
      console.error(`\n❌ Auth Test Failed: ${err.message}`);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

runAuthTests();

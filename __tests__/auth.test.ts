import { signToken, verifyToken, JWTPayload } from '../lib/auth';

export async function runAuthTests() {
  console.log('🧪 Running Auth & Role Verification Tests...');

  const userPayload: JWTPayload = {
    userId: 'user-uuid-123',
    email: 'user@example.com',
    role: 'USER',
    phone: '+254711111111',
  };

  const adminPayload: JWTPayload = {
    userId: 'admin-uuid-456',
    email: 'admin@taskpesa.co.ke',
    role: 'ADMIN',
    phone: '+254722222222',
  };

  // 1. Sign & Verify User Token
  const userToken = await signToken(userPayload);
  const decodedUser = await verifyToken(userToken);
  console.assert(decodedUser !== null, 'User token verification should succeed');
  console.assert(decodedUser?.role === 'USER', 'Decoded user role should be USER');

  // 2. Sign & Verify Admin Token
  const adminToken = await signToken(adminPayload);
  const decodedAdmin = await verifyToken(adminToken);
  console.assert(decodedAdmin !== null, 'Admin token verification should succeed');
  console.assert(decodedAdmin?.role === 'ADMIN', 'Decoded admin role should be ADMIN');

  // 3. Verify Invalid Token
  const invalidToken = await verifyToken('invalid.jwt.token');
  console.assert(invalidToken === null, 'Invalid JWT token should return null');

  console.log('✅ Auth & Role Tests Passed!');
}

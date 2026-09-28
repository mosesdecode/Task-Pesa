import { SignJWT, jwtVerify } from 'jose';

export const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'default_taskmint_secret_key_change_in_production_2026'
);

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
  phone: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, SECRET_KEY);
    return verified.payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Edge-safe: verifies cookie token, returns payload only if role===ADMIN.
// No Prisma — safe for Edge Runtime (middleware) and Server Component layouts.
export async function getAdminTokenPayload(
  token: string | undefined
): Promise<JWTPayload | null> {
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './prisma';

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'default_taskpesa_secret_key_change_in_production_2026'
);

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
  phone: string;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
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

export async function getSessionUser(req: NextRequest) {
  const token =
    req.cookies.get('taskpesa_token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      package: true,
      wallet: true,
    },
  });

  return user;
}

export async function requireAuth(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAdmin(req: NextRequest) {
  const user = await requireAuth(req);
  if (user.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }
  return user;
}

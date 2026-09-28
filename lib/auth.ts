import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { JWTPayload, signToken, verifyToken, getAdminTokenPayload } from './jwt';

export type { JWTPayload };
export { signToken, verifyToken, getAdminTokenPayload };

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}



export async function getSessionUser(req: NextRequest) {
  const token =
    req.cookies.get('taskmint_token')?.value ||
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

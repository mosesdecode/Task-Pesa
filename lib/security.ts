import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function logDeviceAccess(userId: string, ipAddress: string, userAgent: string, country: string | null) {
  try {
    // Check if this IP is already blocked
    const existingLog = await prisma.deviceLog.findFirst({
      where: { ipAddress, isBlocked: true }
    });

    if (existingLog) {
      throw new Error('IP_BLOCKED');
    }

    // Log the access
    await prisma.deviceLog.create({
      data: {
        userId,
        ipAddress,
        userAgent,
        country
      }
    });

    // Check for suspicious activity (e.g., same IP logging into more than 3 distinct accounts in 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const distinctUsersOnIp = await prisma.deviceLog.findMany({
      where: { 
        ipAddress,
        createdAt: { gte: twentyFourHoursAgo }
      },
      select: { userId: true },
      distinct: ['userId']
    });

    if (distinctUsersOnIp.length > 3) {
      // Flag suspicious activity
      console.warn(`[SECURITY WARNING] Multiple accounts accessed from IP: ${ipAddress}`);
      // We could block the IP or the accounts here
      // await prisma.deviceLog.updateMany({ where: { ipAddress }, data: { isBlocked: true }});
    }

  } catch (error) {
    console.error('Error logging device access:', error);
    throw error;
  }
}

import { NextResponse } from 'next/server';
import { getFinancialConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await getFinancialConfig();
    return NextResponse.json({
      success: true,
      activationFeeKES: config.activationFeeKES,
      currency: 'KES',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, activationFeeKES: 200, currency: 'KES' },
      { status: 200 }
    );
  }
}

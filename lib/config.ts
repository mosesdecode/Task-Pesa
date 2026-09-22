import { prisma } from './prisma';

export interface FinancialConfig {
  activationFeeKES: number;
  adminActivationEarningKES: number;
  referralRewardKES: number;
  platformRetainedAmountKES: number;
}

const DEFAULT_FINANCIAL_CONFIG: FinancialConfig = {
  activationFeeKES: 200,
  adminActivationEarningKES: 100,
  referralRewardKES: 100,
  platformRetainedAmountKES: 100,
};

/**
 * Retrieves the current financial and activation fee configuration from database settings.
 * Backend is the authoritative source of truth.
 */
export async function getFinancialConfig(): Promise<FinancialConfig> {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            'ACTIVATION_FEE_KES',
            'ADMIN_ACTIVATION_EARNING_KES',
            'REFERRAL_REWARD_KES',
            'PLATFORM_RETAINED_AMOUNT_KES',
          ],
        },
      },
    });

    const config: FinancialConfig = { ...DEFAULT_FINANCIAL_CONFIG };

    for (const setting of settings) {
      const val = parseFloat(setting.value);
      if (!isNaN(val) && val >= 0) {
        if (setting.key === 'ACTIVATION_FEE_KES') config.activationFeeKES = val;
        if (setting.key === 'ADMIN_ACTIVATION_EARNING_KES') config.adminActivationEarningKES = val;
        if (setting.key === 'REFERRAL_REWARD_KES') config.referralRewardKES = val;
        if (setting.key === 'PLATFORM_RETAINED_AMOUNT_KES') config.platformRetainedAmountKES = val;
      }
    }

    return config;
  } catch (error) {
    console.error('Error reading financial config from database, using defaults:', error);
    return DEFAULT_FINANCIAL_CONFIG;
  }
}

/**
 * Updates financial configuration settings in the database.
 * Only administrators can call this.
 */
export async function updateFinancialConfig(
  adminId: string,
  newConfig: Partial<FinancialConfig>
): Promise<FinancialConfig> {
  const updates: { key: string; value: string; description: string }[] = [];

  if (typeof newConfig.activationFeeKES === 'number') {
    updates.push({
      key: 'ACTIVATION_FEE_KES',
      value: newConfig.activationFeeKES.toString(),
      description: 'One-time platform activation fee in KES paid by new users',
    });
  }

  if (typeof newConfig.adminActivationEarningKES === 'number') {
    updates.push({
      key: 'ADMIN_ACTIVATION_EARNING_KES',
      value: newConfig.adminActivationEarningKES.toString(),
      description: 'Platform/Admin revenue portion earned from each confirmed activation payment in KES',
    });
  }

  if (typeof newConfig.referralRewardKES === 'number') {
    updates.push({
      key: 'REFERRAL_REWARD_KES',
      value: newConfig.referralRewardKES.toString(),
      description: 'Referral reward in KES credited to the referrer upon confirmed activation',
    });
  }

  if (typeof newConfig.platformRetainedAmountKES === 'number') {
    updates.push({
      key: 'PLATFORM_RETAINED_AMOUNT_KES',
      value: newConfig.platformRetainedAmountKES.toString(),
      description: 'Remaining platform retained reserve in KES for unreferred activations',
    });
  }

  for (const item of updates) {
    await prisma.systemSetting.upsert({
      where: { key: item.key },
      create: item,
      update: { value: item.value, description: item.description },
    });
  }

  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action: 'UPDATE_FINANCIAL_CONFIG',
      targetType: 'SYSTEM_SETTINGS',
      detailsJson: JSON.stringify(newConfig),
    },
  });

  return await getFinancialConfig();
}

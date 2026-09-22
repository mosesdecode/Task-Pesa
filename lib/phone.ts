/**
 * Safaricom & Kenyan Phone Utilities for TaskMint
 */

export function normalizeKenyanPhone(input: string): string {
  if (!input) return '';
  // Remove all non-digit and non-plus characters
  let cleaned = input.replace(/[^\d+]/g, '');

  // If starts with +254
  if (cleaned.startsWith('+254')) {
    return cleaned;
  }

  // If starts with 254
  if (cleaned.startsWith('254')) {
    return `+${cleaned}`;
  }

  // If starts with 07 or 01 (10 digits total)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+254${cleaned.substring(1)}`;
  }

  // If starts with 7 or 1 (9 digits total)
  if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) {
    return `+254${cleaned}`;
  }

  return cleaned;
}

export function isValidKenyanPhone(input: string): boolean {
  const normalized = normalizeKenyanPhone(input);
  // Must match +254 followed by 7 or 1, then 8 digits
  return /^\+254[71]\d{8}$/.test(normalized);
}

/**
 * Validates if the phone number belongs to Safaricom network:
 * Prefixes:
 * 0700 - 0729 (70X, 71X, 72X)
 * 0740 - 0743, 0745, 0746, 0748
 * 0757 - 0759
 * 0768 - 0769
 * 0790 - 0799 (79X)
 * 0110 - 0115
 */
export function isSafaricomNumber(input: string): boolean {
  const normalized = normalizeKenyanPhone(input);
  if (!isValidKenyanPhone(normalized)) return false;

  const prefix = normalized.substring(4, 7); // 3 digits after +254

  // Check 07X range (represented as 7XX)
  const safaricomPrefixes = [
    // 700 - 709
    '700', '701', '702', '703', '704', '705', '706', '707', '708', '709',
    // 710 - 719
    '710', '711', '712', '713', '714', '715', '716', '717', '718', '719',
    // 720 - 729
    '720', '721', '722', '723', '724', '725', '726', '727', '728', '729',
    // 740 - 748
    '740', '741', '742', '743', '745', '746', '748',
    // 757 - 759
    '757', '758', '759',
    // 768 - 769
    '768', '769',
    // 790 - 799
    '790', '791', '792', '793', '794', '795', '796', '797', '798', '799',
    // 0110 - 0115 (110 - 115)
    '110', '111', '112', '113', '114', '115'
  ];

  return safaricomPrefixes.includes(prefix);
}

export function formatKenyanPhoneDisplay(input: string): string {
  const normalized = normalizeKenyanPhone(input);
  if (!isValidKenyanPhone(normalized)) return input;
  // Format as +254 7XX XXX XXX
  return `${normalized.substring(0, 4)} ${normalized.substring(4, 7)} ${normalized.substring(7, 10)} ${normalized.substring(10)}`;
}

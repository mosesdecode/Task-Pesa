/**
 * Safaricom & Kenyan Phone Utilities for TaskMint
 *
 * Validates Kenyan mobile subscriber numbers by shape:
 * Accepts:
 * - 07XXXXXXXX or 01XXXXXXXX (10 digits starting with 0)
 * - 2547XXXXXXXX or 2541XXXXXXXX (12 digits starting with 254)
 * - +2547XXXXXXXX or +2541XXXXXXXX (13 characters)
 * - Strips all spaces, dashes, dots, and parentheses
 * - Accepts all valid mobile blocks: 07XX, 010X, 011X, 014X, 018X, etc.
 */

export function normalizeKenyanPhone(input: string): string {
  if (!input) return '';
  // Remove spaces, hyphens, brackets, dots
  let d = input.replace(/[\s\-().]/g, '').trim();

  // Strip leading plus
  if (d.startsWith('+')) d = d.slice(1);

  // If starts with 254, check if there's an accidental zero (e.g. 2540712...)
  if (d.startsWith('254')) {
    d = d.slice(3);
    if (d.startsWith('0')) d = d.slice(1);
  } else if (d.startsWith('0')) {
    d = d.slice(1);
  }

  // A valid Kenyan mobile subscriber number is 9 digits starting with 7 or 1
  if (/^[71]\d{8}$/.test(d)) {
    return `+254${d}`;
  }

  return input.trim();
}

export function isValidKenyanPhone(input: string): boolean {
  if (!input) return false;
  const normalized = normalizeKenyanPhone(input);
  // Must match +254 followed by 7 or 1 and exactly 8 more digits
  return /^\+254[71]\d{8}$/.test(normalized);
}

/**
 * Validates if the phone number is a valid Kenyan mobile line.
 * Uses structural shape validation (7XXXXXXXX or 1XXXXXXXX) to support all
 * allocated Safaricom & Kenyan mobile ranges (07XX, 010X, 011X, 014X, 018X, etc.)
 */
export function isSafaricomNumber(input: string): boolean {
  return isValidKenyanPhone(input);
}

export function formatKenyanPhoneDisplay(input: string): string {
  const normalized = normalizeKenyanPhone(input);
  if (!isValidKenyanPhone(normalized)) return input;
  // Format as +254 7XX XXX XXX or +254 1XX XXX XXX
  return `${normalized.substring(0, 4)} ${normalized.substring(4, 7)} ${normalized.substring(7, 10)} ${normalized.substring(10)}`;
}

/**
 * Returns plain 254XXXXXXXXX (no +) for Daraja / M-Pesa APIs
 */
export function toDarajaPhone(input: string): string {
  const normalized = normalizeKenyanPhone(input);
  if (normalized.startsWith('+')) return normalized.slice(1);
  return normalized;
}

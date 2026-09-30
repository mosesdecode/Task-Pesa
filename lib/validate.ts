/**
 * Input validation helpers for Social Links and Banners
 */

const BLOCKED_SCHEMES = ['javascript:', 'data:', 'vbscript:', 'file:'];

export function validateSocialUrl(platform: string, url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = url.trim();
  if (trimmed.length > 2048) {
    return { valid: false, error: 'URL exceeds maximum length of 2048 characters' };
  }

  const lower = trimmed.toLowerCase();
  for (const scheme of BLOCKED_SCHEMES) {
    if (lower.startsWith(scheme)) {
      return { valid: false, error: `Invalid URL scheme (${scheme})` };
    }
  }

  const allowedPrefixes = ['https://', 'mailto:', 'tel:'];
  const hasAllowedPrefix = allowedPrefixes.some((prefix) => lower.startsWith(prefix));

  if (!hasAllowedPrefix) {
    return { valid: false, error: 'URL must start with https://, mailto:, or tel:' };
  }

  return { valid: true };
}

export function validateBannerUrl(url: string | null | undefined): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return { valid: true }; // Banner image or link URL can be optional in some contexts
  }

  const trimmed = url.trim();
  if (trimmed.length > 2048) {
    return { valid: false, error: 'URL exceeds maximum length of 2048 characters' };
  }

  const lower = trimmed.toLowerCase();
  for (const scheme of BLOCKED_SCHEMES) {
    if (lower.startsWith(scheme)) {
      return { valid: false, error: `Invalid URL scheme (${scheme})` };
    }
  }

  // Allow relative URLs starting with / or absolute https://
  if (!lower.startsWith('/') && !lower.startsWith('https://')) {
    return { valid: false, error: 'URL must start with https:// or a relative path starting with /' };
  }

  return { valid: true };
}

export function sanitizeText(str: string | null | undefined, maxLen: number = 500): string {
  if (!str || typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

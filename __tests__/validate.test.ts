import { validateSocialUrl, validateBannerUrl, sanitizeText } from '../lib/validate';

export function runValidateTests() {
  console.log('🧪 Running Validation Tests...');

  // 1. Social URL Validation
  const validWa = validateSocialUrl('whatsapp', 'https://chat.whatsapp.com/test12345');
  console.assert(validWa.valid === true, 'Valid WA link should pass');

  const validMail = validateSocialUrl('email', 'mailto:support@taskpesa.co.ke');
  console.assert(validMail.valid === true, 'mailto link should pass');

  const validTel = validateSocialUrl('phone', 'tel:+254700000000');
  console.assert(validTel.valid === true, 'tel link should pass');

  const jsInjected = validateSocialUrl('custom', 'javascript:alert(1)');
  console.assert(jsInjected.valid === false, 'javascript: scheme should be blocked');

  const dataInjected = validateSocialUrl('custom', 'data:text/html,<script>alert(1)</script>');
  console.assert(dataInjected.valid === false, 'data: scheme should be blocked');

  const vbInjected = validateSocialUrl('custom', 'vbscript:msgbox(1)');
  console.assert(vbInjected.valid === false, 'vbscript: scheme should be blocked');

  const tooLong = validateSocialUrl('custom', 'https://' + 'a'.repeat(2050));
  console.assert(tooLong.valid === false, 'URL exceeding 2048 chars should be blocked');

  // 2. Banner URL Validation
  const validRelBanner = validateBannerUrl('/register');
  console.assert(validRelBanner.valid === true, 'Relative path /register should pass');

  const validAbsBanner = validateBannerUrl('https://images.unsplash.com/photo-12345');
  console.assert(validAbsBanner.valid === true, 'Absolute https image should pass');

  const jsBanner = validateBannerUrl('javascript:alert("hacked")');
  console.assert(jsBanner.valid === false, 'javascript: banner URL should be blocked');

  const invalidSchemeBanner = validateBannerUrl('ftp://example.com/image.png');
  console.assert(invalidSchemeBanner.valid === false, 'ftp: scheme banner URL should be blocked');

  // 3. Sanitization
  const sanitized = sanitizeText('   Hello World   ', 5);
  console.assert(sanitized === 'Hello', 'sanitizeText should trim and limit length');

  console.log('✅ Validation Tests Passed!');
}

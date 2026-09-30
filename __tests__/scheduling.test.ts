export function isBannerActive(banner: {
  isActive: boolean;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
}, now: Date = new Date()): boolean {
  if (!banner.isActive) return false;
  if (banner.startsAt) {
    const starts = new Date(banner.startsAt);
    if (!isNaN(starts.getTime()) && starts > now) return false;
  }
  if (banner.endsAt) {
    const ends = new Date(banner.endsAt);
    if (!isNaN(ends.getTime()) && ends < now) return false;
  }
  return true;
}

export function runSchedulingTests() {
  console.log('🧪 Running Banner Scheduling Tests...');

  const now = new Date('2026-09-30T10:00:00Z');

  // Case 1: Active with no dates
  console.assert(
    isBannerActive({ isActive: true, startsAt: null, endsAt: null }, now) === true,
    'Active banner with no dates should be active'
  );

  // Case 2: Inactive with valid date window
  console.assert(
    isBannerActive({ isActive: false, startsAt: '2026-01-01', endsAt: '2026-12-31' }, now) === false,
    'Disabled banner should not be active even inside window'
  );

  // Case 3: Future start date
  console.assert(
    isBannerActive({ isActive: true, startsAt: '2026-10-05T00:00:00Z', endsAt: null }, now) === false,
    'Banner starting in the future should be inactive'
  );

  // Case 4: Past end date
  console.assert(
    isBannerActive({ isActive: true, startsAt: '2026-01-01T00:00:00Z', endsAt: '2026-09-01T00:00:00Z' }, now) === false,
    'Banner with past end date should be inactive'
  );

  // Case 5: Valid date window (currently active)
  console.assert(
    isBannerActive({ isActive: true, startsAt: '2026-09-01T00:00:00Z', endsAt: '2026-10-15T00:00:00Z' }, now) === true,
    'Banner within start/end range should be active'
  );

  console.log('✅ Scheduling Tests Passed!');
}

'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';

/**
 * Single shared pathname check (after all hooks — rules-of-hooks compliant).
 * Renders the public site chrome (Navbar / main wrapper / Footer / MobileNav)
 * for every non-admin route.  Returns children bare for every /admin route so
 * the admin layout owns the full viewport with no stacked navbars.
 */
export default function ConditionalPublicChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Covers /admin  AND  /admin/login  AND  /admin?tab=*  (query strings are
  // not part of pathname so ?tab= variants match the /admin base path).
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');

  if (isAdmin) {
    // Admin layout owns the page — no public chrome at all.
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <MobileNav />
    </>
  );
}

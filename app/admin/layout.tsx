import { cookies } from 'next/headers';
import { getAdminTokenPayload } from '@/lib/jwt';
import AdminSidebarClient from './AdminSidebarClient';
import { Suspense } from 'react';
import InactivityTimeout from '@/components/InactivityTimeout';

// SECURITY NOTE: This layout reads the auth cookie to suppress the sidebar
// before authentication resolves — UI convenience only.
// middleware.ts is the actual security gate and enforces ADMIN-only access
// on every request, independently of this layout check.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token =
    cookieStore.get('taskmint_token')?.value ??
    cookieStore.get('taskpesa_token')?.value;

  const adminPayload = await getAdminTokenPayload(token);

  // Not authed or not admin — render children only.
  // page.tsx will show its own spinner / "Go to Admin Login" screen.
  if (!adminPayload) {
    return <>{children}</>;
  }

  // Authenticated admin: sidebar shell + children.
  // Only a string (adminEmail) crosses the server→client boundary.
  // navItems with icon component references live entirely in AdminSidebarClient.
  return (
    <>
      <InactivityTimeout
        warningMinutes={14}
        timeoutMinutes={15}
        redirectUrl="/admin/login"
      />
      <div className="admin-shell min-h-screen bg-dark-950 text-slate-100 flex items-start font-sans">
      <Suspense fallback={
        <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-dark-950 border-r border-dark-800/90 z-30 p-5"></aside>
      }>
        <AdminSidebarClient adminEmail={adminPayload.email} />
      </Suspense>
      {children}
    </div>
    </>
  );
}

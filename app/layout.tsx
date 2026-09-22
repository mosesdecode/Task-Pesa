import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'TaskMint — Digital Micro-Work and Opportunity Marketplace',
  description:
    'Earn money by completing legitimate digital tasks, data annotation, sponsored campaigns, and microtasks in Kenya. Fast payouts.',
  keywords: ['TaskMint', 'Kenyan Microtasks', 'Data Annotation Kenya', 'Earn Money Online Kenya', 'Micro Work'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-dark-900 text-slate-100 flex flex-col min-h-screen selection:bg-brand-500 selection:text-dark-900">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
        <MobileNav />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import './globals.css';
import ConditionalPublicChrome from './ConditionalPublicChrome';
import { ThemeProvider } from '@/components/ThemeProvider';
import PWARegister from '@/components/PWARegister';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#00C853' },
    { media: '(prefers-color-scheme: dark)', color: '#050B12' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Task Mint — Global Work Space',
  description:
    'Earn money by completing legitimate digital tasks, data annotation, sponsored campaigns, and microtasks in Kenya. Fast payouts.',
  keywords: ['TaskMint', 'Kenyan Microtasks', 'Data Annotation Kenya', 'Earn Money Online Kenya', 'Micro Work'],
  manifest: '/manifest.json',
  applicationName: 'TaskMint',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TaskMint',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth" data-theme="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('taskmint_theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');document.documentElement.setAttribute('data-theme','light');document.documentElement.style.colorScheme='light';}else{document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');document.documentElement.style.colorScheme='dark';}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col min-h-screen selection:bg-brand-500 selection:text-dark-900">
        <ThemeProvider>
          <PWARegister />
          <ConditionalPublicChrome>{children}</ConditionalPublicChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}

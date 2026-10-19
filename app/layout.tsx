import type { Metadata } from 'next';
import './globals.css';
import ConditionalPublicChrome from './ConditionalPublicChrome';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Task Mint — Global Work Space',
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
    <html lang="en" className="dark scroll-smooth" data-theme="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('taskmint_theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');document.documentElement.setAttribute('data-theme','light');document.documentElement.style.colorScheme='light';}else{document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');document.documentElement.style.colorScheme='dark';}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col min-h-screen selection:bg-brand-500 selection:text-dark-900">
        <ThemeProvider>
          <ConditionalPublicChrome>{children}</ConditionalPublicChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}

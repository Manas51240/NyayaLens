import type { Metadata, Viewport } from 'next';
import { Inter, Newsreader } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { LegalDisclaimerBanner } from '@/components/common/LegalDisclaimerBanner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NYAYALENS | Grounded AI Legal Document Understanding Platform',
  description:
    'Understand your legal documents. Know what matters. Take the next safe step. Grounded GenAI analysis, Legal Risk Radar, and consultation briefs without replacing professional legal advice.',
  keywords: [
    'legal document analysis',
    'contract review',
    'AI legal assistant',
    'risk radar',
    'contract comparison',
    'legal tech',
    'plain language legal',
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full scroll-smooth ${inter.variable} ${newsreader.variable}`}>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-100 selection:text-amber-950 font-sans antialiased">
        {/* Skip to Main Content for Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>

        {/* Global Legal Notice Banner */}
        <LegalDisclaimerBanner />

        {/* Global Header */}
        <Navbar />

        {/* Main Content Area */}
        <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
          {children}
        </main>

        {/* Global Footer */}
        <Footer />
      </body>
    </html>
  );
}

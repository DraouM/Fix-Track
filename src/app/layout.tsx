
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AppLayout from '@/components/AppLayout';
import { ClientProviders } from '@/components/ClientProviders';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FixTrack - Repair Shop Management',
  description: 'Manage phone repairs and inventory efficiently with FixTrack.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"> {/* Removed suppressHydrationWarning from here */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning // Added suppressHydrationWarning here to target extension attribute changes
      >
        <ClientProviders>
          <AppLayout>
            {children}
          </AppLayout>
        </ClientProviders>
      </body>
    </html>
  );
}

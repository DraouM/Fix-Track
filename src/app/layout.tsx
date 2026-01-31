import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/print.css";
import { AppLayout } from "@/components/layout/AppLayout";
import { SettingsProvider } from "@/context/SettingsContext";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { LicenseProvider } from "@/context/LicenseContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FixTrack - Inventory & Repair Management",
  description: "Comprehensive inventory and repair management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning={true}>
        <SettingsProvider>
          <I18nProvider>
            <LicenseProvider>
              <AppLayout>{children}</AppLayout>
            </LicenseProvider>
          </I18nProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}

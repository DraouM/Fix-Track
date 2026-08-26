import type { Metadata } from "next";
import "./globals.css";
import "../styles/print.css";
import { AppLayout } from "@/components/layout/AppLayout";
import { SettingsProvider } from "@/context/SettingsContext";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { LicenseProvider } from "@/context/LicenseContext";
import { Updater } from "@/components/Updater";

export const metadata: Metadata = {
  title: "FixTrack - Inventory & Repair Management",
  description: "Comprehensive inventory and repair management system",
  icons: {
    icon: "/images/logo_1.png",
    shortcut: "/images/logo_1.png",
    apple: "/images/logo_1.png",
  },
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
              <Updater />
            </LicenseProvider>
          </I18nProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrackGuard DHR — Gangman Logbook",
  description: "Offline track hazard inspection tool for Darjeeling Himalayan Railway",
  applicationName: "TrackGuard DHR",
  appleWebApp: {
    capable: true,
    title: "TrackGuard DHR",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f131a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0f131a] text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
        {/* <!-- Debashish: SW registration here --> */}
        <div className="flex-1 w-full flex flex-col">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}

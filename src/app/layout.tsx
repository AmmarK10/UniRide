import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DeveloperBadge from "@/components/DeveloperBadge";
import { UnreadProvider } from "@/context/UnreadContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UniRide - Share Rides with Fellow Students",
  description: "Connect with verified university students, share rides, and make your commute better.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UnreadProvider>
          {children}
          <DeveloperBadge />
        </UnreadProvider>
      </body>
    </html>
  );
}

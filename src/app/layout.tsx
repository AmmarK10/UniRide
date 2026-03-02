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
          <div className="flex-1 flex flex-col min-h-screen">
            {children}
          </div>
          <footer className="w-full py-6 mt-auto text-center border-t border-slate-200 bg-white">
            <p className="text-sm text-slate-500 mb-1">
              Contact this email in case of any bugs or flaws with the website:
            </p>
            <a href="mailto:uni.ride.nine@gmail.com" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
              uni.ride.nine@gmail.com
            </a>
          </footer>
          <DeveloperBadge />
        </UnreadProvider>
      </body>
    </html>
  );
}

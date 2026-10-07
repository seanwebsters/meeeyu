import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "VoysNote", template: "%s · VoysNote" },
  description: "30 seconds a day from the world's most interesting people.",
  applicationName: "VoysNote",
  appleWebApp: { capable: true, title: "VoysNote", statusBarStyle: "black-translucent" },
  openGraph: {
    title: "VoysNote",
    description: "30 seconds a day from the world's most interesting people.",
    siteName: "VoysNote",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0c0b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${bricolage.variable}`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}

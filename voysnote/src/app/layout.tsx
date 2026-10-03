import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "VoysNote", template: "%s · VoysNote" },
  description: "30 seconds a day from the world's most interesting people.",
  applicationName: "VoysNote",
  appleWebApp: { capable: true, title: "VoysNote", statusBarStyle: "default" },
  openGraph: {
    title: "VoysNote",
    description: "30 seconds a day from the world's most interesting people.",
    siteName: "VoysNote",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3eee5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${serif.variable}`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}

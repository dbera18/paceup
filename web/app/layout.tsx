import type { Metadata, Viewport } from "next";
import { Geist, Newsreader } from "next/font/google";
import AppShell from "@/components/shell/AppShell";
import "./globals.css";

// Interface font: clean and modern.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Headline and story font: an elegant, readable serif.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "PaceUp: Every Step Has a Purpose",
  description: "A community where people share the reason behind their runs and workouts.",
};

export const viewport: Viewport = {
  viewportFit: "cover", // lets the bottom bar sit above the iPhone home indicator
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#121010" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-bg font-sans text-text">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

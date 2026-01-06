import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Padepokan Satria Pinayungan Ragas Grenyang - Organisasi Pencak Silat",
  description: "Padepokan Satria Pinayungan Ragas Grenyang adalah organisasi pencak silat yang menjunjung tinggi nilai-nilai budaya, persaudaraan, dan ketegasan. Bergabunglah dengan kami untuk mempelajari seni bela diri tradisional Indonesia.",
  keywords: ["Padepokan", "Pencak Silat", "Satria Pinayungan", "Ragas Grenyang", "Martial Arts", "Beladiri", "Budaya Indonesia"],
  authors: [{ name: "Padepokan Satria Pinayungan Ragas Grenyang" }],
  icons: {
    icon: "/padepokan-logo.png",
  },
  openGraph: {
    title: "Padepokan Satria Pinayungan Ragas Grenyang",
    description: "Organisasi pencak silat dengan nilai-nilai luhur dan tradisional",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Padepokan Satria Pinayungan Ragas Grenyang",
    description: "Organisasi pencak silat dengan nilai-nilai luhur dan tradisional",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <Sonner position="top-center" richColors />
      </body>
    </html>
  );
}

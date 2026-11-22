import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { firma } from "@/config/firma";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: `${firma.nazov} – ${firma.podtitul}`,
  description: "Výkopy, základy, ryhy, odvoz zeminy a dovoz materiálu. Nakonfiguruj si prácu a hneď uvidíš cenu.",
};

export const viewport: Viewport = { themeColor: "#f4f3f1" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sk" className={`${geist.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}

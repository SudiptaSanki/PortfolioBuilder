import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Folio Hub — Open Source Portfolio Templates for Every Profession",
  description: "Browse 10+ free, professionally designed portfolio templates for developers, designers, chefs, musicians, and more. Open source. Any tech stack. Deploy in minutes.",
  keywords: ["portfolio templates", "free portfolio", "open source", "developer portfolio", "designer portfolio", "HTML templates", "Next.js", "React"],
  openGraph: {
    title: "Folio Hub — Open Source Portfolio Templates",
    description: "A growing collection of 1000+ free portfolio templates for every profession and tech stack.",
    type: "website",
    url: "https://github.com/SudiptaSanki/PortfolioBuilder",
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

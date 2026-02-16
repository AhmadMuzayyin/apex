import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "APEX - Academic Performance Excellence",
    template: "%s | APEX"
  },
  description: "Sistem manajemen nilai, absensi, dan prestasi siswa berbasis tahun akademik. Platform lengkap untuk tracking perkembangan siswa secara real-time.",
  keywords: ["APEX", "sistem akademik", "manajemen nilai", "absensi siswa", "tracking prestasi", "tahun akademik", "e-learning"],
  authors: [{ name: "APEX Team" }],
  creator: "APEX Team",
  publisher: "APEX",
  applicationName: "APEX",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    title: "APEX - Academic Performance Excellence",
    description: "Sistem manajemen nilai, absensi, dan prestasi siswa berbasis tahun akademik",
    siteName: "APEX",
  },
  twitter: {
    card: "summary_large_image",
    title: "APEX - Academic Performance Excellence",
    description: "Sistem manajemen nilai, absensi, dan prestasi siswa",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <meta name="theme-color" content="#009485" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="APEX" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

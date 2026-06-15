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
  title: "ReMatch — ตลาดซื้อขายเสื้อกีฬาของแท้",
  description: "ตลาดซื้อขายเสื้อกีฬาของแท้ที่ไว้วางใจได้ Seller ทุกคนผ่านการยืนยันตัวตน เงินปลอดภัยด้วยระบบ Escrow คืนเงินเต็มหากสินค้าไม่ตรงปก",
  openGraph: {
    title: "ReMatch — ตลาดซื้อขายเสื้อกีฬาของแท้",
    description: "ตลาดซื้อขายเสื้อกีฬาของแท้ที่ไว้วางใจได้ Seller ทุกคนผ่านการยืนยันตัวตน เงินปลอดภัยด้วยระบบ Escrow คืนเงินเต็มหากสินค้าไม่ตรงปก",
    url: "https://rematch-co.com",
    siteName: "ReMatch",
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReMatch — ตลาดซื้อขายเสื้อกีฬาของแท้",
    description: "ตลาดซื้อขายเสื้อกีฬาของแท้ที่ไว้วางใจได้ Seller ทุกคนผ่านการยืนยันตัวตน คืนเงินเต็มหากสินค้าไม่ตรงปก",
  },
  metadataBase: new URL("https://rematch-co.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

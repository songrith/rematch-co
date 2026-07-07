import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/app/components/ClientProviders";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "ReMatch — ตลาดซื้อขายเสื้อบอล เสื้อบาส เสื้อกีฬา Retro ของแท้",
  description: "ช้อปเสื้อบอล เสื้อบาส และ Retro Jersey ของแท้ 100% จาก Verified Seller ที่ผ่านการยืนยันตัวตน ระบบ Escrow คุ้มครองเงินทุกออเดอร์ — คืนเงินเต็มหากสินค้าไม่ตรงปก Admin ตรวจสอบทุกรายการก่อนอนุมัติ",
  keywords: ["เสื้อบอลของแท้", "เสื้อกีฬา", "เสื้อบาส", "retro jersey", "เสื้อฟุตบอล", "ซื้อขายเสื้อกีฬา", "verified seller", "escrow"],
  openGraph: {
    title: "ReMatch — ตลาดซื้อขายเสื้อกีฬาของแท้ที่ปลอดภัยที่สุดในไทย",
    description: "ช้อปเสื้อบอล เสื้อบาส และ Retro Jersey ของแท้ 100% จาก Verified Seller ที่ผ่านการยืนยันตัวตน ระบบ Escrow คุ้มครองเงินทุกออเดอร์ — คืนเงินเต็มหากสินค้าไม่ตรงปก Admin ตรวจสอบทุกรายการก่อนอนุมัติ",
    url: "https://rematch-co.com",
    siteName: "ReMatch",
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReMatch — ตลาดซื้อขายเสื้อกีฬาของแท้ที่ปลอดภัยที่สุดในไทย",
    description: "ช้อปเสื้อบอล เสื้อบาส และ Retro Jersey ของแท้ 100% จาก Verified Seller ระบบ Escrow คุ้มครองทุกออเดอร์ คืนเงินเต็มหากสินค้าไม่ตรงปก",
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
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}

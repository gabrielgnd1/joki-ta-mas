import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JOKITAMAS — Joki War Tiket Konser",
  description:
    "Jasa joki war tiket konser. Isi form pemesanan, cek status pesanan, dan lihat pricelist.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}

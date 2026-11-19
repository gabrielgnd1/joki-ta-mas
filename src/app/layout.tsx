import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Form Order Joki Tiket — 2S & MnG",
  description:
    "Form order jasa joki tiket 2-Shot (2S) dan Meet & Greet (MnG). Pilih member, lengkapi data akun JKT48, lalu kirim pesanan via WhatsApp.",
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

import { SERVICE_LABEL } from "./members";
import { formatRupiah } from "./format";
import type { OrderItem } from "./types";

/**
 * Item untuk pesan WhatsApp. Pakai `OrderItem` hasil hitung server
 * (sudah berisi `subtotal` + `priceLabel` tersimpan di database) supaya
 * pesan yang diterima admin selalu sama dengan total di panel.
 */
export type WaCartItem = OrderItem;

/**
 * Susun pesan WhatsApp berisi rincian pesanan (format sama dengan form
 * statis, ditambah kode pesanan agar admin bisa mencocokkan dengan panel).
 */
export function buildOrderWhatsAppUrl({
  phoneNumber,
  orderCode,
  customerName,
  accountType,
  jktEmail,
  jktPassword,
  items,
}: {
  phoneNumber: string;
  orderCode: string;
  customerName: string;
  accountType: string;
  jktEmail: string;
  jktPassword: string;
  items: WaCartItem[];
}): string {
  let grandTotal = 0;
  let totalTickets = 0;

  const itemLines = items.map((item, idx) => {
    grandTotal += item.subtotal;
    totalTickets += item.qty;

    const details = [
      `*${idx + 1}. ${item.nickname} (${item.fullName})*`,
      `   • Layanan: ${SERVICE_LABEL[item.serviceType]} (${item.team})`,
      item.sessionNote ? `   • Sesi/Jalur: ${item.sessionNote}` : null,
      `   • Detail: ${item.priceLabel}`,
      `   • Biaya Jasa: *${formatRupiah(item.subtotal)}*`,
    ].filter(Boolean);

    return details.join("\n");
  });

  const messageLines = [
    `*ORDER JASA JOKI TIKET (2S / MnG)*`,
    `================================`,
    `*Kode Pesanan:* ${orderCode}`,
    `*Nama Pemesan:* ${customerName}`,
    `*Status Akun:* ${accountType}`,
    `*Email JKT48:* ${jktEmail}`,
    `*Password JKT48:* ${jktPassword}`,
    `*Total Pesanan:* ${items.length} item (${totalTickets} tiket)`,
    `================================`,
    ``,
    ...itemLines,
    ``,
    `================================`,
    `*GRAND TOTAL BIAYA JASA: ${formatRupiah(grandTotal)}*`,
    ``,
    `Halo admin, mohon konfirmasi ketersediaan slot untuk pesanan di atas. Terima kasih!`,
  ];

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(messageLines.join("\n"))}`;
}

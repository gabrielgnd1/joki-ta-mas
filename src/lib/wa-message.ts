import { calculateItemCost, findMember, SERVICE_LABEL } from "./members";
import { formatRupiah } from "./format";
import type { ServiceType } from "./types";

export type WaCartItem = {
  serviceType: ServiceType;
  team: string;
  nickname: string;
  fullName: string;
  qty: number;
  sessionNote: string;
};

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
    const member = findMember(item.team, item.nickname);
    const { subtotal, detailText } = member
      ? calculateItemCost(member, item.serviceType, item.qty)
      : { subtotal: 0, detailText: `${item.qty} tiket` };

    grandTotal += subtotal;
    totalTickets += item.qty;

    const details = [
      `*${idx + 1}. ${item.nickname} (${item.fullName})*`,
      `   • Layanan: ${SERVICE_LABEL[item.serviceType]} (${item.team})`,
      item.sessionNote ? `   • Sesi/Jalur: ${item.sessionNote}` : null,
      `   • Detail: ${detailText}`,
      `   • Biaya Jasa: *${formatRupiah(subtotal)}*`,
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

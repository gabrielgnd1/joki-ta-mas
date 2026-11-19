export type OrderStatus =
  | "pending"
  | "review"
  | "verified"
  | "completed"
  | "cancelled";

export type Role = "admin" | "verifier";

export type ServiceType = "2S" | "MnG";

/** Satu baris keranjang pesanan (disimpan sebagai JSON di `service_orders.items`). */
export type OrderItem = {
  serviceType: ServiceType;
  team: string;
  nickname: string;
  fullName: string;
  qty: number;
  sessionNote: string;
  /** Hasil hitung server saat pesanan dibuat. */
  subtotal: number;
  /** Label harga saat pesanan dibuat, mis. "3 tiket (Paket 1–4 tiket)". */
  priceLabel: string;
};

export type ServiceOrderRow = {
  id: number;
  code: string;
  items: string;
  item_count: number;
  ticket_count: number;
  total: number;
  service_types: string;
  customer_name: string;
  account_type: string;
  jkt_email: string;
  jkt_password: string;
  status: OrderStatus;
  verified_by: string | null;
  verified_at: string | null;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
};

export type UserRow = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  active: number;
  created_at: string;
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Menunggu Pembayaran",
  review: "Menunggu Verifikasi",
  verified: "Pembayaran Valid",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  review: "bg-violet-50 text-violet-700 border-violet-200",
  verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-sky-50 text-sky-700 border-sky-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

/** Parse kolom `items` (JSON) dengan aman. */
export function parseOrderItems(json: string): OrderItem[] {
  try {
    const parsed = JSON.parse(json || "[]");
    return Array.isArray(parsed) ? (parsed as OrderItem[]) : [];
  } catch {
    return [];
  }
}

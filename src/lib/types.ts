export type OrderStatus =
  | "pending"
  | "review"
  | "verified"
  | "completed"
  | "cancelled";

export type Role = "admin" | "verifier";

export type SectionRow = {
  id: number;
  event_id: number;
  code: string;
  price: number;
  is_open: number;
  sort: number;
};

export type EventRow = {
  id: number;
  name: string;
  venue: string | null;
  show_at: string | null;
  is_active: number;
  max_tickets: number;
};

export type OrderRow = {
  id: number;
  code: string;
  event_id: number;
  event_name: string;
  show_at: string | null;
  ticket_type: string;
  section_code: string;
  section_price: number;
  qty: number;
  total: number;
  backup_sections: string;
  full_name: string;
  x_username: string;
  email: string;
  whatsapp: string;
  nik: string;
  gender: string;
  birth_date: string;
  payment_method: string;
  note: string | null;
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

export const PAYMENT_LABEL: Record<string, string> = {
  QRIS: "QRIS",
};

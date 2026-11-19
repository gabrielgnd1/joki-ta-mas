import { formatRupiah } from "./format";
import type { ServiceType } from "./types";

/**
 * Katalog member JKT48 + tarif jasa (2S / MnG).
 *
 * Modul ini dipakai BERSAMA oleh halaman publik (client) dan API orders
 * (server). Harga TIDAK pernah dipercaya dari client — server selalu
 * menghitung ulang lewat `calculateItemCost` berdasarkan katalog ini.
 */

export type Member = {
  nickname: string;
  fullName: string;
  price2s: number;
  mngLow: number;
  mngHigh: number;
};

export type MemberGroup = {
  team: string;
  members: Member[];
};

export const MEMBER_TEAMS: MemberGroup[] = [
  {
    team: "TEAM LOVE",
    members: [
      { nickname: "Elin", fullName: "Celline Thefani", price2s: 50000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Anin", fullName: "Anindya Ramadhani", price2s: 60000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Lia", fullName: "Aurellia", price2s: 60000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Cynthia", fullName: "Cynthia Yaputera", price2s: 60000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Nayla", fullName: "Nayla Suji", price2s: 60000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Lana", fullName: "Aurhel Alana", price2s: 70000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Fritzy", fullName: "Fritzy Rosmerian", price2s: 70000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Gracie", fullName: "Grace Octaviani", price2s: 70000, mngLow: 30000, mngHigh: 40000 },
      { nickname: "Trisha", fullName: "Jazzlyn Trisha", price2s: 70000, mngLow: 30000, mngHigh: 40000 },
      { nickname: "Lily", fullName: "Hillary Abigail", price2s: 80000, mngLow: 30000, mngHigh: 40000 },
      { nickname: "Indah", fullName: "Indah Cahya", price2s: 80000, mngLow: 30000, mngHigh: 40000 },
      { nickname: "Michie", fullName: "Michelle Alexandra", price2s: 80000, mngLow: 30000, mngHigh: 40000 },
      { nickname: "Fiony", fullName: "Fiony Alveria", price2s: 90000, mngLow: 30000, mngHigh: 40000 },
    ],
  },
  {
    team: "TEAM DREAM",
    members: [
      { nickname: "Eli", fullName: "Helisma Putri", price2s: 40000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Jesslyn", fullName: "Jesslyn Elly", price2s: 50000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Olla", fullName: "Febriola Sinambela", price2s: 60000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Nala", fullName: "Shabilqis Naila", price2s: 60000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Greesel", fullName: "Greesella Adhalia", price2s: 70000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Nina", fullName: "Nina Tutachia", price2s: 70000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Ella", fullName: "Gabriela Abigail", price2s: 80000, mngLow: 30000, mngHigh: 40000 },
      { nickname: "Delynn", fullName: "Adeline Wijaya", price2s: 90000, mngLow: 30000, mngHigh: 40000 },
      { nickname: "Gita", fullName: "Gita Sekar Andarini", price2s: 90000, mngLow: 30000, mngHigh: 40000 },
      { nickname: "Marsha", fullName: "Marsha Lenathea", price2s: 90000, mngLow: 40000, mngHigh: 50000 },
      { nickname: "Oline", fullName: "Oline Manuel", price2s: 90000, mngLow: 40000, mngHigh: 50000 },
      { nickname: "Freya", fullName: "Freya Jayawardana", price2s: 100000, mngLow: 40000, mngHigh: 50000 },
    ],
  },
  {
    team: "TEAM PASSION",
    members: [
      { nickname: "Dena", fullName: "Dena Natalia", price2s: 50000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Desy", fullName: "Desy Natalia", price2s: 50000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Levi", fullName: "Michelle Levia", price2s: 60000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Raisha", fullName: "Raisha Syifa", price2s: 60000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Ribka", fullName: "Ribka Budiman", price2s: 60000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Oniel", fullName: "Cornelia Vanisa", price2s: 70000, mngLow: 30000, mngHigh: 40000 },
      { nickname: "Jessi", fullName: "Jessica Chandra", price2s: 70000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Kathrin", fullName: "Kathrina Irene", price2s: 70000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Lulu", fullName: "Lulu Salsabila", price2s: 70000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Kimmy", fullName: "Victoria Kimberly", price2s: 70000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Feni", fullName: "Feni Fitriyanti", price2s: 80000, mngLow: 40000, mngHigh: 50000 },
      { nickname: "Muthe", fullName: "Mutiara Azzahra", price2s: 80000, mngLow: 30000, mngHigh: 40000 },
      { nickname: "Christy", fullName: "Angelina Christy", price2s: 90000, mngLow: 40000, mngHigh: 50000 },
      { nickname: "Aralie", fullName: "Abigail Rachel", price2s: 100000, mngLow: 50000, mngHigh: 60000 },
      { nickname: "Erine", fullName: "Catherina Vallencia", price2s: 100000, mngLow: 50000, mngHigh: 60000 },
    ],
  },
  {
    team: "TRAINEE",
    members: [
      { nickname: "Virgi", fullName: "Astrella Virgiananda", price2s: 70000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Ekin", fullName: "Jacqueline Immanuela", price2s: 70000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Jemima", fullName: "Jemima Evodie", price2s: 70000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Intan", fullName: "Nur Intan", price2s: 70000, mngLow: 20000, mngHigh: 30000 },
      { nickname: "Fera", fullName: "Afera Thalia", price2s: 40000, mngLow: 15000, mngHigh: 20000 },
      { nickname: "Rilly", fullName: "Bong Aprilli", price2s: 40000, mngLow: 15000, mngHigh: 20000 },
      { nickname: "Carissa", fullName: "Carissa Dini", price2s: 40000, mngLow: 15000, mngHigh: 20000 },
      { nickname: "Bella", fullName: "Christabella Bonita", price2s: 40000, mngLow: 15000, mngHigh: 20000 },
      { nickname: "Fahira", fullName: "Fahira Putri", price2s: 40000, mngLow: 15000, mngHigh: 20000 },
      { nickname: "Rara", fullName: "Fatimah Azzahra", price2s: 40000, mngLow: 15000, mngHigh: 20000 },
      { nickname: "Hagia", fullName: "Hagia Sopia", price2s: 40000, mngLow: 15000, mngHigh: 20000 },
      { nickname: "Heidi", fullName: "Heidi Suyangga", price2s: 40000, mngLow: 15000, mngHigh: 20000 },
      { nickname: "Ira", fullName: "Humaira Ramadhani", price2s: 40000, mngLow: 15000, mngHigh: 20000 },
      { nickname: "Maxine", fullName: "Maxine Faye", price2s: 40000, mngLow: 15000, mngHigh: 20000 },
      { nickname: "Mika", fullName: "Mikaela Kusjanto", price2s: 40000, mngLow: 15000, mngHigh: 20000 },
      { nickname: "Jazy", fullName: "Putry Jazyta", price2s: 40000, mngLow: 15000, mngHigh: 20000 },
      { nickname: "Ralyne", fullName: "Ralyne Van Irwan", price2s: 40000, mngLow: 15000, mngHigh: 20000 },
      { nickname: "Sona", fullName: "Sona Kalyana", price2s: 40000, mngLow: 15000, mngHigh: 20000 },
    ],
  },
];

/** Cari member berdasarkan tim + nickname. */
export function findMember(
  team: string,
  nickname: string,
): Member | null {
  const group = MEMBER_TEAMS.find((g) => g.team === team);
  if (!group) return null;
  return group.members.find((m) => m.nickname === nickname) ?? null;
}

/**
 * Hitung biaya jasa satu item (server & client memakai fungsi ini):
 * - 2S  : tarif flat per member, selalu 1 tiket.
 * - MnG : tarif paket flat — 1–4 tiket pakai `mngLow`, 5–20 tiket `mngHigh`
 *         (tidak dikalikan jumlah tiket).
 */
export function calculateItemCost(
  member: Member,
  serviceType: ServiceType,
  qty: number,
): { subtotal: number; detailText: string } {
  if (serviceType === "2S") {
    return {
      subtotal: member.price2s,
      detailText: `1 tiket (${formatRupiah(member.price2s)})`,
    };
  }

  if (qty >= 5) {
    return {
      subtotal: member.mngHigh,
      detailText: `${qty} tiket (Paket 5–20 tiket)`,
    };
  }
  return {
    subtotal: member.mngLow,
    detailText: `${qty} tiket (Paket 1–4 tiket)`,
  };
}

/** Nama tampilan layanan. */
export const SERVICE_LABEL: Record<ServiceType, string> = {
  "2S": "2-Shot (2S)",
  MnG: "Meet & Greet (MnG)",
};

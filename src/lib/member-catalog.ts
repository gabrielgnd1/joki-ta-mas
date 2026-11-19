import "server-only";

import { getDb } from "./db";
import { MEMBER_TEAMS, type Member, type MemberGroup } from "./members";

/**
 * Katalog member dari database (tabel `member_catalog`).
 *
 * Harga diedit lewat /admin/katalog, jadi halaman ini dan API orders selalu
 * membaca nilai terbaru tanpa perlu deploy. Seed awal berasal dari
 * `MEMBER_TEAMS` di `src/lib/members.ts` (lihat `seed()` di `db.ts`).
 */

export type CatalogRow = {
  id: number;
  team: string;
  nickname: string;
  fullName: string;
  price2s: number;
  mngLow: number;
  mngHigh: number;
  sort: number;
};

type RawRow = {
  id: number;
  team: string;
  nickname: string;
  full_name: string;
  price_2s: number;
  mng_low: number;
  mng_high: number;
  sort: number;
};

/** Semua baris katalog, urut sesuai tampilan di form (tim → member). */
export async function getCatalogRows(): Promise<CatalogRow[]> {
  const db = await getDb();
  const result = await db.execute(
    "SELECT id, team, nickname, full_name, price_2s, mng_low, mng_high, sort FROM member_catalog ORDER BY sort ASC, id ASC",
  );

  const rows = (result.rows as unknown as RawRow[]).map((row) => ({
    id: Number(row.id),
    team: row.team,
    nickname: row.nickname,
    fullName: row.full_name,
    price2s: Number(row.price_2s),
    mngLow: Number(row.mng_low),
    mngHigh: Number(row.mng_high),
    sort: Number(row.sort),
  }));

  // Fallback aman: kalau tabel masih kosong (mis. seed gagal), pakai seed kode.
  if (rows.length === 0) {
    return MEMBER_TEAMS.flatMap((group, groupIndex) =>
      group.members.map((member, memberIndex) => ({
        id: groupIndex * 1000 + memberIndex + 1,
        team: group.team,
        nickname: member.nickname,
        fullName: member.fullName,
        price2s: member.price2s,
        mngLow: member.mngLow,
        mngHigh: member.mngHigh,
        sort: groupIndex * 1000 + memberIndex,
      })),
    );
  }

  return rows;
}

/** Katalog ter-group per tim — bentuk yang dipakai form pemesanan. */
export async function getMemberCatalog(): Promise<MemberGroup[]> {
  const rows = await getCatalogRows();
  const groups: MemberGroup[] = [];
  const byTeam = new Map<string, MemberGroup>();

  for (const row of rows) {
    let group = byTeam.get(row.team);
    if (!group) {
      group = { team: row.team, members: [] };
      byTeam.set(row.team, group);
      groups.push(group);
    }
    const member: Member = {
      nickname: row.nickname,
      fullName: row.fullName,
      price2s: row.price2s,
      mngLow: row.mngLow,
      mngHigh: row.mngHigh,
    };
    group.members.push(member);
  }

  return groups;
}

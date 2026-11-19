import { requireAdmin } from "@/lib/auth";
import { getCatalogRows, type CatalogRow } from "@/lib/member-catalog";
import { saveMemberCatalogAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  saved?: string | string[];
  error?: string | string[];
}>;

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) || "";
}

type TeamGroup = { team: string; rows: CatalogRow[] };

function groupByTeam(rows: CatalogRow[]): TeamGroup[] {
  const groups: TeamGroup[] = [];
  const byTeam = new Map<string, TeamGroup>();
  for (const row of rows) {
    let group = byTeam.get(row.team);
    if (!group) {
      group = { team: row.team, rows: [] };
      byTeam.set(row.team, group);
      groups.push(group);
    }
    group.rows.push(row);
  }
  return groups;
}

const HEADERS = [
  { key: "2s", label: "2-Shot (2S)", hint: "1 tiket" },
  { key: "l4", label: "MnG Paket 1–4", hint: "flat" },
  { key: "h20", label: "MnG Paket 5–20", hint: "flat" },
] as const;

export default async function AdminCatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const params = await searchParams;
  const saved = param(params.saved) === "1";
  const hasError = param(params.error) === "invalid";

  const groups = groupByTeam(await getCatalogRows());
  const totalMembers = groups.reduce((sum, group) => sum + group.rows.length, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            Katalog Member &amp; Harga
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {totalMembers} member · {groups.length} tim. Harga berlaku untuk
            pesanan baru dan langsung tampil di halaman utama — tidak perlu
            deploy.
          </p>
        </div>
        <button
          type="submit"
          form="catalogForm"
          className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(225,29,72,0.9)] transition hover:bg-rose-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
        >
          Simpan Harga
        </button>
      </div>

      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          ✅ Harga tersimpan dan sudah berlaku di halaman utama.
        </div>
      )}
      {hasError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          ⚠️ Harga tidak valid. Masukkan angka bulat 0–10.000.000 di setiap
          kolom, lalu simpan lagi.
        </div>
      )}

      <form
        id="catalogForm"
        action={saveMemberCatalogAction}
        className="space-y-5"
      >
        {groups.map((group) => (
          <div key={group.team} className="card p-5">
            <h2 className="section-title">{group.team}</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] font-bold tracking-wide text-slate-400 uppercase">
                    <th className="py-2 pr-3">Member</th>
                    {HEADERS.map((header) => (
                      <th key={header.key} className="px-2 py-2 text-right">
                        {header.label}
                        <span className="block text-[10px] font-semibold text-slate-300 normal-case">
                          {header.hint}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-2 pr-3">
                        <span className="font-bold text-slate-800">
                          {row.nickname}
                        </span>
                        <span className="block text-xs text-slate-400">
                          {row.fullName}
                        </span>
                      </td>
                      {HEADERS.map((header) => {
                        const name = `${header.key}:${row.id}`;
                        const value =
                          header.key === "2s"
                            ? row.price2s
                            : header.key === "l4"
                              ? row.mngLow
                              : row.mngHigh;
                        return (
                          <td key={header.key} className="px-2 py-2 text-right">
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={10_000_000}
                              step={1}
                              name={name}
                              defaultValue={value}
                              aria-label={`${header.label} — ${row.nickname}`}
                              className="input w-28 text-right font-semibold"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">
            Harga lama tidak berubah untuk pesanan yang sudah masuk — panel
            selalu menampilkan harga saat pesanan dibuat.
          </p>
          <button
            type="submit"
            className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(225,29,72,0.9)] transition hover:bg-rose-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
          >
            Simpan Harga
          </button>
        </div>
      </form>
    </div>
  );
}

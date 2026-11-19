import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveSettingsAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSettings();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
          Pengaturan Situs
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Nomor WhatsApp dipakai form order untuk mengirim rincian pesanan ke
          admin.
        </p>
      </div>

      <form action={saveSettingsAction} className="space-y-4">
        <div className="card p-5">
          <h2 className="section-title">Status Pemesanan</h2>
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="orders_open"
              defaultChecked={settings.orders_open === "1"}
              className="mt-0.5 h-4 w-4 accent-rose-600"
            />
            <span>
              <span className="font-semibold text-slate-900">
                Buka pemesanan
              </span>
              <span className="block text-xs text-slate-500">
                Jika dimatikan, form order menampilkan pemberitahuan dan tombol
                kirim dinonaktifkan.
              </span>
            </span>
          </label>
          <div className="mt-4">
            <label className="label" htmlFor="announcement">
              Pengumuman (opsional)
            </label>
            <textarea
              id="announcement"
              name="announcement"
              defaultValue={settings.announcement}
              className="input min-h-20"
              placeholder="Contoh: Slot MnG tinggal 3 hari lagi."
            />
            <p className="hint">
              Tampil sebagai baris di atas form order pada halaman utama.
            </p>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="section-title">Jenis Akun yang Diterima</h2>
          <p className="mt-2 text-xs text-slate-500">
            Nonaktifkan salah satu jenis akun jika pemesanan untuk jenis
            tersebut sedang ditutup. Pesanan lama tidak terpengaruh.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm">
              <input
                type="checkbox"
                name="ticket_ofc_enabled"
                defaultChecked={settings.ticket_ofc_enabled === "1"}
                className="mt-0.5 h-4 w-4 accent-rose-600"
              />
              <span>
                <span className="font-semibold text-slate-900">
                  Akun OFC (Official Fan Club)
                </span>
                <span className="block text-xs text-slate-500">
                  Pemesan dengan status akun OFC.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm">
              <input
                type="checkbox"
                name="ticket_general_enabled"
                defaultChecked={settings.ticket_general_enabled === "1"}
                className="mt-0.5 h-4 w-4 accent-rose-600"
              />
              <span>
                <span className="font-semibold text-slate-900">
                  Akun Non-OFC (Regular)
                </span>
                <span className="block text-xs text-slate-500">
                  Pemesan tanpa keanggotaan OFC.
                </span>
              </span>
            </label>
          </div>
          {settings.ticket_ofc_enabled !== "1" &&
            settings.ticket_general_enabled !== "1" && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                Kedua jenis akun sedang nonaktif. Pemesan tidak bisa mengirim
                pesanan sampai salah satunya diaktifkan.
              </p>
            )}
        </div>

        <div className="card p-5">
          <h2 className="section-title">Identitas &amp; Kontak Situs</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="site_name">
                Nama Situs
              </label>
              <input
                id="site_name"
                name="site_name"
                defaultValue={settings.site_name}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="site_tagline">
                Tagline
              </label>
              <input
                id="site_tagline"
                name="site_tagline"
                defaultValue={settings.site_tagline}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="wa_number">
                Nomor WhatsApp Admin
              </label>
              <input
                id="wa_number"
                name="wa_number"
                defaultValue={settings.wa_number}
                className="input font-mono"
                placeholder="628xxxxxxxxxx"
              />
              <p className="hint">
                Tujuan tombol “Kirim Semua Pesanan ke WhatsApp”.
              </p>
            </div>
            <div>
              <label className="label" htmlFor="wa_number_2">
                Nomor WhatsApp Cadangan (opsional)
              </label>
              <input
                id="wa_number_2"
                name="wa_number_2"
                defaultValue={settings.wa_number_2 || ""}
                className="input font-mono"
                placeholder="628xxxxxxxxxx"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="x_username">
                Username X
              </label>
              <input
                id="x_username"
                name="x_username"
                defaultValue={settings.x_username}
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(225,29,72,0.9)] transition hover:bg-rose-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
          >
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
}

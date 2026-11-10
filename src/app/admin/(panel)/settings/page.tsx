import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveSettingsAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = getSettings();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
          Pembayaran &amp; Pengaturan
        </h1>
        <p className="mt-1 text-sm text-slate-500">
Informasi pembayaran QRIS dan pengaturan yang tampil ke pemesan.
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
              className="mt-0.5 h-4 w-4 accent-sky-600"
            />
            <span>
              <span className="font-semibold text-slate-900">
                Buka pemesanan
              </span>
              <span className="block text-xs text-slate-500">
                Jika dimatikan, form pemesanan akan menampilkan “War sedang
                ditutup”.
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
              placeholder="Contoh: War dibuka 10 menit sebelum penjualan."
            />
          </div>
        </div>

        <div className="card p-5">
          <h2 className="section-title">Pembayaran QRIS</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="qris_merchant">
                Nama Merchant QRIS
              </label>
              <input
                id="qris_merchant"
                name="qris_merchant"
                defaultValue={settings.qris_merchant}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="qris_nmid">
                NMID QRIS
              </label>
              <input
                id="qris_nmid"
                name="qris_nmid"
                defaultValue={settings.qris_nmid}
                className="input font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="qris_image">
                Gambar QRIS (path atau URL)
              </label>
              <input
                id="qris_image"
                name="qris_image"
                defaultValue={settings.qris_image}
                className="input font-mono"
                placeholder="/qris.jpg atau https://..."
              />
              <p className="hint">
                Letakkan file di <code>public/qris.jpg</code> atau isi dengan URL
                gambar QRIS.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="qris_note">
                Catatan QRIS
              </label>
              <textarea
                id="qris_note"
                name="qris_note"
                defaultValue={settings.qris_note}
                className="input min-h-20"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="payment_note">
                Catatan Pembayaran
              </label>
              <textarea
                id="payment_note"
                name="payment_note"
                defaultValue={settings.payment_note}
                className="input min-h-20"
              />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="section-title">Identitas Situs</h2>
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
            <div>
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
            <div className="sm:col-span-2">
              <label className="label" htmlFor="terms">
                Syarat &amp; Ketentuan (satu baris = satu poin)
              </label>
              <textarea
                id="terms"
                name="terms"
                defaultValue={settings.terms}
                className="input min-h-32"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary">
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
}

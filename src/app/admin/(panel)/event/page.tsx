import { requireAdmin } from "@/lib/auth";
import { getActiveEvent, getSections } from "@/lib/orders";
import { saveEventAction, saveSectionAction } from "@/app/actions/admin";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

function toDatetimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const formatted = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return formatted.replace(" ", "T");
}

export default async function AdminEventPage() {
  await requireAdmin();
  const event = await getActiveEvent();

  if (!event) {
    return (
      <div className="card p-8 text-center text-sm text-slate-500">
        Belum ada event. Buat event lewat database terlebih dahulu.
      </div>
    );
  }

  const sections = await getSections(event.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
          Event &amp; Harga
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Perubahan langsung tampil di halaman pemesanan dan pricelist.
        </p>
      </div>

      <form action={saveEventAction} className="card p-5">
        <h2 className="section-title">Detail Event</h2>
        <input type="hidden" name="id" value={event.id} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">
              Nama Event
            </label>
            <input
              id="name"
              name="name"
              defaultValue={event.name}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="venue">
              Venue / Kota
            </label>
            <input
              id="venue"
              name="venue"
              defaultValue={event.venue || ""}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="show_at">
              Jadwal Show
            </label>
            <input
              id="show_at"
              name="show_at"
              type="datetime-local"
              defaultValue={toDatetimeLocal(event.show_at)}
              className="input"
            />
            <p className="hint">Waktu Jakarta (WIB).</p>
          </div>
          <div>
            <label className="label" htmlFor="max_tickets">
              Maksimal Tiket per Pesanan
            </label>
            <input
              id="max_tickets"
              name="max_tickets"
              type="number"
              min={1}
              max={10}
              defaultValue={event.max_tickets}
              className="input"
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={event.is_active === 1}
                className="h-4 w-4 accent-sky-600"
              />
              Event aktif (tampil di situs)
            </label>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button type="submit" className="btn-primary">
            Simpan Event
          </button>
        </div>
      </form>

      <div className="card p-5">
        <h2 className="section-title">Section &amp; Fee Joki</h2>
        <p className="mt-2 text-xs text-slate-500">
          Harga dalam Rupiah. Nonaktifkan section jika sudah habis/ditutup.
        </p>

        <div className="mt-4 space-y-2">
          {sections.map((section) => (
            <form
              key={section.id}
              action={saveSectionAction}
              className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 p-3"
            >
              <input type="hidden" name="id" value={section.id} />
              <div className="w-20">
                <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Section
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {section.code}
                </div>
              </div>
              <div className="flex-1">
                <label className="label mb-1 text-xs">Fee per Tiket</label>
                <input
                  name="price"
                  type="number"
                  min={0}
                  step={1000}
                  defaultValue={section.price}
                  className="input py-1.5"
                />
                <div className="mt-1 text-[10px] text-slate-400">
                  {formatRupiah(section.price)} / tiket
                </div>
              </div>
              <label className="flex items-center gap-2 pb-2 text-xs font-medium text-slate-600">
                <input
                  type="checkbox"
                  name="is_open"
                  defaultChecked={section.is_open === 1}
                  className="h-4 w-4 accent-sky-600"
                />
                Tersedia
              </label>
              <button type="submit" className="btn-secondary btn-sm mb-0.5">
                Simpan
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArenaArt } from "@/components/arena-art";
import { getActiveEvent, getSections } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { formatDateLong, formatRupiah } from "@/lib/format";
import { colorForSection } from "@/lib/palette";

export const dynamic = "force-dynamic";

export default function PricelistPage() {
  const event = getActiveEvent();
  const settings = getSettings();
  const sections = event ? getSections(event.id) : [];
  const palette = sections.map((section, index) =>
    colorForSection(section.code, index),
  );

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="container-page py-8 sm:py-10">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-display text-3xl font-extrabold text-white drop-shadow-[0_2px_0_rgba(3,64,102,0.35)] sm:text-4xl">
              Pricelist Joki War
            </h1>
            <p className="mt-1 text-sm text-white/80">
              Fee jasa war per section — belum termasuk harga tiket resmi.
            </p>

            {!event ? (
              <div className="card mt-6 p-8 text-center text-sm text-slate-500">
                Belum ada event aktif.
              </div>
            ) : (
              <>
                <div className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-sky-400 via-sky-500 to-blue-700 p-5 text-white shadow-xl">
                  <ArenaArt className="pointer-events-none absolute -right-10 -bottom-16 w-56 opacity-70" />
                  <div className="relative">
                    <div className="text-[10px] font-extrabold tracking-[0.18em] text-white/70 uppercase">
                      Event Aktif
                    </div>
                    <div className="mt-1 font-display text-xl font-extrabold">
                      {event.name}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
                      <span className="rounded-full bg-white/20 px-2.5 py-1">
                        📅 {formatDateLong(event.show_at)}
                      </span>
                      {event.venue && (
                        <span className="rounded-full bg-white/20 px-2.5 py-1">
                          📍 {event.venue}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {sections.map((section, index) => {
                    const color = palette[index];
                    return (
                      <div
                        key={section.code}
                        className="flex items-center gap-2 rounded-xl border border-white/50 bg-white/90 px-3 py-2 shadow-sm"
                      >
                        <span
                          className="h-6 w-6 shrink-0 rounded-lg"
                          style={{ backgroundColor: color.color }}
                        />
                        <div className="min-w-0">
                          <div className="truncate text-xs font-extrabold text-slate-800">
                            {section.code}
                          </div>
                          <div className="truncate text-[10px] font-semibold text-slate-500">
                            {formatRupiah(section.price)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="card mt-4 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-left text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
                        <th className="px-4 py-3">Section</th>
                        <th className="px-4 py-3">Fee Joki</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sections.map((section, index) => {
                        const color = palette[index];
                        return (
                          <tr
                            key={section.code}
                            className="border-b border-slate-100 last:border-0"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-7 w-7 rounded-lg"
                                  style={{ backgroundColor: color.color }}
                                />
                                <span className="font-extrabold text-slate-900">
                                  {section.code}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-extrabold text-slate-900">
                              {formatRupiah(section.price)}
                              <span className="text-xs font-medium text-slate-400">
                                {" "}
                                / tiket
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={
                                  section.is_open
                                    ? "badge border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "badge border-red-200 bg-red-50 text-red-500"
                                }
                              >
                                {section.is_open ? "Tersedia" : "Tutup"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 rounded-2xl border border-white/50 bg-white/90 p-4 text-xs leading-relaxed text-slate-600 shadow-sm">
                  <p className="font-extrabold text-slate-800">Catatan</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4">
                    <li>
                      Fee di atas adalah biaya jasa war, belum termasuk harga
                      tiket resmi.
                    </li>
                    <li>Maksimal {event.max_tickets} tiket per pesanan.</li>
                    <li>
                      Section cadangan dapat dipilih saat mengisi form untuk
                      mengantisipasi section utama habis.
                    </li>
                    <li>
                      Pembayaran hanya melalui QRIS, diverifikasi manual oleh
                      admin.
                    </li>
                  </ul>
                </div>

                <div className="mt-6 flex gap-2">
                  <Link href="/" className="btn-primary">
                    Buat Pesanan
                  </Link>
                  <a
                    href={`https://wa.me/${settings.wa_number.replace(
                      /[^0-9]/g,
                      "",
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                  >
                    Hubungi Admin
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

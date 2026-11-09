import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StatusBadge } from "@/components/status-badge";
import { ProofUploader } from "@/components/proof-uploader";
import { getOrderByCode } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { formatDateLong, formatDateTime, formatRupiah } from "@/lib/format";
import { colorForSection } from "@/lib/palette";
import { PAYMENT_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ code?: string | string[] }>;

export default async function CekPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const rawCode = Array.isArray(params.code) ? params.code[0] : params.code;
  const code = (rawCode || "").trim();
  const settings = getSettings();
  const order = code ? getOrderByCode(code) : null;
  const sectionPalette = order ? colorForSection(order.section_code) : null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="container-page py-8 sm:py-10">
          <div className="mx-auto max-w-2xl">
            <h1 className="font-display text-3xl font-extrabold text-white drop-shadow-[0_2px_0_rgba(3,64,102,0.35)]">
              Cek Pesanan
            </h1>
            <p className="mt-1 text-sm text-white/80">
              Masukkan kode pesanan untuk melihat status dan mengunggah bukti
              transfer.
            </p>

            <form
              action="/cek"
              method="get"
              className="card mt-5 flex flex-col gap-2 p-3 sm:flex-row"
            >
              <input
                name="code"
                defaultValue={code}
                placeholder="Contoh: JTM-8F3K2A"
                className="input flex-1 font-mono uppercase"
                autoComplete="off"
              />
              <button type="submit" className="btn-primary shrink-0">
                Cari Pesanan
              </button>
            </form>

            {code && !order && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm">
                Kode pesanan{" "}
                <span className="font-mono font-bold">{code}</span> tidak
                ditemukan. Periksa kembali kode dari halaman setelah pemesanan.
              </div>
            )}

            {order && (
              <div className="mt-5 space-y-4">
                <div className="card overflow-hidden">
                  <div className="bg-gradient-to-r from-sky-600 to-blue-700 px-5 py-4 text-white">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-extrabold tracking-[0.16em] text-sky-100/80 uppercase">
                          Kode Pesanan
                        </div>
                        <div className="font-mono text-xl font-extrabold tracking-wider text-amber-300">
                          {order.code}
                        </div>
                        <div className="mt-1 text-[11px] text-sky-100/80">
                          Dibuat {formatDateTime(order.created_at)}
                        </div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>

                  <div className="p-5">
                    <StatusTimeline status={order.status} />

                    <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
                      <Row label="Event" value={order.event_name} />
                      <Row label="Jadwal" value={formatDateLong(order.show_at)} />
                      <Row label="Tipe Tiket" value={order.ticket_type} />
                      <div>
                        <dt className="text-xs text-slate-500">Section</dt>
                        <dd className="mt-0.5 flex items-center gap-1.5 font-bold text-slate-900">
                          {sectionPalette && (
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: sectionPalette.color }}
                            />
                          )}
                          {order.section_code} · {order.qty} tiket
                        </dd>
                      </div>
                      <Row
                        label="Metode Pembayaran"
                        value={
                          PAYMENT_LABEL[order.payment_method] ||
                          order.payment_method
                        }
                      />
                      <Row label="Nama Pemesan" value={order.full_name} />
                    </dl>

                    <div className="mt-4 flex items-center justify-between rounded-xl bg-sky-50 px-4 py-3">
                      <span className="text-sm font-bold text-sky-900">
                        Total Tagihan
                      </span>
                      <span className="font-display text-2xl font-extrabold text-sky-700">
                        {formatRupiah(order.total)}
                      </span>
                    </div>
                  </div>
                </div>

                <PaymentInstructions
                  method={order.payment_method}
                  settings={settings}
                />

                {order.status !== "cancelled" && (
                  <div className="card p-5">
                    <h2 className="font-display text-lg font-extrabold text-slate-900">
                      Bukti Transfer
                    </h2>
                    {order.proof_file ? (
                      <div className="mt-2 space-y-2">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                          Bukti sudah diunggah pada{" "}
                          {formatDateTime(order.proof_uploaded_at)}.
                          {order.status === "pending"
                            ? " Menunggu pemeriksaan admin."
                            : ""}
                        </div>
                        <a
                          href={`/api/proof/${encodeURIComponent(order.code)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-sm font-bold text-sky-700 hover:underline"
                        >
                          Lihat bukti yang diunggah →
                        </a>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-slate-500">
                        Belum ada bukti transfer. Unggah screenshot/foto bukti
                        transfer di bawah ini.
                      </p>
                    )}
                    <div className="mt-3">
                      <ProofUploader code={order.code} />
                    </div>
                  </div>
                )}

                {order.verified_at && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm">
                    ✅ Pembayaran diverifikasi oleh{" "}
                    <span className="font-bold">{order.verified_by}</span> pada{" "}
                    {formatDateTime(order.verified_at)}.
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://wa.me/${settings.wa_number.replace(
                      /[^0-9]/g,
                      "",
                    )}?text=${encodeURIComponent(
                      `Halo admin, saya ingin menanyakan pesanan ${order.code}.`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                  >
                    Hubungi Admin
                  </a>
                  <Link href="/" className="btn-ghost text-white hover:bg-white/15 hover:text-white">
                    Buat Pesanan Baru
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-bold text-slate-900">{value}</dd>
    </div>
  );
}

function PaymentInstructions({
  method,
  settings,
}: {
  method: string;
  settings: Record<string, string>;
}) {
  const bcaSelected = method === "BCA";
  return (
    <div className="card p-5">
      <h2 className="font-display text-lg font-extrabold text-slate-900">
        Instruksi Pembayaran
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        {settings.payment_note}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div
          className={[
            "rounded-2xl border-2 p-3 transition",
            bcaSelected
              ? "border-sky-400 bg-sky-50/60"
              : "border-slate-200 bg-white",
          ].join(" ")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0060af] text-[10px] font-extrabold text-white">
                BCA
              </span>
              <span className="text-xs font-bold text-slate-600">
                Transfer BCA
              </span>
            </div>
            {bcaSelected && (
              <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[9px] font-extrabold text-white uppercase">
                Dipilih
              </span>
            )}
          </div>
          <div className="mt-2 font-mono text-base font-extrabold text-slate-900">
            {settings.bank_account}
          </div>
          <div className="text-xs text-slate-500">
            {settings.bank_name} a.n. {settings.bank_holder}
          </div>
        </div>

        <div
          className={[
            "rounded-2xl border-2 p-3 transition",
            !bcaSelected
              ? "border-sky-400 bg-sky-50/60"
              : "border-slate-200 bg-white",
          ].join(" ")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00aed6] text-[10px] font-extrabold text-white">
                GO
              </span>
              <span className="text-xs font-bold text-slate-600">
                Transfer GoPay
              </span>
            </div>
            {!bcaSelected && (
              <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[9px] font-extrabold text-white uppercase">
                Dipilih
              </span>
            )}
          </div>
          <div className="mt-2 font-mono text-base font-extrabold text-slate-900">
            {settings.gopay_number}
          </div>
          <div className="text-xs text-slate-500">
            GoPay a.n. {settings.gopay_holder}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusTimeline({ status }: { status: string }) {
  const steps = [
    { key: "pending", label: "Pesanan dibuat" },
    { key: "review", label: "Bukti diunggah" },
    { key: "verified", label: "Pembayaran diverifikasi" },
    { key: "completed", label: "Selesai" },
  ];
  const index = steps.findIndex((step) => step.key === status);

  if (status === "cancelled") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
        Pesanan ini dibatalkan.
      </div>
    );
  }

  return (
    <ol className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
      {steps.map((step, i) => {
        const done = i <= index;
        return (
          <li key={step.key} className="flex items-center gap-1.5">
            <span
              className={[
                "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold",
                done
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-200 text-slate-500",
              ].join(" ")}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={
                done ? "font-bold text-slate-700" : "font-medium text-slate-400"
              }
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

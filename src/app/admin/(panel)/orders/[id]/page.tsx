import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOrderById } from "@/lib/orders";
import { formatDate, formatDateLong, formatDateTime, formatRupiah } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import {
  saveOrderNoteAction,
  updateOrderStatusAction,
} from "@/app/actions/admin";
import { PAYMENT_LABEL, STATUS_LABEL, type OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const order = getOrderById(Number(id));
  if (!order) notFound();

  const backups = JSON.parse(order.backup_sections || "[]") as string[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-xs text-slate-400 hover:text-slate-600">
            ← Kembali ke daftar pesanan
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="font-mono text-xl font-extrabold tracking-wider text-slate-900">
              {order.code}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Dibuat {formatDateTime(order.created_at)} · Diperbarui{" "}
            {formatDateTime(order.updated_at)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Total Tagihan
          </div>
          <div className="font-display text-xl font-extrabold text-sky-700">
            {formatRupiah(order.total)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <h2 className="section-title">Detail Tiket</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <Field label="Event" value={order.event_name} />
              <Field label="Jadwal" value={formatDateLong(order.show_at)} />
              <Field label="Tipe Penjualan" value={order.ticket_type} />
              <Field
                label="Section Utama"
                value={`${order.section_code} · ${order.qty} tiket`}
              />
              <Field
                label="Harga per Tiket"
                value={formatRupiah(order.section_price)}
              />
              <Field
                label="Section Cadangan"
                value={backups.length ? backups.join(", ") : "-"}
              />
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="section-title">Data Identitas</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <Field label="Nama Lengkap" value={order.full_name} />
              <Field label="Username X / No. WA" value={order.x_username} />
              <Field label="Email" value={order.email} />
              <Field label="WhatsApp" value={order.whatsapp} />
              <Field label="Nomor Identitas" value={order.nik} mono />
              <Field label="Jenis Kelamin" value={order.gender} />
              <Field label="Tanggal Lahir" value={formatDate(order.birth_date)} />
              <Field
                label="Metode Pembayaran"
                value={PAYMENT_LABEL[order.payment_method] || order.payment_method}
              />
            </dl>
            {order.note && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Catatan Pemesan
                </div>
                <p className="mt-1 whitespace-pre-line">{order.note}</p>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="section-title">Bukti Transfer</h2>
            <p className="mt-2 text-sm text-slate-500">
              Bukti transfer dikirim pemesan ke admin melalui WhatsApp. Cocokkan
              nominal dan tujuan transfer sebelum menekan tombol verifikasi.
            </p>
          </div>

          <div className="card p-5">
            <h2 className="section-title">Catatan Internal</h2>
            <form action={saveOrderNoteAction} className="mt-3 space-y-2">
              <input type="hidden" name="id" value={order.id} />
              <textarea
                name="internal_note"
                defaultValue={order.internal_note || ""}
                placeholder="Catatan untuk tim (tidak terlihat oleh pemesan)"
                className="input min-h-24"
              />
              <div className="flex justify-end">
                <button type="submit" className="btn-secondary btn-sm">
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="section-title">Verifikasi Manual</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Cocokkan nominal dan tujuan transfer dengan bukti yang dikirim
              pemesan via WhatsApp. Status berubah hanya setelah tombol di bawah
              ditekan.
            </p>

            <div className="mt-4 space-y-2">
              {(order.status === "pending" || order.status === "review") && (
                <StatusButton
                  id={order.id}
                  status="verified"
                  label="✓ Verifikasi Pembayaran"
                  className="btn-primary w-full"
                />
              )}
              {order.status === "verified" && (
                <StatusButton
                  id={order.id}
                  status="completed"
                  label="Tandai Selesai"
                  className="btn-primary w-full"
                />
              )}
              {(order.status === "pending" || order.status === "review") && (
                <StatusButton
                  id={order.id}
                  status="cancelled"
                  label="Batalkan Pesanan"
                  className="btn-danger w-full"
                />
              )}
              {order.status === "completed" && (
                <StatusButton
                  id={order.id}
                  status="verified"
                  label="Kembalikan ke Valid"
                  className="btn-secondary w-full"
                />
              )}
              {order.status === "cancelled" && (
                <StatusButton
                  id={order.id}
                  status="pending"
                  label="Aktifkan Kembali"
                  className="btn-secondary w-full"
                />
              )}
            </div>

            {order.verified_at && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                Diverifikasi oleh{" "}
                <span className="font-semibold">{order.verified_by}</span>
                <br />
                {formatDateTime(order.verified_at)}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="section-title">Ubah Status Manual</h2>
            <form action={updateOrderStatusAction} className="mt-3 space-y-2">
              <input type="hidden" name="id" value={order.id} />
              <select
                name="status"
                defaultValue={order.status}
                className="input"
              >
                {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((key) => (
                  <option key={key} value={key}>
                    {STATUS_LABEL[key]}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-secondary w-full">
                Simpan Status
              </button>
            </form>
          </div>

          <div className="card p-5 text-sm">
            <h2 className="section-title">Kontak Cepat</h2>
            <div className="mt-3 space-y-2">
              <a
                href={`https://wa.me/${order.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary w-full"
              >
                Chat WhatsApp
              </a>
              <a
                href={`mailto:${order.email}`}
                className="btn-ghost w-full"
              >
                Kirim Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
        {label}
      </dt>
      <dd
        className={[
          "mt-0.5 text-sm font-medium text-slate-900",
          mono ? "font-mono" : "",
        ].join(" ")}
      >
        {value || "-"}
      </dd>
    </div>
  );
}

function StatusButton({
  id,
  status,
  label,
  className,
}: {
  id: number;
  status: OrderStatus;
  label: string;
  className: string;
}) {
  return (
    <form action={updateOrderStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}

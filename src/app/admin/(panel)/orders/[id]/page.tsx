import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getServiceOrderById } from "@/lib/service-orders";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { SecretField } from "@/components/secret-field";
import {
  saveOrderNoteAction,
  updateOrderStatusAction,
} from "@/app/actions/admin";
import {
  parseOrderItems,
  STATUS_LABEL,
  type OrderStatus,
} from "@/lib/types";
import { SERVICE_LABEL } from "@/lib/members";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const order = await getServiceOrderById(Number(id));
  if (!order) notFound();

  const items = parseOrderItems(order.items);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin"
            className="text-xs text-slate-400 hover:text-slate-600"
          >
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
            Grand Total Biaya Jasa
          </div>
          <div className="font-display text-xl font-extrabold text-rose-700">
            {formatRupiah(order.total)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-extrabold tracking-wide text-slate-800">
                Rincian Pesanan ({order.item_count} item ·{" "}
                {order.ticket_count} tiket)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                    <th className="px-5 py-3">Layanan</th>
                    <th className="px-5 py-3">Member</th>
                    <th className="px-5 py-3">Tim</th>
                    <th className="px-5 py-3">Sesi / Jalur</th>
                    <th className="px-5 py-3 text-right">Biaya</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr
                      key={`${item.nickname}-${index}`}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-3">
                        <span
                          className={[
                            "badge border",
                            item.serviceType === "MnG"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-rose-200 bg-rose-50 text-rose-700",
                          ].join(" ")}
                        >
                          {SERVICE_LABEL[item.serviceType]}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-900">
                          {item.nickname}
                        </div>
                        <div className="text-xs text-slate-400">
                          {item.fullName}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">
                        {item.team}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">
                        <div>{item.sessionNote || "—"}</div>
                        <div className="text-slate-400">{item.priceLabel}</div>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-900">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-8 text-center text-sm text-slate-400"
                      >
                        Rincian item tidak tersedia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="section-title">Data Pemesan &amp; Akun JKT48</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <Field label="Nama Pemesan" value={order.customer_name} />
              <Field label="Status Akun" value={order.account_type} />
              <Field label="Email Akun JKT48" value={order.jkt_email} mono />
              <div>
                <dt className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Password Akun JKT48
                </dt>
                <dd>
                  <SecretField value={order.jkt_password} />
                </dd>
              </div>
            </dl>
            <p className="mt-4 rounded-lg bg-rose-50 p-3 text-xs leading-relaxed text-rose-700">
              ⚠️ Kredensial akun hanya untuk keperluan joki. Jangan dibagikan ke
              pihak lain dan segera logout dari perangkat setelah selesai.
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
            <h2 className="section-title">Proses Pesanan</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Konfirmasi slot &amp; pembayaran dari pemesan secara manual lewat
              WhatsApp. Status hanya berubah setelah tombol ditekan.
            </p>

            <div className="mt-4 space-y-2">
              {(order.status === "pending" || order.status === "review") && (
                <StatusButton
                  id={order.id}
                  status="verified"
                  label="✓ Tandai Sudah Dikonfirmasi"
                  className="w-full rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700"
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
                  label="Kembalikan ke Dikonfirmasi"
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
                Dikonfirmasi oleh{" "}
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
              <select name="status" defaultValue={order.status} className="input">
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
            <h2 className="section-title">Kontak Pemesan</h2>
            <div className="mt-3 space-y-2">
              <a
                href={`mailto:${order.jkt_email}`}
                className="btn-secondary w-full break-all"
              >
                Kirim Email
              </a>
              <p className="text-xs leading-relaxed text-slate-400">
                Form tidak meminta nomor WhatsApp pemesan. Cocokkan chat masuk
                berdasarkan kode <span className="font-mono">{order.code}</span>.
              </p>
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
          "mt-0.5 text-sm font-medium break-all text-slate-900",
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

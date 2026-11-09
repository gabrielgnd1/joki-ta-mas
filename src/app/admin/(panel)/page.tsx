import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getStats, listOrders } from "@/lib/orders";
import { formatDateTime, formatRupiah, timeAgo } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { PAYMENT_LABEL, STATUS_LABEL, type OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string | string[];
  status?: string | string[];
}>;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser();
  const params = await searchParams;
  const q = (Array.isArray(params.q) ? params.q[0] : params.q) || "";
  const status =
    (Array.isArray(params.status) ? params.status[0] : params.status) || "all";

  const stats = getStats();
  const orders = listOrders({ q, status });

  const cards = [
    { label: "Total Pesanan", value: String(stats.total), tone: "text-slate-900" },
    {
      label: "Menunggu Bayar",
      value: String(stats.pending),
      tone: "text-amber-600",
    },
    {
      label: "Perlu Verifikasi",
      value: String(stats.review),
      tone: "text-violet-600",
    },
    {
      label: "Pembayaran Valid",
      value: String(stats.verified),
      tone: "text-emerald-600",
    },
    { label: "Selesai", value: String(stats.completed), tone: "text-sky-600" },
    {
      label: "Pendapatan Valid",
      value: formatRupiah(stats.revenue),
      tone: "text-sky-700",
      small: true,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
          Pesanan
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Verifikasi pembayaran secara manual setelah bukti transfer dicek.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <div key={card.label} className="card p-3">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {card.label}
            </div>
            <div
              className={[
                "mt-1 font-extrabold",
                card.small ? "text-base" : "text-2xl",
                card.tone,
              ].join(" ")}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <form
        action="/admin"
        method="get"
        className="card flex flex-col gap-2 p-3 sm:flex-row sm:items-center"
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari kode, nama, WhatsApp, email..."
          className="input flex-1"
        />
        <select name="status" defaultValue={status} className="input sm:max-w-48">
          <option value="all">Semua status</option>
          {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((key) => (
            <option key={key} value={key}>
              {STATUS_LABEL[key]}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary shrink-0">
          Cari
        </button>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Pemesan</th>
                <th className="px-4 py-3">Tiket</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Pembayaran</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Dibuat</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-xs font-bold text-sky-700 hover:underline"
                    >
                      {order.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {order.full_name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {order.whatsapp}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {order.section_code}
                    </div>
                    <div className="text-xs text-slate-400">
                      {order.qty} tiket · {order.ticket_type}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {formatRupiah(order.total)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {PAYMENT_LABEL[order.payment_method] ||
                      order.payment_method}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    <div>{timeAgo(order.created_at)}</div>
                    <div className="text-slate-400">
                      {formatDateTime(order.created_at)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="btn-secondary btn-sm"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-14 text-center text-sm text-slate-400"
                  >
                    Tidak ada pesanan yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Menampilkan maksimal 200 pesanan terbaru.
      </p>
    </div>
  );
}

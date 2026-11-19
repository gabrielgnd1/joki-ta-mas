import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getServiceStats, listServiceOrders } from "@/lib/service-orders";
import { formatRupiah, timeAgo, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { parseOrderItems, STATUS_LABEL, type OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string | string[];
  status?: string | string[];
}>;

const CARDS = [
  { key: "total", label: "Total Pesanan", tone: "text-slate-900", bar: "bg-slate-400" },
  { key: "pending", label: "Menunggu Bayar", tone: "text-amber-600", bar: "bg-amber-400" },
  { key: "review", label: "Perlu Verifikasi", tone: "text-violet-600", bar: "bg-violet-400" },
  { key: "verified", label: "Pembayaran Valid", tone: "text-emerald-600", bar: "bg-emerald-400" },
  { key: "completed", label: "Selesai", tone: "text-sky-600", bar: "bg-sky-400" },
  { key: "tickets", label: "Total Tiket", tone: "text-rose-600", bar: "bg-rose-400" },
] as const;

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

  const [stats, orders] = await Promise.all([
    getServiceStats(),
    listServiceOrders({ q, status }),
  ]);

  const statValues: Record<string, string> = {
    total: String(stats.total),
    pending: String(stats.pending),
    review: String(stats.review),
    verified: String(stats.verified),
    completed: String(stats.completed),
    tickets: String(stats.tickets),
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            Pesanan Masuk
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Pesanan dari form 2S / MnG. Kode pesanan dipakai untuk mencocokkan
            chat WhatsApp pemesan.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
          <span className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
            Pendapatan Valid
          </span>
          <div className="font-extrabold text-emerald-700">
            {formatRupiah(stats.revenue)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {CARDS.map((card) => (
          <div key={card.key} className="card overflow-hidden p-0">
            <div className={`h-1.5 w-full ${card.bar}`} />
            <div className="p-3">
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {card.label}
              </div>
              <div className={`mt-1 text-2xl font-extrabold ${card.tone}`}>
                {statValues[card.key]}
              </div>
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
          placeholder="Cari kode, nama, email, atau nama member..."
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
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
        >
          Cari
        </button>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Pemesan</th>
                <th className="px-4 py-3">Layanan</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Dibuat</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const items = parseOrderItems(order.items);
                const types = order.service_types.split("+").filter(Boolean);
                return (
                  <tr
                    key={order.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs font-bold text-rose-700 hover:underline"
                      >
                        {order.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {order.customer_name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {order.account_type} · {order.jkt_email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {types.map((type) => (
                          <span
                            key={type}
                            className={[
                              "badge border",
                              type === "MnG"
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-rose-200 bg-rose-50 text-rose-700",
                            ].join(" ")}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {order.item_count} item · {order.ticket_count} tiket
                        {items.length > 0 && (
                          <>
                            {" · "}
                            {items
                              .slice(0, 2)
                              .map((item) => item.nickname)
                              .join(", ")}
                            {items.length > 2 ? ", ..." : ""}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatRupiah(order.total)}
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
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
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

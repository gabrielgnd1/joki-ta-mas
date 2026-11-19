import Link from "next/link";
import { JokiOrderForm } from "@/components/joki-order-form";
import { MEMBER_TEAMS } from "@/lib/members";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSettings();
  const waNumber = settings.wa_number.replace(/[^0-9]/g, "");

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      {settings.announcement && (
        <div className="border-b border-rose-100 bg-rose-50 px-4 py-2.5 text-center text-sm font-semibold text-rose-700">
          📣 {settings.announcement}
        </div>
      )}

      <main className="flex-1">
        <JokiOrderForm
          members={MEMBER_TEAMS}
          waNumber={waNumber}
          ordersOpen={settings.orders_open === "1"}
          ofcEnabled={settings.ticket_ofc_enabled !== "0"}
          generalEnabled={settings.ticket_general_enabled !== "0"}
        />
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {settings.site_name} ·{" "}
        <Link href="/admin" className="font-semibold text-slate-500 hover:text-rose-600">
          Area Admin
        </Link>
      </footer>
    </div>
  );
}

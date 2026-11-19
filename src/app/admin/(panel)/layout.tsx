import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { getSettings } from "@/lib/settings";
import { AdminNav } from "@/components/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, settings] = await Promise.all([requireUser(), getSettings()]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-base shadow-sm">
              🎟️
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold tracking-tight text-slate-900">
                {settings.site_name}
              </div>
              <div className="text-[10px] font-bold tracking-[0.16em] text-rose-600 uppercase">
                Panel Admin
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-xs font-semibold text-slate-700">
                {user.name}
              </div>
              <div className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                {user.role === "admin" ? "Admin" : "Verifikator"}
              </div>
            </div>
            <form action={logoutAction}>
              <button type="submit" className="btn-secondary btn-sm">
                Keluar
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-white">
          <AdminNav isAdmin={user.role === "admin"} />
        </div>
      </header>

      <main className="container-page py-6">{children}</main>
    </div>
  );
}

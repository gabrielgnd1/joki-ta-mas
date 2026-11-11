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
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="container-page flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="text-sm font-extrabold tracking-tight text-sky-700 uppercase"
            >
              {settings.site_name}
            </Link>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-slate-500 uppercase">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-xs font-semibold text-slate-700">
                {user.name}
              </div>
              <div className="text-[10px] tracking-wide text-slate-400 uppercase">
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
        <div className="border-t border-slate-100">
          <AdminNav isAdmin={user.role === "admin"} />
        </div>
      </header>

      <main className="container-page py-6">{children}</main>
    </div>
  );
}

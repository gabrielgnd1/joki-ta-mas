import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  invalid: "Email atau password salah.",
  ratelimit: "Terlalu banyak percobaan login. Coba lagi beberapa menit.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/admin");

  const { error } = await searchParams;
  const settings = await getSettings();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-xl shadow-lg shadow-rose-200">
            🎟️
          </span>
          <div>
            <div className="text-lg font-extrabold tracking-tight text-slate-900">
              {settings.site_name}
            </div>
            <div className="text-[11px] font-bold tracking-[0.16em] text-rose-600 uppercase">
              Panel Admin
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h1 className="text-lg font-bold text-slate-900">Masuk</h1>
          <p className="mt-1 text-sm text-slate-500">
            Khusus tim admin dan verifikator pesanan.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {ERRORS[error] || "Gagal masuk. Coba lagi."}
            </div>
          )}

          <form action={loginAction} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                className="input"
                placeholder="admin@jokitamas.local"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="input"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-rose-600 px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(225,29,72,0.9)] transition hover:bg-rose-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
            >
              Masuk
            </button>
          </form>
        </div>

        <div className="mt-4 text-center text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-600">
            ← Kembali ke situs
          </Link>
        </div>
      </div>
    </div>
  );
}

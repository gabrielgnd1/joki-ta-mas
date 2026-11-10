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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-xl font-extrabold tracking-tight text-sky-700 uppercase">
            {settings.site_name}
          </div>
          <div className="text-xs font-medium text-slate-500">
            Panel Admin
          </div>
        </div>

        <div className="card p-6">
          <h1 className="text-lg font-bold text-slate-900">Masuk</h1>
          <p className="mt-1 text-sm text-slate-500">
            Khusus tim admin dan verifikator pembayaran.
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
            <button type="submit" className="btn-primary w-full">
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

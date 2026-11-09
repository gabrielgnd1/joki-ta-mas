import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/format";
import {
  addUserAction,
  resetPasswordAction,
  toggleUserAction,
} from "@/app/actions/admin";
import type { UserRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  invalid: "Data tidak lengkap atau tidak valid. Password minimal 8 karakter.",
  exists: "Email tersebut sudah terdaftar.",
  self: "Tidak bisa menonaktifkan akun sendiri.",
  password: "Password baru minimal 8 karakter.",
};

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const me = await requireAdmin();
  const { error } = await searchParams;

  const users = getDb()
    .prepare("SELECT * FROM users ORDER BY id ASC")
    .all() as UserRow[];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
          Tim Admin
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Admin bisa mengatur event &amp; pengaturan. Verifikator hanya bisa
          memproses pesanan.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {ERRORS[error] || "Terjadi kesalahan."}
        </div>
      )}

      <div className="card p-5">
        <h2 className="section-title">Tambah Anggota Tim</h2>
        <form action={addUserAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">
              Nama
            </label>
            <input id="name" name="name" className="input" required />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password Awal
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="role">
              Peran
            </label>
            <select id="role" name="role" className="input" defaultValue="verifier">
              <option value="verifier">Verifikator (pesanan saja)</option>
              <option value="admin">Admin (akses penuh)</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" className="btn-primary">
              Tambah Anggota
            </button>
          </div>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Peran</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Dibuat</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-100 align-top last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {user.name}
                    {user.id === me.id && (
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase">
                        Kamu
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        user.role === "admin"
                          ? "badge border-sky-200 bg-sky-50 text-sky-700"
                          : "badge border-slate-200 bg-slate-50 text-slate-600"
                      }
                    >
                      {user.role === "admin" ? "Admin" : "Verifikator"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        user.active
                          ? "badge border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "badge border-slate-200 bg-slate-100 text-slate-500"
                      }
                    >
                      {user.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-end gap-2">
                      <form action={toggleUserAction}>
                        <input type="hidden" name="id" value={user.id} />
                        <input type="hidden" name="active" value={user.active} />
                        <button
                          type="submit"
                          className="btn-secondary btn-sm"
                          disabled={user.id === me.id}
                        >
                          {user.active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </form>
                      <details className="w-44">
                        <summary className="cursor-pointer text-right text-xs font-medium text-slate-500 hover:text-slate-700">
                          Reset password
                        </summary>
                        <form
                          action={resetPasswordAction}
                          className="mt-2 flex gap-1"
                        >
                          <input type="hidden" name="id" value={user.id} />
                          <input
                            name="password"
                            type="password"
                            minLength={8}
                            placeholder="Password baru"
                            className="input px-2 py-1 text-xs"
                            required
                          />
                          <button
                            type="submit"
                            className="btn-primary btn-sm shrink-0"
                          >
                            Set
                          </button>
                        </form>
                      </details>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Catatan: reset password akan mengeluarkan anggota tersebut dari semua
        sesi login.
      </p>
    </div>
  );
}

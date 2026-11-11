export default function AdminLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        Memuat halaman…
      </div>

      <div>
        <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-slate-200/70" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="card p-3">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-200/80" />
            <div className="mt-2 h-6 w-12 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="card">
        <div className="border-b border-slate-100 p-4">
          <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 p-4">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200/80" />
              <div className="h-4 flex-1 animate-pulse rounded bg-slate-200/60" />
              <div className="h-4 w-20 animate-pulse rounded bg-slate-200/60" />
              <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200/70" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

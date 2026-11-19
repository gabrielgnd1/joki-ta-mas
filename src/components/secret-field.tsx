"use client";

import { useState } from "react";

/** Tampilan field sensitif (password akun JKT48): sembunyikan/tampilkan + salin. */
export function SecretField({ value }: { value: string }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-1 flex items-center gap-2">
      <code
        className={[
          "min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 font-mono text-sm text-slate-800",
          visible ? "" : "select-none blur-[5px]",
        ].join(" ")}
      >
        {value}
      </code>
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:border-rose-300 hover:text-rose-700"
      >
        {visible ? "Sembunyikan" : "Tampilkan"}
      </button>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:border-rose-300 hover:text-rose-700"
      >
        {copied ? "Tersalin ✓" : "Salin"}
      </button>
    </div>
  );
}

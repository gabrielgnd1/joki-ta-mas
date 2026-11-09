"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function ProofUploader({ code }: { code: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function upload() {
    if (!file) {
      setError("Pilih file bukti transfer terlebih dahulu.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const body = new FormData();
      body.set("code", code);
      body.set("file", file);
      const response = await fetch("/api/proof", { method: "POST", body });
      const data = (await response.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error?: string }
        | null;
      if (!response.ok || !data || !data.ok) {
        setError(
          (data && "error" in data && data.error) ||
            "Gagal mengunggah bukti. Coba lagi.",
        );
        return;
      }
      setDone(true);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setDone(false);
          }}
          className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-white text-sm text-slate-500 file:mr-3 file:cursor-pointer file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />
        <button
          type="button"
          onClick={upload}
          disabled={busy}
          className="btn-primary shrink-0"
        >
          {busy ? "Mengunggah..." : "Unggah Bukti"}
        </button>
      </div>
      <p className="hint">JPG, PNG, WEBP, atau PDF. Maksimal 4 MB.</p>
      {error && (
        <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
      )}
      {done && (
        <p className="mt-2 text-xs font-medium text-emerald-600">
          Bukti berhasil diunggah. Menunggu verifikasi admin.
        </p>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDateLong, formatRupiah } from "@/lib/format";
import { ArenaArt } from "@/components/arena-art";

export type WizardSection = {
  code: string;
  price: number;
  isOpen: boolean;
  color: string;
  onColor: string;
  soft: string;
};

export type WizardEvent = {
  id: number;
  name: string;
  venue: string | null;
  showAt: string | null;
  maxTickets: number;
  sections: WizardSection[];
};

export type WizardSettings = {
  siteName: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  gopayNumber: string;
  gopayHolder: string;
  waNumber: string;
  terms: string;
};

type FormState = {
  fullName: string;
  xUsername: string;
  email: string;
  whatsapp: string;
  nik: string;
  gender: string;
  birthDate: string;
  paymentMethod: "BCA" | "GOPAY";
  note: string;
  website: string;
};

const initialForm: FormState = {
  fullName: "",
  xUsername: "",
  email: "",
  whatsapp: "",
  nik: "",
  gender: "",
  birthDate: "",
  paymentMethod: "BCA",
  note: "",
  website: "",
};

const TICKET_TYPES = ["Presale OFC", "General Sale"] as const;

export function OrderWizard({
  event,
  settings,
  ordersOpen,
  announcement,
}: {
  event: WizardEvent;
  settings: WizardSettings;
  ordersOpen: boolean;
  announcement: string;
}) {
  const [step, setStep] = useState(1);
  const [ticketType, setTicketType] =
    useState<(typeof TICKET_TYPES)[number]>("General Sale");
  const [sectionCode, setSectionCode] = useState("");
  const [qty, setQty] = useState(1);
  const [backups, setBackups] = useState<string[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState<{ code: string; total: number } | null>(
    null,
  );

  const selectedSection = event.sections.find((s) => s.code === sectionCode);
  const total = (selectedSection?.price ?? 0) * qty;
  const openSections = useMemo(
    () => event.sections.filter((s) => s.isOpen),
    [event.sections],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }

  function chooseSection(code: string) {
    setSectionCode(code);
    setBackups((prev) => prev.filter((c) => c !== code));
    setErrors((prev) => ({ ...prev, sectionCode: "" }));
  }

  function goNext() {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!sectionCode) {
        setErrors({ sectionCode: "Pilih section terlebih dahulu." });
        return;
      }
      setStep(3);
    }
  }

  function validateFinal(): boolean {
    const next: Record<string, string> = {};
    if (form.fullName.trim().length < 3)
      next.fullName = "Nama lengkap wajib diisi.";
    if (form.xUsername.trim().length < 2)
      next.xUsername = "Username X / No. WhatsApp wajib diisi.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = "Email tidak valid.";
    if (form.whatsapp.replace(/[^0-9]/g, "").length < 8)
      next.whatsapp = "Nomor WhatsApp tidak valid.";
    if (form.nik.trim().length < 6)
      next.nik = "Nomor identitas wajib diisi.";
    if (!form.gender) next.gender = "Pilih jenis kelamin.";
    if (!form.birthDate) next.birthDate = "Tanggal lahir wajib diisi.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    setSubmitError("");
    if (!validateFinal()) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          ticketType,
          sectionCode,
          qty,
          backupSections: backups,
          fullName: form.fullName,
          xUsername: form.xUsername,
          email: form.email,
          whatsapp: form.whatsapp,
          nik: form.nik,
          gender: form.gender,
          birthDate: form.birthDate,
          paymentMethod: form.paymentMethod,
          note: form.note,
          website: form.website,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { ok: true; code: string; total: number }
        | { ok: false; error?: string }
        | null;

      if (!response.ok || !data || !data.ok) {
        setSubmitError(
          (data && "error" in data && data.error) ||
            "Gagal mengirim pesanan. Coba lagi.",
        );
        return;
      }
      setSuccess({ code: data.code, total: data.total });
    } catch {
      setSubmitError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ordersOpen) {
    return (
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div />
        <div className="card p-8 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-3xl">
            🔒
          </div>
          <h2 className="mt-4 font-display text-2xl font-extrabold text-slate-900">
            War sedang ditutup
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {announcement ||
              "Pemesanan sedang tidak dibuka. Silakan cek kembali nanti atau hubungi admin."}
          </p>
          <a
            className="btn-secondary mt-5"
            href={`https://wa.me/${settings.waNumber}`}
            target="_blank"
            rel="noreferrer"
          >
            Hubungi Admin
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid items-start gap-5 lg:grid-cols-[310px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-20">
          <PosterCard event={event} settings={settings} />
          <SummaryCard
            section={selectedSection}
            qty={qty}
            ticketType={ticketType}
            backups={backups}
            total={total}
            step={step}
          />
        </aside>

        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-4 sm:px-6">
            <Stepper step={step} />
          </div>

          <div className="p-5 sm:p-7">
            {step === 1 && (
              <div>
                <StepHeading
                  eyebrow="Langkah 1"
                  title="Pilih Event"
                  subtitle="Pilih event dan tipe penjualan tiket yang ingin diwar."
                />

                <div className="mt-5 rounded-2xl border-2 border-sky-100 bg-sky-50/50 p-4">
                  <div className="text-[10px] font-extrabold tracking-[0.16em] text-sky-500 uppercase">
                    Event Aktif
                  </div>
                  <div className="mt-1 text-base font-extrabold text-slate-900">
                    {event.name}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-sky-800">
                    <span className="rounded-full bg-white px-2.5 py-1">
                      📅 {formatDateLong(event.showAt)}
                    </span>
                    {event.venue && (
                      <span className="rounded-full bg-white px-2.5 py-1">
                        📍 {event.venue}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <span className="label">Tipe Penjualan Tiket</span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {TICKET_TYPES.map((type) => {
                      const selected = ticketType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setTicketType(type)}
                          className={[
                            "rounded-2xl border-2 p-4 text-left transition",
                            selected
                              ? "border-sky-500 bg-sky-50 shadow-sm"
                              : "border-slate-200 bg-white hover:border-sky-200",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-extrabold text-slate-900">
                              {type}
                            </span>
                            <span
                              className={[
                                "flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                                selected
                                  ? "border-sky-500 bg-sky-500 text-white"
                                  : "border-slate-300 text-transparent",
                              ].join(" ")}
                            >
                              ✓
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {type === "Presale OFC"
                              ? "Untuk pemegang kode presale official fan club."
                              : "Penjualan umum sesuai jadwal resmi."}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="hint">
                    Fee joki sama untuk kedua tipe penjualan.
                  </p>
                </div>

                <div className="mt-7">
                  <button
                    type="button"
                    className="btn-primary w-full sm:w-auto"
                    onClick={goNext}
                  >
                    Lanjut Pilih Section →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <StepHeading
                  eyebrow="Langkah 2"
                  title="Pilih Section"
                  subtitle={`${formatDateLong(event.showAt)} · ${ticketType}`}
                />

                <div className="mt-5 flex items-end justify-between gap-3">
                  <span className="text-xs font-extrabold tracking-wide text-slate-500 uppercase">
                    Kategori Utama
                  </span>
                  {selectedSection && (
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-extrabold"
                      style={{
                        backgroundColor: selectedSection.soft,
                        color: selectedSection.color,
                      }}
                    >
                      Terpilih: {selectedSection.code}
                    </span>
                  )}
                </div>

                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {event.sections.map((section) => {
                    const selected = sectionCode === section.code;
                    return (
                      <button
                        key={section.code}
                        type="button"
                        disabled={!section.isOpen}
                        onClick={() => chooseSection(section.code)}
                        className={[
                          "group overflow-hidden rounded-2xl border-2 bg-white text-left transition",
                          selected
                            ? "border-sky-500 shadow-[0_10px_25px_-12px_rgba(2,132,199,0.8)]"
                            : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
                          section.isOpen ? "" : "cursor-not-allowed opacity-55",
                        ].join(" ")}
                      >
                        <div
                          className="flex items-center justify-between px-3.5 py-2.5"
                          style={{
                            backgroundColor: section.color,
                            color: section.onColor,
                          }}
                        >
                          <span className="font-display text-lg font-extrabold leading-none">
                            {section.code}
                          </span>
                          <span className="rounded-full bg-white/25 px-2 py-0.5 text-[9px] font-extrabold tracking-wide uppercase">
                            {section.isOpen ? "Tersedia" : "Tutup"}
                          </span>
                        </div>
                        <div className="px-3.5 py-3">
                          <div className="text-sm font-extrabold text-slate-900">
                            {formatRupiah(section.price)}
                          </div>
                          <div className="text-[10px] font-medium text-slate-400">
                            fee per tiket
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.sectionCode && (
                  <p className="mt-2 text-xs font-bold text-red-600">
                    {errors.sectionCode}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div>
                    <div className="text-xs font-extrabold text-slate-700">
                      Jumlah Tiket
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Maksimal {event.maxTickets} tiket per pesanan
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-extrabold text-slate-500 hover:bg-slate-100"
                      aria-label="Kurangi"
                    >
                      −
                    </button>
                    <span className="w-9 text-center text-sm font-extrabold">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQty((q) => Math.min(event.maxTickets, q + 1))
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-lg font-extrabold text-white hover:bg-sky-700"
                      aria-label="Tambah"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  <span className="label">
                    Section Cadangan <span className="font-normal text-slate-400">(opsional)</span>
                  </span>
                  <p className="mb-2 text-xs text-slate-500">
                    Dipakai jika section utama habis saat war.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {openSections
                      .filter((s) => s.code !== sectionCode)
                      .map((section) => {
                        const checked = backups.includes(section.code);
                        return (
                          <label
                            key={section.code}
                            className={[
                              "flex cursor-pointer items-center gap-2 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition",
                              checked
                                ? "border-sky-500 bg-sky-50 text-sky-800"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                            ].join(" ")}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setBackups((prev) =>
                                  e.target.checked
                                    ? [...prev, section.code]
                                    : prev.filter((c) => c !== section.code),
                                )
                              }
                              className="h-3.5 w-3.5 accent-sky-600"
                            />
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: section.color }}
                            />
                            {section.code}
                          </label>
                        );
                      })}
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setStep(1)}
                  >
                    ← Kembali
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={goNext}
                  >
                    Lanjut Isi Data →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <StepHeading
                  eyebrow="Langkah 3"
                  title="Data Diri & Pembayaran"
                  subtitle="Isi identitas sesuai KTP/ID asli pemegang tiket."
                />

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="fullName">
                      Nama Lengkap (Sesuai KTP / ID) *
                    </label>
                    <input
                      id="fullName"
                      className="input"
                      value={form.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      placeholder="Contoh: Syifa Zenita Irawan"
                    />
                    <FieldError message={errors.fullName} />
                  </div>

                  <div>
                    <label className="label" htmlFor="xUsername">
                      Username X / No. WhatsApp *
                    </label>
                    <input
                      id="xUsername"
                      className="input"
                      value={form.xUsername}
                      onChange={(e) => update("xUsername", e.target.value)}
                      placeholder="Username X atau No. WA (08xxx)"
                    />
                    <FieldError message={errors.xUsername} />
                  </div>

                  <div>
                    <label className="label" htmlFor="email">
                      Email Akun Pembeli Tiket *
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="input"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="email@gmail.com"
                    />
                    <FieldError message={errors.email} />
                  </div>

                  <div>
                    <label className="label" htmlFor="whatsapp">
                      Nomor WhatsApp / HP Aktif *
                    </label>
                    <input
                      id="whatsapp"
                      type="tel"
                      className="input"
                      value={form.whatsapp}
                      onChange={(e) => update("whatsapp", e.target.value)}
                      placeholder="Contoh: 08123456789"
                    />
                    <FieldError message={errors.whatsapp} />
                  </div>

                  <div>
                    <label className="label" htmlFor="nik">
                      Nomor Identitas (NIK / KIA / Paspor) *
                    </label>
                    <input
                      id="nik"
                      className="input"
                      value={form.nik}
                      onChange={(e) => update("nik", e.target.value)}
                      placeholder="Contoh: 3273xxxxxxxxxxxx"
                    />
                    <FieldError message={errors.nik} />
                  </div>

                  <div>
                    <span className="label">Jenis Kelamin *</span>
                    <div className="flex gap-2 pt-1">
                      {["Laki-laki", "Perempuan"].map((gender) => {
                        const checked = form.gender === gender;
                        return (
                          <button
                            key={gender}
                            type="button"
                            onClick={() => update("gender", gender)}
                            className={[
                              "rounded-xl border-2 px-3 py-2 text-xs font-bold transition",
                              checked
                                ? "border-sky-500 bg-sky-50 text-sky-700"
                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                            ].join(" ")}
                          >
                            {gender}
                          </button>
                        );
                      })}
                    </div>
                    <FieldError message={errors.gender} />
                  </div>

                  <div>
                    <label className="label" htmlFor="birthDate">
                      Tanggal Lahir *
                    </label>
                    <input
                      id="birthDate"
                      type="date"
                      className="input"
                      value={form.birthDate}
                      onChange={(e) => update("birthDate", e.target.value)}
                    />
                    <FieldError message={errors.birthDate} />
                  </div>

                  <div className="sm:col-span-2">
                    <span className="label">Metode Pembayaran Fee Joki *</span>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <PaymentOption
                        selected={form.paymentMethod === "BCA"}
                        onSelect={() => update("paymentMethod", "BCA")}
                        title="Transfer BCA"
                        subtitle={settings.bankAccount}
                        note={`${settings.bankName} a.n. ${settings.bankHolder}`}
                        accent="#0060af"
                        initials="BCA"
                      />
                      <PaymentOption
                        selected={form.paymentMethod === "GOPAY"}
                        onSelect={() => update("paymentMethod", "GOPAY")}
                        title="Transfer GoPay"
                        subtitle={settings.gopayNumber}
                        note={`GoPay a.n. ${settings.gopayHolder}`}
                        accent="#00aed6"
                        initials="GO"
                      />
                    </div>
                    <p className="hint">
                      Pembayaran diverifikasi manual oleh admin. Instruksi
                      lengkap muncul setelah pesanan dikirim.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="note">
                      Catatan Tambahan (Opsional)
                    </label>
                    <textarea
                      id="note"
                      className="input min-h-24"
                      value={form.note}
                      onChange={(e) => update("note", e.target.value)}
                      placeholder="Tuliskan catatan khusus jika ada..."
                    />
                  </div>

                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => update("website", e.target.value)}
                    className="hidden"
                    aria-hidden="true"
                  />
                </div>

                <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
                  <div className="text-[10px] font-extrabold tracking-[0.16em] text-sky-600 uppercase">
                    Yang akan kamu bayar
                  </div>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <div className="text-xs text-slate-600">
                      {selectedSection?.code} · {qty} tiket · {ticketType}
                      {backups.length > 0
                        ? ` · cadangan ${backups.join(", ")}`
                        : ""}
                    </div>
                    <div className="font-display text-2xl font-extrabold text-sky-700">
                      {formatRupiah(total)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="text-[10px] font-extrabold tracking-[0.16em] text-amber-700 uppercase">
                    Syarat &amp; Ketentuan
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-amber-800">
                    {settings.terms
                      .split("\n")
                      .filter(Boolean)
                      .map((line, index) => (
                        <li key={index}>{line}</li>
                      ))}
                  </ul>
                </div>

                {submitError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                    {submitError}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setStep(2)}
                    disabled={submitting}
                  >
                    ← Kembali
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={submit}
                    disabled={submitting}
                  >
                    {submitting ? "Mengirim..." : "Kirim Pesanan"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {success && (
        <SuccessModal
          code={success.code}
          total={success.total}
          settings={settings}
        />
      )}
    </>
  );
}

function StepHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-extrabold tracking-[0.18em] text-sky-500 uppercase">
        {eyebrow}
      </div>
      <h2 className="font-display text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-bold text-red-600">{message}</p>;
}

function PosterCard({
  event,
  settings,
}: {
  event: WizardEvent;
  settings: WizardSettings;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-400 via-sky-500 to-blue-700 p-5 text-white shadow-[0_20px_45px_-18px_rgba(2,60,100,0.7)]">
      <ArenaArt className="pointer-events-none absolute -right-12 -bottom-14 w-64 opacity-80" />
      <div className="relative">
        <span className="inline-flex max-w-full truncate rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold backdrop-blur">
          {event.name}
        </span>
        <div className="mt-3 font-display text-4xl font-extrabold leading-none text-amber-300 drop-shadow-[0_2px_0_rgba(8,47,73,0.35)]">
          {settings.siteName}
        </div>
        <p className="mt-1 text-[10px] font-extrabold tracking-[0.28em] text-white/80">
          WAR TIKET KONSER
        </p>

        <div className="mt-4 space-y-1.5 text-[11px] font-semibold text-white/90">
          <div className="rounded-lg bg-white/15 px-2.5 py-1.5 backdrop-blur">
            📅 {formatDateLong(event.showAt)}
          </div>
          {event.venue && (
            <div className="rounded-lg bg-white/15 px-2.5 py-1.5 backdrop-blur">
              📍 {event.venue}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  section,
  qty,
  ticketType,
  backups,
  total,
  step,
}: {
  section?: WizardSection;
  qty: number;
  ticketType: string;
  backups: string[];
  total: number;
  step: number;
}) {
  return (
    <div className="card p-4">
      <div className="text-[10px] font-extrabold tracking-[0.16em] text-slate-400 uppercase">
        Ringkasan Pesanan
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-slate-500">Section</dt>
          <dd className="flex items-center gap-1.5 font-bold text-slate-900">
            {section ? (
              <>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: section.color }}
                />
                {section.code}
              </>
            ) : (
              <span className="text-slate-300">Belum dipilih</span>
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-slate-500">Jumlah</dt>
          <dd className="font-bold text-slate-900">{qty} tiket</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-slate-500">Tipe</dt>
          <dd className="font-bold text-slate-900">{ticketType}</dd>
        </div>
        {backups.length > 0 && (
          <div className="flex items-start justify-between gap-2">
            <dt className="text-slate-500">Cadangan</dt>
            <dd className="text-right font-semibold text-slate-700">
              {backups.join(", ")}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-sky-50 px-3 py-2.5">
        <span className="text-xs font-extrabold text-sky-800">Total</span>
        <span className="font-display text-xl font-extrabold text-sky-700">
          {formatRupiah(total)}
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        {["Pilih section", "Isi data diri", "Upload bukti transfer"].map(
          (label, index) => {
            const done = step > index + 1;
            return (
              <div
                key={label}
                className="flex items-center gap-2 text-[11px] font-semibold"
              >
                <span
                  className={[
                    "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold",
                    done
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-400",
                  ].join(" ")}
                >
                  {done ? "✓" : index + 1}
                </span>
                <span className={done ? "text-slate-600" : "text-slate-400"}>
                  {label}
                </span>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}

function PaymentOption({
  selected,
  onSelect,
  title,
  subtitle,
  note,
  accent,
  initials,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  note: string;
  accent: string;
  initials: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "rounded-2xl border-2 p-4 text-left transition",
        selected
          ? "border-sky-500 bg-sky-50/60 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-extrabold text-white"
            style={{ backgroundColor: accent }}
          >
            {initials}
          </span>
          <span className="text-sm font-extrabold text-slate-900">{title}</span>
        </div>
        <span
          className={[
            "flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] font-bold",
            selected
              ? "border-sky-500 bg-sky-500 text-white"
              : "border-slate-300 text-transparent",
          ].join(" ")}
        >
          ✓
        </span>
      </div>
      <div className="mt-2 font-mono text-sm font-bold text-slate-800">
        {subtitle}
      </div>
      <div className="text-xs text-slate-500">{note}</div>
    </button>
  );
}

function Stepper({ step }: { step: number }) {
  const steps = ["Event", "Section", "Data & Kirim"];
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, index) => {
        const number = index + 1;
        const active = number === step;
        const done = number < step;
        return (
          <div
            key={label}
            className={[
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2 text-[11px] font-extrabold sm:justify-start sm:px-3 sm:text-xs",
              active
                ? "bg-sky-600 text-white shadow-sm"
                : done
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-white text-slate-400",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                active
                  ? "bg-white/25 text-white"
                  : done
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-400",
              ].join(" ")}
            >
              {done ? "✓" : number}
            </span>
            <span className="truncate">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function SuccessModal({
  code,
  total,
  settings,
}: {
  code: string;
  total: number;
  settings: WizardSettings;
}) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/60 bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-400 via-sky-500 to-blue-700 px-6 py-6 text-center text-white">
          <ArenaArt className="pointer-events-none absolute -right-10 -top-10 w-48 opacity-60" />
          <div className="relative">
            <div className="text-3xl">🎫</div>
            <h2 className="mt-1 font-display text-2xl font-extrabold">
              Pesanan Terkirim!
            </h2>
            <p className="mt-1 text-xs text-white/85">
              Simpan kode ini untuk cek status dan unggah bukti transfer.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50 px-4 py-3">
            <div>
              <div className="text-[10px] font-extrabold tracking-[0.16em] text-sky-500 uppercase">
                Kode Pesanan
              </div>
              <div className="font-mono text-xl font-extrabold tracking-wider text-sky-800">
                {code}
              </div>
            </div>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={copyCode}
            >
              {copied ? "Tersalin" : "Salin"}
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
            <span className="text-sm font-bold text-amber-800">
              Total tagihan
            </span>
            <span className="font-display text-xl font-extrabold text-amber-900">
              {formatRupiah(total)}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0060af] text-[10px] font-extrabold text-white">
                BCA
              </span>
              <div>
                <div className="font-mono text-sm font-bold text-slate-900">
                  {settings.bankAccount}
                </div>
                <div className="text-xs text-slate-500">
                  {settings.bankName} a.n. {settings.bankHolder}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00aed6] text-[10px] font-extrabold text-white">
                GO
              </span>
              <div>
                <div className="font-mono text-sm font-bold text-slate-900">
                  {settings.gopayNumber}
                </div>
                <div className="text-xs text-slate-500">
                  GoPay a.n. {settings.gopayHolder}
                </div>
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            {settings.terms.split("\n")[0]}
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/cek?code=${encodeURIComponent(code)}`}
              className="btn-primary flex-1"
            >
              Cek &amp; Unggah Bukti
            </Link>
            <a
              href={`https://wa.me/${settings.waNumber}?text=${encodeURIComponent(
                `Halo admin, saya sudah memesan joki tiket dengan kode ${code}.`,
              )}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary flex-1"
            >
              Hubungi Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { formatRupiah } from "@/lib/format";
import {
  calculateItemCost,
  findMember,
  type MemberGroup,
} from "@/lib/members";
import { buildOrderWhatsAppUrl, type WaCartItem } from "@/lib/wa-message";
import type { ServiceType } from "@/lib/types";

type Props = {
  members: MemberGroup[];
  waNumber: string;
  ordersOpen: boolean;
  ofcEnabled: boolean;
  generalEnabled: boolean;
};

type CartLine = {
  id: string;
  serviceType: ServiceType;
  team: string;
  nickname: string;
  fullName: string;
  qty: number;
  sessionNote: string;
};

function memberKey(team: string, nickname: string): string {
  return `${team}::${nickname}`;
}

export function JokiOrderForm({
  members,
  waNumber,
  ordersOpen,
  ofcEnabled,
  generalEnabled,
}: Props) {
  const [serviceType, setServiceType] = useState<ServiceType>("2S");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [memberKeySelected, setMemberKeySelected] = useState("");
  const [qty, setQty] = useState(1);
  const [sessionNote, setSessionNote] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [accountType, setAccountType] = useState<"OFC" | "Non-OFC">(
    ofcEnabled ? "OFC" : "Non-OFC",
  );
  const [jktEmail, setJktEmail] = useState("");
  const [jktPassword, setJktPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [pickerError, setPickerError] = useState(false);
  const [formError, setFormError] = useState(false);
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ code: string; waUrl: string } | null>(
    null,
  );

  const selectedMember = useMemo(() => {
    if (!memberKeySelected) return null;
    const [team, nickname] = memberKeySelected.split("::");
    return findMember(team, nickname, members);
  }, [memberKeySelected, members]);

  const filteredTeams = useMemo(
    () =>
      teamFilter === "ALL"
        ? members
        : members.filter((group) => group.team === teamFilter),
    [members, teamFilter],
  );

  // 2S dikunci 1 tiket; MnG bebas 1–20.
  const effectiveQty =
    serviceType === "2S" ? 1 : Math.min(20, Math.max(1, qty || 1));

  const preview = selectedMember
    ? calculateItemCost(selectedMember, serviceType, effectiveQty)
    : null;

  const totals = cart.reduce(
    (acc, line) => {
      const member = findMember(line.team, line.nickname, members);
      if (!member) return acc;
      const { subtotal } = calculateItemCost(
        member,
        line.serviceType,
        line.qty,
      );
      acc.items += 1;
      acc.tickets += line.qty;
      acc.total += subtotal;
      return acc;
    },
    { items: 0, tickets: 0, total: 0 },
  );

  function addToCart() {
    setPickerError(false);
    if (!memberKeySelected || !selectedMember) {
      setPickerError(true);
      return;
    }

    const line: CartLine = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      serviceType,
      team: memberKeySelected.split("::")[0],
      nickname: selectedMember.nickname,
      fullName: selectedMember.fullName,
      qty: effectiveQty,
      sessionNote: sessionNote.trim(),
    };

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.nickname === line.nickname &&
          item.serviceType === line.serviceType &&
          item.sessionNote.toLowerCase() === line.sessionNote.toLowerCase(),
      );

      if (existingIndex !== -1) {
        const next = [...prev];
        const existing = next[existingIndex];
        next[existingIndex] = {
          ...existing,
          qty:
            line.serviceType === "2S"
              ? 1
              : Math.min(20, existing.qty + line.qty),
        };
        return next;
      }

      return [...prev, line];
    });

    setMemberKeySelected("");
    setQty(1);
    setSessionNote("");
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPickerError(false);
    setFormError(false);
    setServerError("");

    if (
      !customerName.trim() ||
      !jktEmail.trim() ||
      !jktPassword ||
      cart.length === 0
    ) {
      setFormError(true);
      return;
    }

    // Buka jendela lebih dulu supaya tidak diblokir popup blocker,
    // lalu arahkan ke WhatsApp setelah pesanan tersimpan.
    const waWindow = window.open("about:blank", "_blank");

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((line) => ({
            serviceType: line.serviceType,
            team: line.team,
            nickname: line.nickname,
            qty: line.qty,
            sessionNote: line.sessionNote,
          })),
          customerName: customerName.trim(),
          accountType,
          jktEmail: jktEmail.trim(),
          jktPassword,
          website: "",
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            code?: string;
            total?: number;
            items?: WaCartItem[];
          }
        | null;

      if (!res.ok || !data?.ok || !data.code) {
        setServerError(data?.error || "Gagal mengirim pesanan. Coba lagi.");
        waWindow?.close();
        return;
      }

      // Pakai item hasil hitung server (data.items) supaya pesan WhatsApp
      // selalu sama dengan total yang tersimpan di panel admin.
      const waUrl = buildOrderWhatsAppUrl({
        phoneNumber: waNumber,
        orderCode: data.code,
        customerName: customerName.trim(),
        accountType,
        jktEmail: jktEmail.trim(),
        jktPassword,
        items: data.items ?? [],
      });

      if (waWindow) {
        waWindow.location.href = waUrl;
      } else {
        window.open(waUrl, "_blank");
      }

      setSuccess({ code: data.code, waUrl });
    } catch {
      setServerError("Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.");
      waWindow?.close();
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setCart([]);
    setCustomerName("");
    setJktEmail("");
    setJktPassword("");
    setSessionNote("");
    setMemberKeySelected("");
    setQty(1);
    setServerError("");
    setFormError(false);
    setPickerError(false);
    setSuccess(null);
  }

  if (success) {
    return (
      <div className="joki-form">
        <div className="joki-shell joki-success">
        <div className="joki-success-icon">✅</div>
        <h1 className="joki-success-title">Pesanan Tersimpan</h1>
        <p className="joki-success-text">
          Pesanan kamu sudah tercatat di sistem dengan kode:
        </p>
        <div className="joki-success-code">{success.code}</div>
        <p className="joki-success-text">
          Jendela WhatsApp ke admin sudah dibuka. Jika tidak terbuka, tekan
          tombol di bawah untuk mengirim rincian pesanan.
        </p>
        <a
          href={success.waUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-wa"
        >
          Buka WhatsApp Admin
        </a>
        <button type="button" className="btn-add joki-btn-reset" onClick={resetForm}>
          Buat Pesanan Baru
        </button>
        </div>
      </div>
    );
  }

  return (
    <div className="joki-form">
      <div className="joki-shell">
        <div className="header">
          <h1>Form Order Joki Tiket</h1>
          <p>
            Pilih member 2-Shot (2S) / Meet &amp; Greet (MnG) dan lengkapi data
            akun JKT48
          </p>
        </div>

        {!ordersOpen && (
          <div className="joki-closed-banner">
            Pemesanan sedang ditutup oleh admin. Silakan coba lagi nanti.
          </div>
        )}

        {serverError && <div className="joki-server-error">{serverError}</div>}

        {/* BAGIAN 1: PILIH & TAMBAH MEMBER */}
        <div className="joki-section-title">1. Tambah Member ke Pesanan</div>
        <div className="picker-card">
          <div className="form-group">
            <label>Jenis Layanan</label>
            <div className="event-toggle">
              <label className="event-option">
                <input
                  type="radio"
                  name="eventType"
                  value="2S"
                  checked={serviceType === "2S"}
                  onChange={() => {
                    setServiceType("2S");
                    setQty(1);
                  }}
                />
                <span>2-Shot (2S)</span>
              </label>
              <label className="event-option">
                <input
                  type="radio"
                  name="eventType"
                  value="MnG"
                  checked={serviceType === "MnG"}
                  onChange={() => setServiceType("MnG")}
                />
                <span>Meet &amp; Greet (MnG)</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="teamFilter">Filter Tim / Kategori</label>
            <select
              id="teamFilter"
              value={teamFilter}
              onChange={(event) => setTeamFilter(event.target.value)}
            >
              <option value="ALL">Semua Tim &amp; Trainee</option>
              {members.map((group) => (
                <option key={group.team} value={group.team}>
                  {group.team}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="memberSelect">Pilih Member</label>
            <select
              id="memberSelect"
              value={memberKeySelected}
              onChange={(event) => setMemberKeySelected(event.target.value)}
            >
              <option value="">-- Pilih Member --</option>
              {filteredTeams.map((group) => (
                <optgroup key={group.team} label={group.team}>
                  {group.members.map((member) => {
                    const priceInfo =
                      serviceType === "2S"
                        ? `${formatRupiah(member.price2s)}`
                        : `${formatRupiah(member.mngLow)} (1-4 tkt) | ${formatRupiah(member.mngHigh)} (5-20 tkt)`;
                    return (
                      <option
                        key={member.nickname}
                        value={memberKey(group.team, member.nickname)}
                      >
                        {`${member.nickname} (${member.fullName}) - ${priceInfo}`}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="form-group row-2">
            <div>
              <label htmlFor="qty">Jumlah Tiket</label>
              <input
                type="number"
                id="qty"
                value={effectiveQty}
                min={1}
                max={serviceType === "MnG" ? 20 : 1}
                disabled={serviceType === "2S"}
                onChange={(event) => {
                  const raw = parseInt(event.target.value, 10) || 1;
                  setQty(Math.min(20, Math.max(1, raw)));
                }}
              />
              <p className="helper-hint">
                {serviceType === "MnG"
                  ? "Tarif paket (1–4 atau 5–20 tiket)"
                  : "Maks. 1 tiket per item (2S)"}
              </p>
            </div>
            <div>
              <label htmlFor="sessionNote">Sesi / Jalur (Opsional)</label>
              <input
                type="text"
                id="sessionNote"
                placeholder="Contoh: Sesi 2 / Jalur A"
                value={sessionNote}
                onChange={(event) => setSessionNote(event.target.value)}
              />
            </div>
          </div>

          <div className="preview-bar">
            <span>Biaya Jasa Item Ini:</span>
            <strong id="itemPreviewPrice">
              {preview
                ? `${formatRupiah(preview.subtotal)} • ${preview.detailText}`
                : "Rp 0"}
            </strong>
          </div>

          <button type="button" id="addItemBtn" className="btn-add" onClick={addToCart}>
            + Tambah ke Daftar Pesanan
          </button>
          {pickerError && (
            <p id="pickerError" className="error-msg" style={{ display: "block" }}>
              Pilih member terlebih dahulu sebelum menambahkan.
            </p>
          )}
        </div>

        {/* BAGIAN 2: DAFTAR MEMBER YANG DIPILIH */}
        <div className="cart-section">
          <div className="cart-header">
            <div className="joki-section-title joki-section-title-inline">
              2. Daftar Member Dipilih (<span id="cartCount">{cart.length}</span>)
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                id="clearCartBtn"
                className="btn-clear"
                onClick={() => setCart([])}
              >
                Hapus Semua
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div id="cartEmpty" className="cart-empty">
              Belum ada member dipilih. Silakan pilih member di atas lalu klik{" "}
              <strong>+ Tambah ke Daftar Pesanan</strong>.
            </div>
          ) : (
            <div id="cartList" className="cart-list">
              {cart.map((line) => {
                const member = findMember(line.team, line.nickname, members);
                const { subtotal, detailText } = member
                  ? calculateItemCost(member, line.serviceType, line.qty)
                  : { subtotal: 0, detailText: "" };
                const badgeClass =
                  line.serviceType === "MnG" ? "badge-event mng" : "badge-event";
                const noteText = line.sessionNote
                  ? ` • Sesi: ${line.sessionNote}`
                  : "";
                return (
                  <div key={line.id} className="cart-item">
                    <div className="cart-item-info">
                      <h4>
                        <span className={badgeClass}>{line.serviceType}</span>{" "}
                        {line.nickname} ({line.fullName})
                      </h4>
                      <div className="cart-item-meta">
                        {line.team}
                        {noteText}
                        <br />
                        {detailText}
                      </div>
                    </div>
                    <div className="cart-item-right">
                      <div className="cart-item-price">
                        {formatRupiah(subtotal)}
                      </div>
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeItem(line.id)}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* BAGIAN 3: DATA PEMESAN & AKUN JKT48 */}
        <form id="orderForm" onSubmit={handleSubmit} noValidate={false}>
          <div className="joki-section-title">
            3. Data Pemesan &amp; Akun JKT48
          </div>
          <div className="account-card">
            <div className="form-group">
              <label htmlFor="customerName">Nama Pemesan / Nama Panggilan</label>
              <input
                type="text"
                id="customerName"
                placeholder="Masukkan nama kamu"
                required
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Status Akun JKT48</label>
              <div className="event-toggle">
                <label className="event-option">
                  <input
                    type="radio"
                    name="accountType"
                    value="OFC"
                    checked={accountType === "OFC"}
                    disabled={!ofcEnabled}
                    onChange={() => setAccountType("OFC")}
                  />
                  <span>OFC (Official Fan Club)</span>
                </label>
                <label className="event-option">
                  <input
                    type="radio"
                    name="accountType"
                    value="Non-OFC"
                    checked={accountType === "Non-OFC"}
                    disabled={!generalEnabled}
                    onChange={() => setAccountType("Non-OFC")}
                  />
                  <span>Non-OFC (Regular)</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="jktEmail">Email Akun JKT48</label>
              <input
                type="email"
                id="jktEmail"
                placeholder="contoh@email.com"
                required
                value={jktEmail}
                onChange={(event) => setJktEmail(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="jktPassword">Password Akun JKT48</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="jktPassword"
                  placeholder="Masukkan password akun JKT48"
                  required
                  value={jktPassword}
                  onChange={(event) => setJktPassword(event.target.value)}
                />
                <button
                  type="button"
                  id="togglePassBtn"
                  className="btn-toggle-pass"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
              <p className="helper-hint">
                Pastikan email &amp; password sesuai untuk login di web resmi
                JKT48.
              </p>
            </div>
          </div>

          <div className="summary-box">
            <div className="summary-row">
              <span>Total Slot / Member</span>
              <strong id="summaryItems">
                {totals.items} item ({totals.tickets} tiket)
              </strong>
            </div>
            <div className="summary-total">
              <span>Grand Total Biaya Jasa</span>
              <span id="summaryTotal">{formatRupiah(totals.total)}</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn-wa"
            disabled={!ordersOpen || submitting}
          >
            {submitting
              ? "Mengirim pesanan..."
              : "Kirim Semua Pesanan ke WhatsApp"}
          </button>
          {formError && (
            <p id="submitError" className="error-msg" style={{ display: "block" }}>
              Mohon tambahkan minimal 1 member dan lengkapi data akun JKT48.
            </p>
          )}
          <p className="joki-privacy-note">
            Data akun JKT48 disimpan untuk keperluan joki dan hanya diakses
            oleh admin.
          </p>
        </form>
      </div>
    </div>
  );
}

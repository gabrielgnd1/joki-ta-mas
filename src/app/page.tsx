import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  OrderWizard,
  type WizardEvent,
  type WizardSettings,
} from "@/components/order-wizard";
import { getActiveEvent, getSections } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { colorForSection } from "@/lib/palette";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const event = await getActiveEvent();
  const sections = event ? await getSections(event.id) : [];
  const settings = await getSettings();

  const wizardEvent: WizardEvent | null = event
    ? {
        id: event.id,
        name: event.name,
        venue: event.venue,
        showAt: event.show_at,
        maxTickets: event.max_tickets,
        sections: sections.map((section, index) => {
          const palette = colorForSection(section.code, index);
          return {
            code: section.code,
            price: section.price,
            isOpen: section.is_open === 1,
            color: palette.color,
            onColor: palette.onColor,
            soft: palette.soft,
          };
        }),
      }
    : null;

  const wizardSettings: WizardSettings = {
    siteName: settings.site_name,
    qrisMerchant: settings.qris_merchant,
    qrisNmid: settings.qris_nmid,
    qrisImage: settings.qris_image,
    qrisNote: settings.qris_note,
    waNumber: settings.wa_number.replace(/[^0-9]/g, ""),
    waNumber2: (settings.wa_number_2 || "").replace(/[^0-9]/g, ""),
    xUsername: (settings.x_username || "").replace(/^@/, ""),
    terms: settings.terms,
  };

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="container-page pt-8 pb-6 text-center sm:pt-10">
          <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-white/20 px-3 py-1 text-[10px] font-extrabold tracking-[0.14em] text-white uppercase backdrop-blur">
            🎟️ {event ? "War Tiket Konser Dibuka" : "Menunggu Event Berikutnya"}
          </span>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-[0.95] tracking-tight text-white drop-shadow-[0_3px_0_rgba(3,64,102,0.35)] sm:text-6xl">
            WAR TIKET
            <span className="block text-amber-300">KONSER</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm font-medium text-white/85 sm:text-base">
            Isi form, pilih section, dan biarkan tim kami yang war. Cepat, aman,
            dan pembayaran dicek manual oleh admin.
          </p>
        </section>

        {settings.announcement && (
          <div className="container-page mb-4">
            <div className="rounded-2xl border border-white/40 bg-amber-50/95 px-4 py-3 text-sm font-medium text-amber-900 shadow-sm">
              📣 {settings.announcement}
            </div>
          </div>
        )}

        <div className="container-page pb-10">
          {wizardEvent ? (
            <OrderWizard
              event={wizardEvent}
              settings={wizardSettings}
              ordersOpen={settings.orders_open === "1"}
              announcement={settings.announcement}
            />
          ) : (
            <div className="card p-10 text-center">
              <h2 className="font-display text-2xl font-extrabold text-slate-900">
                Belum ada event aktif
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Event akan tampil di sini setelah admin mengaktifkannya.
              </p>
            </div>
          )}

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <InfoCard
              number="1"
              emoji="🎯"
              title="Pilih Section"
              text="Tentukan kategori utama, jumlah tiket, dan section cadangan."
            />
            <InfoCard
              number="2"
              emoji="📝"
              title="Isi Data"
              text="Lengkapi identitas sesuai KTP, lalu bayar fee joki via QRIS."
            />
            <InfoCard
              number="3"
              emoji="✅"
              title="Kirim Bukti"
              text="Transfer, kirim bukti via WhatsApp, lalu admin verifikasi manual."
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function InfoCard({
  number,
  emoji,
  title,
  text,
}: {
  number: string;
  emoji: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/40 bg-white/15 p-4 text-white backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-base">
          {emoji}
        </span>
        <span className="font-display text-base font-extrabold">
          {number}. {title}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-white/80">{text}</p>
    </div>
  );
}

import Link from "next/link";
import { getSettings } from "@/lib/settings";

export function SiteFooter() {
  const settings = getSettings();
  const wa = settings.wa_number.replace(/[^0-9]/g, "");
  const x = settings.x_username.replace(/^@/, "");

  return (
    <footer className="mt-16 bg-sky-950/85 text-sky-100 backdrop-blur-sm">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2">
        <div>
          <div className="font-display text-2xl font-extrabold tracking-tight text-amber-300">
            {settings.site_name}
          </div>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-sky-200/80">
            Jasa joki war tiket konser. Cepat, aman, dan transparan. Pembayaran
            diverifikasi manual oleh admin.
          </p>
        </div>
        <div>
          <div className="text-[11px] font-bold tracking-[0.18em] text-sky-300/70 uppercase">
            Kontak &amp; Informasi
          </div>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-sky-100 hover:text-amber-300"
            >
              WhatsApp: +{wa}
            </a>
            <a
              href={`https://x.com/${x}`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-sky-100 hover:text-amber-300"
            >
              X: @{x}
            </a>
            <Link
              href="/admin"
              className="text-xs text-sky-300/60 hover:text-sky-100"
            >
              Area Admin
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 text-xs text-sky-300/60">
          <span>
            © {new Date().getFullYear()} {settings.site_name}. All rights
            reserved.
          </span>
          <span>Pembayaran manual: BCA Transfer &amp; GoPay Transfer</span>
        </div>
      </div>
    </footer>
  );
}

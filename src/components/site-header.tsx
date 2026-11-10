import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { SiteNavLinks } from "./site-nav-links";

export async function SiteHeader() {
  const settings = await getSettings();
  return (
    <header className="sticky top-0 z-40 border-b border-white/25 bg-sky-500/35 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-baseline gap-2">
          <span className="font-display text-2xl font-extrabold leading-none tracking-tight text-amber-300 drop-shadow-[0_2px_0_rgba(8,47,73,0.35)] sm:text-3xl">
            {settings.site_name}
          </span>
          <span className="hidden truncate text-[11px] font-semibold tracking-wide text-white/80 md:inline">
            {settings.site_tagline}
          </span>
        </Link>
        <SiteNavLinks />
      </div>
    </header>
  );
}

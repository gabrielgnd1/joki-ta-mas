"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Buat Pesanan" },
  { href: "/cek", label: "Cek Pesanan" },
  { href: "/pricelist", label: "Pricelist" },
];

export function SiteNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {LINKS.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={[
              "rounded-full px-3 py-2 text-xs font-bold transition sm:px-4 sm:text-sm",
              active
                ? "bg-white text-sky-700 shadow-sm"
                : "text-white/90 hover:bg-white/15 hover:text-white",
            ].join(" ")}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Pesanan" },
    { href: "/admin/event", label: "Event & Harga", adminOnly: true },
    { href: "/admin/settings", label: "Pembayaran", adminOnly: true },
    { href: "/admin/team", label: "Tim", adminOnly: true },
  ];

  return (
    <nav className="container-page flex gap-1 overflow-x-auto py-2">
      {links
        .filter((link) => !link.adminOnly || isAdmin)
        .map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin" || pathname.startsWith("/admin/orders")
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "shrink-0 rounded-md px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-sky-50 text-sky-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")}
            >
              {link.label}
            </Link>
          );
        })}
    </nav>
  );
}

"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function PendingSpinner() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      className="ml-1.5 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
  );
}

function isLinkActive(pathname: string, href: string): boolean {
  return href === "/admin"
    ? pathname === "/admin" || pathname.startsWith("/admin/orders")
    : pathname.startsWith(href);
}

export function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Clear the optimistic highlight once the new page has rendered.
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

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
            isLinkActive(pathname, link.href) || pendingHref === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch
              onClick={() => setPendingHref(link.href)}
              aria-current={active ? "page" : undefined}
              aria-busy={pendingHref === link.href || undefined}
              className={[
                "flex shrink-0 items-center rounded-md px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-sky-50 text-sky-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")}
            >
              {link.label}
              <PendingSpinner />
            </Link>
          );
        })}
    </nav>
  );
}

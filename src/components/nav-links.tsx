"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_LINKS = [
  { href: "/events", label: "Events" },
  { href: "/import", label: "Import" },
] as const;

function linkClassName(active: boolean) {
  return `rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
    active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
  }`;
}

/**
 * Reads the current route to highlight the active nav link. Isolated from
 * NavHeader (a plain server component) so only this piece needs a Suspense
 * boundary — Next 16's Cache Components mode prerenders routes statically
 * and requires any `usePathname()` user to stream in, not block the shell.
 */
export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={linkClassName(active)}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

/** Prerender-time fallback: same links, no active highlighting (pathname unknown yet). */
export function NavLinksFallback() {
  return (
    <>
      {NAV_LINKS.map((link) => (
        <Link key={link.href} href={link.href} className={linkClassName(false)}>
          {link.label}
        </Link>
      ))}
    </>
  );
}

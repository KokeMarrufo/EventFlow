import { Suspense } from "react";
import Link from "next/link";
import { UploadCloud } from "lucide-react";
import { NavLinks, NavLinksFallback } from "./nav-links";
import { PillButton } from "./pill-button";

/** Plain server component shell — only `NavLinks` needs client-side pathname. */
export function NavHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface-container-lowest/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/events"
            className="flex items-center gap-2.5 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 15 L10 9 L14 13 L20 6" />
                <path d="M14 6h6v6" />
              </svg>
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-base font-bold text-navy">EventFlow</span>
              <span className="font-sans text-[11px] font-semibold uppercase tracking-wide text-muted">
                Downtown Mission &middot; Operations
              </span>
            </span>
          </Link>
        </div>

        <nav aria-label="Primary" className="flex items-center gap-1">
          <Suspense fallback={<NavLinksFallback />}>
            <NavLinks />
          </Suspense>
          <span className="ml-2 hidden sm:inline-flex">
            <PillButton href="/import" variant="primary">
              <UploadCloud aria-hidden="true" className="h-4 w-4" />
              Import data
            </PillButton>
          </span>
        </nav>
      </div>
    </header>
  );
}

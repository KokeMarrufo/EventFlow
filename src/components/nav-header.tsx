import { Suspense } from "react";
import Link from "next/link";
import { NavLinks, NavLinksFallback } from "./nav-links";
import { PillButton } from "./pill-button";

/** Plain server component shell — only `NavLinks` needs client-side pathname. */
export function NavHeader() {
  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/events"
          className="flex items-center gap-2 rounded font-display text-lg font-bold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-navy"
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
          <span>
            EventFlow <span className="font-normal text-white/70">&middot; Downtown Mission</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
          <Suspense fallback={<NavLinksFallback />}>
            <NavLinks />
          </Suspense>
          {/* Wrap rather than pass "hidden sm:inline-flex" straight to PillButton:
              its base classes always include an unconditional "inline-flex",
              which (same specificity, later in the generated stylesheet)
              beats "hidden" at every width, so the button never actually
              hides on narrow screens if the two compete on the same element. */}
          <span className="hidden sm:inline-flex">
            <PillButton href="/import" variant="primary">
              Import data
            </PillButton>
          </span>
        </nav>
      </div>
    </header>
  );
}

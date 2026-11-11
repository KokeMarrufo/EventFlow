import type { ReactNode } from "react";
import { NavHeader } from "@/components/nav-header";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <NavHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted sm:px-6">
        EventFlow &middot; internal staff tool for Downtown Mission. Pilot build.
      </footer>
    </div>
  );
}

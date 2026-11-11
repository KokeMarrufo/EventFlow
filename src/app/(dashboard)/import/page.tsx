import { Suspense } from "react";
import { getRecentImports } from "@/lib/reports";
import { UploadForm } from "@/components/upload-form";
import { RecentImports } from "@/components/recent-imports";

export const metadata = {
  title: "Import | EventFlow",
};

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">Import a source file</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Upload an event budget, DonorPerfect export, or Sage export (CSV or Excel). The file is
          parsed and reconciled against a declared total, if you provide one, before it is added to
          the per-event totals.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <UploadForm />
        </div>
        <div className="lg:col-span-2">
          <h2 className="mb-2 font-display text-base font-bold text-navy">Recent imports</h2>
          <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-surface-container" />}>
            <RecentImportsSection />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function RecentImportsSection() {
  const recentImports = await getRecentImports(8);
  return <RecentImports imports={recentImports} />;
}

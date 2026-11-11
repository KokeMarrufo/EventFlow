import { UploadForm } from "@/components/upload-form";

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
      <UploadForm />
    </div>
  );
}

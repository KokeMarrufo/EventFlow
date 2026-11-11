"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import type { ImportResponse, SourceType } from "@/lib/types";
import { PillButton } from "./pill-button";
import { ImportResultPanel, type ImportOutcome } from "./import-result";

const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: "event_budget", label: "Event budget" },
  { value: "donorperfect", label: "DonorPerfect export" },
  { value: "sage", label: "Sage export" },
];

function hasStringError(value: unknown): value is { error: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "string"
  );
}

function looksLikeImportResponse(value: unknown): value is ImportResponse {
  return typeof value === "object" && value !== null && "sourceFile" in value && "lineItems" in value;
}

export function UploadForm() {
  const fileInputId = useId();
  const sourceTypeId = useId();
  const declaredTotalId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<SourceType>("event_budget");
  const [declaredTotal, setDeclaredTotal] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ImportOutcome>({ kind: "idle" });

  function pickFile(nextFile: File | null) {
    setFile(nextFile);
    setFormError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!file) {
      setFormError("Choose a file to upload.");
      return;
    }

    setFormError(null);
    setOutcome({ kind: "uploading" });

    const body = new FormData();
    body.append("file", file);
    body.append("sourceType", sourceType);
    if (declaredTotal.trim() !== "") {
      body.append("declaredTotal", declaredTotal.trim());
    }

    let res: Response;
    try {
      res = await fetch("/api/import", { method: "POST", body });
    } catch {
      setOutcome({
        kind: "error",
        message: "Could not reach the import endpoint. Check your connection and try again.",
      });
      return;
    }

    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if (res.status === 501) {
      const message = hasStringError(json) ? json.error : "Import parsing is not implemented yet.";
      setOutcome({ kind: "not_implemented", message });
      return;
    }

    // A 422 (every row failed validation) still carries a full ImportResponse
    // body — sourceFile.status "error" plus the per-row validation messages —
    // so render it the same way as a 200, rather than discarding that detail
    // behind a generic "Import failed (HTTP 422)" message. Only a response
    // that doesn't match the ImportResponse shape (e.g. a 400/503 with a bare
    // `{ error }`) falls back to the generic error panel below.
    if (looksLikeImportResponse(json)) {
      setOutcome({ kind: "success", data: json });
      return;
    }

    if (!res.ok) {
      const message = hasStringError(json) ? json.error : `Import failed (HTTP ${res.status}).`;
      setOutcome({ kind: "error", message });
      return;
    }

    setOutcome({ kind: "error", message: "The import endpoint returned an unexpected response." });
  }

  const isUploading = outcome.kind === "uploading";

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-surface p-6">
        <div>
          <label htmlFor={fileInputId} className="mb-2 block text-sm font-semibold text-navy">
            Source file
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const dropped = e.dataTransfer.files?.[0] ?? null;
              if (dropped) pickFile(dropped);
            }}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
              isDragging ? "border-sky bg-sky/10" : "border-border bg-background/60"
            }`}
          >
            <p className="text-sm text-navy">
              {file ? <span className="font-semibold">{file.name}</span> : "Drag a CSV or Excel file here, or"}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-sky px-4 py-1.5 text-sm font-semibold text-sky-dark hover:bg-sky hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Browse files
            </button>
            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <div>
          <label htmlFor={sourceTypeId} className="mb-2 block text-sm font-semibold text-navy">
            Source type
          </label>
          <select
            id={sourceTypeId}
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as SourceType)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            {SOURCE_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={declaredTotalId} className="mb-2 block text-sm font-semibold text-navy">
            Declared total <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id={declaredTotalId}
            type="number"
            inputMode="decimal"
            step="0.01"
            value={declaredTotal}
            onChange={(e) => setDeclaredTotal(e.target.value)}
            placeholder="e.g. 17000.00"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          />
          <p className="mt-1 text-xs text-muted">
            Used to reconcile against the computed total from the file, if provided.
          </p>
        </div>

        {formError ? (
          <p role="alert" className="text-sm font-semibold text-danger">
            {formError}
          </p>
        ) : null}

        <PillButton type="submit" disabled={isUploading}>
          {isUploading ? "Uploading…" : "Upload and parse"}
        </PillButton>
      </form>

      <ImportResultPanel outcome={outcome} />
    </div>
  );
}

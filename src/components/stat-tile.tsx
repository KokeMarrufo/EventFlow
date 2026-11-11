import type { ReactNode } from "react";

type Tone = "navy" | "sky" | "gold" | "success" | "danger";

const toneClasses: Record<Tone, string> = {
  navy: "bg-navy text-white",
  sky: "bg-sky text-white",
  gold: "bg-gold text-navy",
  success: "bg-success text-white",
  danger: "bg-danger text-white",
};

export function StatTile({
  label,
  value,
  tone = "navy",
  rotate = "none",
  overlap = false,
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
  /** Subtle alternating tilt, used to get the "bold overlapping cards" look. */
  rotate?: "left" | "right" | "none";
  /** Pull the tile left into its sibling at sm+ widths (stacks cleanly on mobile). */
  overlap?: boolean;
}) {
  const rotateClass = rotate === "left" ? "sm:-rotate-1" : rotate === "right" ? "sm:rotate-1" : "";
  const overlapClass = overlap ? "sm:-ml-6" : "";

  return (
    <div
      className={`relative w-full rounded-2xl p-5 shadow-lg sm:w-56 ${toneClasses[tone]} ${rotateClass} ${overlapClass}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold sm:text-3xl">{value}</p>
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:gap-0">{children}</div>;
}

import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-navy",
  secondary: "border border-primary text-primary bg-transparent hover:bg-blue-subtle shadow-none",
  ghost: "border border-white/25 text-white hover:bg-white/10 shadow-none",
  destructive: "bg-crimson text-white hover:bg-crimson-dark",
};

type BaseProps = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

type LinkVariant = BaseProps & {
  href: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  type?: never;
  disabled?: never;
};

type ButtonVariant = BaseProps & {
  href?: undefined;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

export type PillButtonProps = LinkVariant | ButtonVariant;

/**
 * Standard action button (4px-radius "soft" shape per the design system,
 * not a full pill despite the name — kept for import-path stability).
 * Renders an anchor (via next/link) when given `href`, otherwise a native
 * button.
 */
export function PillButton(props: PillButtonProps) {
  const { variant = "primary", className = "", children } = props;
  const classes = `${base} ${variantClasses[variant]} ${className}`.trim();

  if (props.href !== undefined) {
    return (
      <Link href={props.href} onClick={props.onClick} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      disabled={props.disabled}
      onClick={props.onClick}
      className={classes}
    >
      {children}
    </button>
  );
}

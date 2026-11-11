import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50";

const variantClasses: Record<Variant, string> = {
  primary: "bg-gold text-navy hover:bg-gold-dark",
  secondary: "border border-sky text-sky-dark bg-transparent hover:bg-sky hover:text-white",
  ghost: "border border-white/30 text-white hover:bg-white/10",
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
 * Rounded "pill" button mirroring the Mission's filled/outline CTA
 * treatment. Renders an anchor (via next/link) when given `href`, otherwise
 * a native button.
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

import * as React from "react";
import { cx } from "./tca";

type Variant = "primary" | "secondary" | "ghost";

export type TcaButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

export function TcaButton({
  variant = "primary",
  fullWidth,
  className,
  ...props
}: TcaButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-[transform,box-shadow,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] active:translate-y-[1px]";

  const variants: Record<Variant, string> = {
    primary:
      "bg-[var(--color-brand-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-brand-primary-hover)] hover:shadow-[var(--shadow-glow)]",
    secondary:
      "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] hover:shadow-md",
    ghost:
      "bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]",
  };

  return (
    <button
      className={cx(base, variants[variant], fullWidth ? "w-full" : undefined, className)}
      {...props}
    />
  );
}

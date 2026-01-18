import * as React from "react";
import { cx } from "./tca";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

export type TcaButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

export function TcaButton({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  disabled,
  ...props
}: TcaButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

  const sizes: Record<Size, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variants: Record<Variant, string> = {
    primary:
      "bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-primary-hover)] text-white shadow-sm hover:shadow-lg hover:shadow-[var(--color-brand-primary)]/25 hover:-translate-y-0.5 active:translate-y-0",
    secondary:
      "bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border)] shadow-xs hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-text-muted)]",
    outline:
      "bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]",
    ghost:
      "bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]",
  };

  return (
    <button
      className={cx(
        base, 
        sizes[size], 
        variants[variant], 
        fullWidth && "w-full", 
        className
      )}
      disabled={disabled}
      {...props}
    />
  );
}

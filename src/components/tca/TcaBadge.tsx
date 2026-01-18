import * as React from "react";
import { cx } from "./tca";

type BadgeVariant = "default" | "info" | "warning" | "secondary" | "success" | "error";

export type TcaBadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function TcaBadge({
  variant = "default",
  className,
  ...props
}: TcaBadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default:
      "border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]",
    info:
      "border-blue-500/30 bg-blue-500/10 text-blue-600",
    warning:
      "border-orange-500/30 bg-orange-500/10 text-orange-600",
    secondary:
      "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]",
    success:
      "border-green-500/30 bg-green-500/10 text-green-600",
    error:
      "border-red-500/30 bg-red-500/10 text-red-600",
  };

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

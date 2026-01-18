import * as React from "react";
import { cx } from "./tca";

export function TcaBadge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]",
        className,
      )}
      {...props}
    />
  );
}

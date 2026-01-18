import * as React from "react";
import { cx } from "./tca";

export type TcaCardProps = React.HTMLAttributes<HTMLDivElement> & {
  elevated?: boolean;
};

export function TcaCard({ elevated, className, ...props }: TcaCardProps) {
  return (
    <div
      className={cx(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-shadow duration-200",
        elevated 
          ? "shadow-md bg-[var(--color-surface-elevated)]" 
          : "shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function TcaCardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cx(
        "px-5 py-4 border-b border-[var(--color-border-subtle)]", 
        props.className
      )} 
      {...props} 
    />
  );
}

export function TcaCardBody(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("px-5 py-4", props.className)} {...props} />;
}

export function TcaCardFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cx(
        "px-5 py-4 border-t border-[var(--color-border-subtle)]", 
        props.className
      )} 
      {...props} 
    />
  );
}

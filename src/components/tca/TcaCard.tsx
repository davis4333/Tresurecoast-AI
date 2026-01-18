import * as React from "react";
import { cx } from "./tca";

export type TcaCardProps = React.HTMLAttributes<HTMLDivElement> & {
  glow?: boolean;
};

export function TcaCard({ glow, className, ...props }: TcaCardProps) {
  return (
    <div
      className={cx(
        "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg",
        glow ? "shadow-[var(--shadow-glow)]" : undefined,
        className,
      )}
      {...props}
    />
  );
}

export function TcaCardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("px-6 pt-6", props.className)} {...props} />;
}

export function TcaCardBody(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("px-6 py-5", props.className)} {...props} />;
}

export function TcaCardFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("px-6 pb-6", props.className)} {...props} />;
}

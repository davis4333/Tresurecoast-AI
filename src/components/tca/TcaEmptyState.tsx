import * as React from "react";
import { cx } from "./tca";
import { TcaButton } from "./TcaButton";

export interface TcaEmptyStateProps {
  /**
   * The icon to display (Lucide React component or custom element)
   */
  icon?: React.ReactNode;

  /**
   * The main heading text
   */
  title: string;

  /**
   * Optional description text
   */
  description?: string;

  /**
   * Optional action button
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline";
  };

  /**
   * Optional secondary action (e.g., "Learn more")
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };

  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * TcaEmptyState - Standardized empty state component
 *
 * Usage:
 * ```tsx
 * <TcaEmptyState
 *   icon={<Package className="w-12 h-12" />}
 *   title="No bots yet"
 *   description="Create your first bot to start engaging with visitors"
 *   action={{ label: "Create Bot", onClick: () => router.push('/app/bots/new') }}
 * />
 * ```
 */
export function TcaEmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  className,
}: TcaEmptyStateProps) {
  const sizes = {
    sm: {
      container: "py-6",
      icon: "mb-2",
      title: "text-base",
      description: "text-xs",
      maxWidth: "max-w-xs",
    },
    md: {
      container: "py-8",
      icon: "mb-3",
      title: "text-lg",
      description: "text-sm",
      maxWidth: "max-w-md",
    },
    lg: {
      container: "py-12",
      icon: "mb-4",
      title: "text-xl",
      description: "text-base",
      maxWidth: "max-w-lg",
    },
  };

  const sizeClasses = sizes[size];

  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center text-center",
        sizeClasses.container,
        className
      )}
    >
      {icon && (
        <div
          className={cx(
            "text-[var(--color-text-muted)] opacity-50",
            sizeClasses.icon
          )}
        >
          {icon}
        </div>
      )}

      <h3
        className={cx(
          "font-semibold text-[var(--color-text-primary)] mb-2",
          sizeClasses.title
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cx(
            "text-[var(--color-text-muted)] mx-auto mb-4",
            sizeClasses.description,
            sizeClasses.maxWidth
          )}
        >
          {description}
        </p>
      )}

      {action && (
        <div className="flex items-center gap-3">
          <TcaButton
            variant={action.variant || "primary"}
            size={size === "sm" ? "sm" : "md"}
            onClick={action.onClick}
          >
            {action.label}
          </TcaButton>

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={cx(
                "text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-hover)] transition-colors",
                size === "sm" ? "text-xs" : "text-sm"
              )}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { AlertTriangle } from 'lucide-react';

interface UsageMeterProps {
  label: string;
  current: number;
  limit: number;
  usagePercent: number;
  unit?: string;
  showUpgradeButton?: boolean;
  onUpgrade?: () => void;
}

export function UsageMeter({
  label,
  current,
  limit,
  usagePercent,
  unit = 'items',
  showUpgradeButton = false,
  onUpgrade,
}: UsageMeterProps) {
  const isNearLimit = usagePercent >= 80;
  const isAtLimit = usagePercent >= 100;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {label}
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {current.toLocaleString()}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
              / {limit.toLocaleString()} {unit}
            </span>
          </p>
        </div>
        {isNearLimit && (
          <AlertTriangle
            className={`h-5 w-5 ${
              isAtLimit
                ? 'text-red-500'
                : 'text-yellow-500'
            }`}
          />
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all ${
              isAtLimit
                ? 'bg-red-500'
                : isNearLimit
                ? 'bg-yellow-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {usagePercent}% used
        </p>
      </div>

      {/* Warning/Upgrade Message */}
      {isAtLimit && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-3">
          <p className="text-sm text-red-800 dark:text-red-200 font-medium">
            Limit reached
          </p>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            You&apos;ve hit your {label.toLowerCase()} limit. Upgrade to continue.
          </p>
        </div>
      )}

      {isNearLimit && !isAtLimit && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3 mb-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
            Approaching limit
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
            You&apos;re using {usagePercent}% of your {label.toLowerCase()}. Consider upgrading.
          </p>
        </div>
      )}

      {/* Upgrade Button */}
      {showUpgradeButton && onUpgrade && (isNearLimit || isAtLimit) && (
        <button
          onClick={onUpgrade}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
        >
          Upgrade Plan
        </button>
      )}
    </div>
  );
}

/**
 * Client-side validation helpers for services editor UI
 */

/**
 * Convert dollars (string or number) to cents (integer)
 * Handles "$10.50", "10.50", 10.50, etc.
 * Returns null if invalid
 */
export function dollarsToCents(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const strValue = String(value).replace(/[$,\s]/g, "").trim();
  
  if (strValue === "") {
    return null;
  }

  const parsed = parseFloat(strValue);
  
  if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * 100);
}

/**
 * Convert cents (integer) to display dollars (string)
 * Returns formatted string like "$10.50"
 */
export function centsToDollars(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) {
    return "";
  }
  
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format cents for input field (without $ sign)
 */
export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) {
    return "";
  }
  return (cents / 100).toFixed(2);
}

/**
 * Normalize and validate URL
 * Returns trimmed URL or null if empty/invalid
 */
export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }
  
  const trimmed = url.trim();
  if (trimmed === "") {
    return null;
  }

  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    return null;
  }
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url || url.trim() === "") {
    return true;
  }
  
  try {
    new URL(url.trim());
    return true;
  } catch {
    return false;
  }
}

/**
 * Truncate URL for display with ellipsis
 */
export function truncateUrl(url: string | null | undefined, maxLength: number = 30): string {
  if (!url) {
    return "";
  }
  
  const trimmed = url.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  
  return trimmed.substring(0, maxLength - 3) + "...";
}

/**
 * Reorder a list of items by moving an item from one position to another
 * Returns new array with updated displayOrder values (0-indexed)
 */
export function reorderItems<T extends { id: number; displayOrder: number }>(
  items: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  if (fromIndex === toIndex) {
    return items;
  }
  
  if (fromIndex < 0 || fromIndex >= items.length) {
    return items;
  }
  
  if (toIndex < 0 || toIndex >= items.length) {
    return items;
  }

  const result = [...items];
  const [moved] = result.splice(fromIndex, 1);
  if (moved) {
    result.splice(toIndex, 0, moved);
  }

  return result.map((item, index) => ({
    ...item,
    displayOrder: index,
  }));
}

/**
 * Compact display order values to 0..n-1
 */
export function compactDisplayOrder<T extends { displayOrder: number }>(
  items: T[]
): T[] {
  const sorted = [...items].sort((a, b) => a.displayOrder - b.displayOrder);
  return sorted.map((item, index) => ({
    ...item,
    displayOrder: index,
  }));
}

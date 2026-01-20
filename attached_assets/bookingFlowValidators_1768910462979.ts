/**
 * Step 42: Booking Flow Validators
 * Strict but reasonable validation for lead capture fields
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  /** Sanitized/normalized value */
  value?: string;
}

/**
 * Validate name input
 * Rules:
 * - Minimum 2 characters
 * - Maximum 100 characters
 * - Must contain at least one letter
 * - Can contain letters, spaces, hyphens, apostrophes
 */
export function validateName(input: string): ValidationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: "Please enter your name.",
    };
  }

  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: "Name must be at least 2 characters.",
    };
  }

  if (trimmed.length > 100) {
    return {
      isValid: false,
      error: "Name is too long (maximum 100 characters).",
    };
  }

  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(trimmed)) {
    return {
      isValid: false,
      error: "Name must contain at least one letter.",
    };
  }

  // Allow letters, spaces, hyphens, apostrophes, periods (for initials)
  // This covers most real names worldwide
  const validNamePattern = /^[a-zA-Z\s'\-\.]+$/;
  if (!validNamePattern.test(trimmed)) {
    return {
      isValid: false,
      error: "Name can only contain letters, spaces, hyphens, and apostrophes.",
    };
  }

  return {
    isValid: true,
    value: trimmed,
  };
}

/**
 * Validate phone number
 * Rules:
 * - Remove all formatting characters (spaces, dashes, parentheses, dots)
 * - Must be 10-15 digits (supports US and international)
 * - Can start with + for international
 */
export function validatePhone(input: string): ValidationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: "Please enter your phone number.",
    };
  }

  // Remove common formatting: spaces, dashes, parentheses, periods
  let cleaned = trimmed.replace(/[\s\-\(\)\. ]/g, "");

  // Handle international format with +
  const hasPlus = cleaned.startsWith("+");
  if (hasPlus) {
    cleaned = cleaned.substring(1);
  }

  // Must be all digits now
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      error: "Phone number can only contain digits and formatting characters.",
    };
  }

  // Length check: 10-15 digits (US is 10, international can be longer)
  if (cleaned.length < 10) {
    return {
      isValid: false,
      error: "Phone number must be at least 10 digits.",
    };
  }

  if (cleaned.length > 15) {
    return {
      isValid: false,
      error: "Phone number is too long (maximum 15 digits).",
    };
  }

  // Return normalized format with + if it had one
  const normalized = hasPlus ? `+${cleaned}` : cleaned;

  return {
    isValid: true,
    value: normalized,
  };
}

/**
 * Validate email address
 * Rules:
 * - RFC 5322 compliant (reasonable subset)
 * - Maximum 254 characters (RFC limit)
 * - Must have @ and domain
 */
export function validateEmail(input: string): ValidationResult {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) {
    return {
      isValid: false,
      error: "Please enter your email address.",
    };
  }

  if (trimmed.length > 254) {
    return {
      isValid: false,
      error: "Email address is too long.",
    };
  }

  // Reasonable email regex (not perfect, but catches 99% of cases)
  // Format: localpart@domain.tld
  const emailPattern = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

  if (!emailPattern.test(trimmed)) {
    return {
      isValid: false,
      error: "Please enter a valid email address (e.g., name@example.com).",
    };
  }

  // Additional check: must have exactly one @
  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount !== 1) {
    return {
      isValid: false,
      error: "Email address must contain exactly one @ symbol.",
    };
  }

  // Check domain has at least one dot
  const domain = trimmed.split("@")[1];
  if (!domain.includes(".")) {
    return {
      isValid: false,
      error: "Email address must have a valid domain (e.g., example.com).",
    };
  }

  return {
    isValid: true,
    value: trimmed,
  };
}

/**
 * Helper: check if input looks like a service selection (numeric ID or service name)
 */
export function looksLikeServiceSelection(input: string): boolean {
  const trimmed = input.trim();
  
  // Check if it's a number (service ID)
  if (/^\d+$/.test(trimmed)) {
    return true;
  }

  // Check if it's short enough to be a service name selection
  // (vs. a full sentence that happens to mention a service)
  if (trimmed.length < 50 && trimmed.split(" ").length <= 5) {
    return true;
  }

  return false;
}

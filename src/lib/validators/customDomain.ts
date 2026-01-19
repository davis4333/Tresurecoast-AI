import { z } from "zod";

/**
 * Domain validation regex:
 * - allows subdomains
 * - disallows protocol, paths, ports
 */
const DOMAIN_REGEX =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

export function normalizeDomain(input: unknown): string | null {
  if (input == null) return null;
  if (typeof input !== "string") return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  let normalized = trimmed.toLowerCase();

  // Remove protocol
  normalized = normalized.replace(/^https?:\/\//, "");

  // Remove path/query/hash
  normalized = normalized.split("/")[0] ?? "";
  normalized = normalized.split("?")[0] ?? "";
  normalized = normalized.split("#")[0] ?? "";

  // Remove port
  normalized = normalized.split(":")[0] ?? "";

  // Remove trailing dot
  normalized = normalized.replace(/\.$/, "");

  return normalized || null;
}

export function isValidDomain(domain: string | null): boolean {
  if (!domain) return false;
  if (domain.length > 253) return false;
  return DOMAIN_REGEX.test(domain);
}

export const CustomDomainInputSchema = z.object({
  customDomain: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeDomain)
    .refine(
      (val) => val == null || isValidDomain(val),
      "Invalid domain format. Use: example.com or chat.example.com (no protocol, no paths, no ports)"
    ),
});

export type CustomDomainInput = z.infer<typeof CustomDomainInputSchema>;

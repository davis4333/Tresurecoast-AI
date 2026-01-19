import { randomBytes } from "crypto";
import { resolveTxt } from "dns/promises";

export type VerificationResult =
  | { success: true; verifiedAt: Date }
  | { success: false; reason: string };

export function generateVerificationToken(): string {
  // 32 bytes => 64 hex chars
  return randomBytes(32).toString("hex");
}

/**
 * Looks for a TXT record that starts with: tca-verify=<token>
 */
export async function verifyDomainOwnership(
  domain: string,
  expectedToken: string
): Promise<VerificationResult> {
  try {
    const txtRecords = await resolveTxt(domain);
    const flat = txtRecords.map((parts) => parts.join(""));

    const record = flat.find((r) => r.startsWith("tca-verify="));
    if (!record) return { success: false, reason: "txt_missing" };

    const actualToken = record.replace("tca-verify=", "").trim();
    if (actualToken !== expectedToken) {
      return { success: false, reason: "token_mismatch" };
    }

    return { success: true, verifiedAt: new Date() };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code || "unknown";
    const reasonMap: Record<string, string> = {
      ENOTFOUND: "domain_not_found",
      ENODATA: "txt_missing",
      ETIMEOUT: "lookup_timeout",
      ESERVFAIL: "dns_server_error",
      ECONNREFUSED: "dns_server_error",
    };
    return { success: false, reason: reasonMap[code] || "dns_lookup_failed" };
  }
}

export function getVerificationErrorMessage(reason: string): string {
  const messages: Record<string, string> = {
    txt_missing:
      "No TXT record found. Add the verification TXT record and wait for DNS propagation.",
    token_mismatch:
      "TXT record found but the token doesn't match. Double-check the TXT value.",
    domain_not_found:
      "Domain not found. Make sure the domain exists and DNS is configured.",
    lookup_timeout:
      "DNS lookup timed out. Try again in a few minutes.",
    dns_server_error:
      "DNS server error. Verify your nameservers are working.",
    dns_lookup_failed:
      "DNS lookup failed. Check your DNS configuration and try again.",
  };
  return messages[reason] || "Verification failed. Please try again.";
}

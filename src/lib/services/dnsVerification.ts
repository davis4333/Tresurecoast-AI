import { promises as dns } from "dns";
import { randomBytes } from "crypto";

export type VerificationResult =
  | { ok: true; verifiedAt: Date }
  | { ok: false; reason: string };

export function generateVerificationToken(): string {
  return randomBytes(32).toString("hex"); // 64 hex chars
}

export async function verifyDomainTxt(domain: string, expectedToken: string): Promise<VerificationResult> {
  try {
    const txtRecords = await dns.resolveTxt(domain);
    const flat = txtRecords.map((parts) => parts.join(""));

    const rec = flat.find((r) => r.startsWith("tca-verify="));
    if (!rec) return { ok: false, reason: "txt_missing" };

    const actual = rec.replace("tca-verify=", "").trim();
    if (actual !== expectedToken) return { ok: false, reason: "token_mismatch" };

    return { ok: true, verifiedAt: new Date() };
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code || "unknown";
    const map: Record<string, string> = {
      ENOTFOUND: "domain_not_found",
      ENODATA: "txt_missing",
      ETIMEOUT: "lookup_timeout",
      ESERVFAIL: "dns_server_error",
    };
    return { ok: false, reason: map[code] || "dns_lookup_failed" };
  }
}

export function humanizeFailure(reason: string): string {
  const m: Record<string, string> = {
    txt_missing: "No TXT record found yet. Add the TXT record and try again.",
    token_mismatch: "TXT record found, but the token doesn't match. Check the value.",
    domain_not_found: "Domain not found. Check DNS and that the domain exists.",
    lookup_timeout: "DNS lookup timed out. Try again soon.",
    dns_server_error: "DNS server error. Try again soon.",
    dns_lookup_failed: "DNS lookup failed. Check DNS configuration.",
  };
  return m[reason] || "Verification failed. Try again.";
}

import { z } from "zod";

const DOMAIN_REGEX =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;

export function normalizeDomainOrNull(input: unknown): string | null {
  if (input == null) return null;
  if (typeof input !== "string") return null;

  const raw = input.trim();
  if (!raw) return null;

  if (raw.includes("/") || raw.includes("?") || raw.includes("#")) {
    throw new Error("Invalid domain format. Do not include paths.");
  }

  let v = raw.toLowerCase();

  v = v.replace(/^https?:\/\//, "");
  v = v.replace(/\/$/, "");

  if (v.includes(":")) {
    throw new Error("Invalid domain format. Do not include ports.");
  }

  v = v.replace(/\.$/, "");

  if (!DOMAIN_REGEX.test(v)) {
    throw new Error("Invalid domain format. Use: example.com or chat.example.com");
  }

  return v;
}

export const CustomDomainInputSchema = z.object({
  customDomain: z.union([z.string(), z.null(), z.undefined()]).transform((val) => {
    return normalizeDomainOrNull(val);
  }),
});

export type CustomDomainInput = z.infer<typeof CustomDomainInputSchema>;

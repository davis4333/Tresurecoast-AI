import { prisma } from "@/lib/prisma";

export type HostPolicyResult =
  | { ok: true; mode: "platform" | "custom_domain"; host: string; orgId?: number }
  | { ok: false; status: 400 | 403 | 500; error: string; message: string };

export function getRequestHost(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-host");
  const host = forwarded || req.headers.get("host");
  if (!host) return null;
  const normalized = host.split(":")[0]?.toLowerCase().trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

export function getOriginHost(req: Request): string | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export async function resolveHostPolicy(req: Request): Promise<HostPolicyResult> {
  const host = getRequestHost(req);
  if (!host) {
    return { ok: false, status: 400, error: "missing_host", message: "Host header is required" };
  }

  try {
    const org = await prisma.organization.findFirst({
      where: { customDomain: host },
      select: { id: true, customDomainStatus: true },
    });

    if (!org) {
      return { ok: true, mode: "platform", host };
    }

    if (org.customDomainStatus !== "verified") {
      return {
        ok: false,
        status: 403,
        error: "custom_domain_not_verified",
        message: "Custom domain is not verified yet",
      };
    }

    return { ok: true, mode: "custom_domain", host, orgId: org.id };
  } catch (error) {
    console.error("[HOST POLICY DB ERROR]", error);
    return { ok: false, status: 500, error: "internal_error", message: "Failed to resolve host policy" };
  }
}

export function isHostAllowed(
  allowlist: string[] | null | undefined,
  origin: string | null,
  host: string | null
): boolean {
  const domains = allowlist ?? [];
  if (domains.length === 0) return true;

  let hostname: string | null = null;

  if (origin) {
    try {
      hostname = new URL(origin).hostname;
    } catch {
      // ignore invalid origin
    }
  }

  if (!hostname && host) {
    hostname = host.split(":")[0] || null;
  }

  if (!hostname) return false;

  hostname = hostname.toLowerCase();

  for (const allowed of domains) {
    const normalizedAllowed = allowed.trim().toLowerCase();
    if (!normalizedAllowed) continue;

    if (hostname === normalizedAllowed) return true;
    if (hostname.endsWith("." + normalizedAllowed)) return true;
  }

  return false;
}

export async function enforceTenantBinding(opts: {
  req: Request;
  botOrgId: number;
}): Promise<HostPolicyResult> {
  const policy = await resolveHostPolicy(opts.req);

  if (!policy.ok) {
    return policy;
  }

  if (policy.mode === "platform") {
    return policy;
  }

  if (policy.orgId !== opts.botOrgId) {
    return {
      ok: false,
      status: 403,
      error: "cross_tenant_host",
      message: "Host is bound to a different organization",
    };
  }

  return policy;
}

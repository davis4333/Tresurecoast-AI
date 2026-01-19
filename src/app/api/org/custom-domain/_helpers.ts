import { prisma } from "@/lib/prisma";

/**
 * MATCH STEP 25 PATTERN EXACTLY.
 */
function isDevBypass(): boolean {
  return process.env.DEV_BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";
}

async function getClerkAuth(): Promise<{ userId: string | null }> {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    return await auth();
  } catch {
    return { userId: null };
  }
}

/**
 * MATCH STEP 25 ORG RESOLUTION:
 * - No OrganizationMember table
 * - Just grabs the first org (orderBy id asc)
 * - Returns role as AGENCY_OWNER (same as Step 25)
 */
export async function getOrgContext() {
  const { userId } = await getClerkAuth();

  if (!isDevBypass() && !userId) {
    return { ok: false as const, status: 401 as const, error: "unauthorized", message: "Authentication required" };
  }

  const org = await prisma.organization.findFirst({
    orderBy: { id: "asc" },
    select: {
      id: true,
      customDomain: true,
      domainVerificationToken: true,
      customDomainStatus: true,
      customDomainVerifiedAt: true,
      customDomainLastCheckedAt: true,
      customDomainFailureReason: true,
    },
  });

  if (!org) {
    return { ok: false as const, status: 404 as const, error: "not_found", message: "Organization not found" };
  }

  return { ok: true as const, org, role: "AGENCY_OWNER" as const };
}

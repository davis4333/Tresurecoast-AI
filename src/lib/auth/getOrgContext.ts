import { prisma } from "@/lib/prisma";

export type OrgRole = "AGENCY_OWNER" | "AGENCY_ADMIN" | "CLIENT";

export type OrgContextResult =
  | {
      ok: true;
      org: {
        id: number;
        name: string;
        clerkOrganizationId: string | null;
        [key: string]: unknown;
      };
      role: OrgRole;
      userId: string;
    }
  | {
      ok: false;
      status: 401 | 403 | 404 | 500;
      error: string;
      message: string;
    };

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const DEV_BYPASS_AUTH = process.env.DEV_BYPASS_AUTH === "true";
const DEV_BOOTSTRAP_CLERK_USER_ID = process.env.DEV_BOOTSTRAP_CLERK_USER_ID;
const DEV_BOOTSTRAP_CLERK_ORG_ID = process.env.DEV_BOOTSTRAP_CLERK_ORG_ID;

export interface GetOrgContextOptions {
  explicitOrgId?: string;
  testUserId?: string;
}

export async function getOrgContext(options?: GetOrgContextOptions | string): Promise<OrgContextResult> {
  const opts: GetOrgContextOptions = typeof options === "string" ? { explicitOrgId: options } : options || {};
  const { explicitOrgId, testUserId } = opts;

  try {
    let userId: string | null = null;
    let clerkOrgId: string | null = null;
    let useMembershipLookup = false;

    if (DEV_BYPASS_AUTH && !IS_PRODUCTION) {
      const effectiveUserId = testUserId || DEV_BOOTSTRAP_CLERK_USER_ID;
      if (!effectiveUserId) {
        return {
          ok: false,
          status: 500,
          error: "dev_bootstrap_missing",
          message: "DEV_BYPASS_AUTH=true requires DEV_BOOTSTRAP_CLERK_USER_ID in development.",
        };
      }

      userId = effectiveUserId;
      clerkOrgId = explicitOrgId || DEV_BOOTSTRAP_CLERK_ORG_ID || null;

      if (clerkOrgId) {
        await bootstrapDevEnvironment(userId, clerkOrgId);
      } else {
        useMembershipLookup = true;
      }
    } else {
      const { auth } = await import("@clerk/nextjs/server");
      const clerkAuth = await auth();

      userId = clerkAuth.userId;
      clerkOrgId = explicitOrgId || (clerkAuth as Record<string, unknown>).orgId as string | null || null;

      if (!userId) {
        return { ok: false, status: 401, error: "unauthorized", message: "Authentication required" };
      }
      if (!clerkOrgId) {
        useMembershipLookup = true;
      }
    }

    if (useMembershipLookup) {
      const membership = await prisma.organizationMember.findFirst({
        where: { clerkUserId: userId! },
        include: { organization: true },
        orderBy: { organizationId: "asc" },
      });

      if (!membership) {
        return {
          ok: false,
          status: 403,
          error: "no_membership",
          message: "You are not a member of any organization",
        };
      }

      const validRoles: OrgRole[] = ["AGENCY_OWNER", "AGENCY_ADMIN", "CLIENT"];
      if (!validRoles.includes(membership.role as OrgRole)) {
        return { ok: false, status: 403, error: "invalid_role", message: "Invalid organization role" };
      }

      return { ok: true, org: membership.organization, role: membership.role as OrgRole, userId: userId! };
    }

    const org = await prisma.organization.findUnique({
      where: { clerkOrganizationId: clerkOrgId! },
    });

    if (!org) {
      return {
        ok: false,
        status: 404,
        error: "org_not_found",
        message: "Organization not found or not linked to Clerk organization",
      };
    }

    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_clerkUserId: {
          organizationId: org.id,
          clerkUserId: userId!,
        },
      },
    });

    if (!membership) {
      return {
        ok: false,
        status: 403,
        error: "no_membership",
        message: "You are not a member of this organization",
      };
    }

    const validRoles: OrgRole[] = ["AGENCY_OWNER", "AGENCY_ADMIN", "CLIENT"];
    if (!validRoles.includes(membership.role as OrgRole)) {
      return {
        ok: false,
        status: 403,
        error: "invalid_role",
        message: "Invalid organization role",
      };
    }

    return { ok: true, org, role: membership.role as OrgRole, userId: userId! };
  } catch (error) {
    console.error("[getOrgContext] Error:", error);
    return { ok: false, status: 500, error: "internal_error", message: "Failed to resolve organization context" };
  }
}

async function bootstrapDevEnvironment(clerkUserId: string, clerkOrgId: string): Promise<void> {
  let org = await prisma.organization.findUnique({ where: { clerkOrganizationId: clerkOrgId } });

  if (!org) {
    org = await prisma.organization.create({
      data: { name: "Dev Bootstrap Org", clerkOrganizationId: clerkOrgId },
    });
    console.log(`[DEV BOOTSTRAP] Created org ${org.id} for ${clerkOrgId}`);
  }

  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_clerkUserId: { organizationId: org.id, clerkUserId } },
  });

  if (!membership) {
    await prisma.organizationMember.create({
      data: { organizationId: org.id, clerkUserId, role: "AGENCY_OWNER" },
    });
    console.log(`[DEV BOOTSTRAP] Created AGENCY_OWNER membership for ${clerkUserId} in org ${org.id}`);
  }
}

export function isAdmin(role: OrgRole): boolean {
  return role === "AGENCY_OWNER" || role === "AGENCY_ADMIN";
}

export function isOwner(role: OrgRole): boolean {
  return role === "AGENCY_OWNER";
}

const VALID_TEST_USER_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_TEST_USER_ID_LENGTH = 128;

function isTestAuthOverrideEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_BYPASS_AUTH === "true" &&
    process.env.PLAYWRIGHT_TEST === "true"
  );
}

function validateTestUserId(value: string | null): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > MAX_TEST_USER_ID_LENGTH) return undefined;
  if (!VALID_TEST_USER_ID_PATTERN.test(trimmed)) return undefined;

  return trimmed;
}

export function getTestUserId(request: Request): string | undefined {
  if (!isTestAuthOverrideEnabled()) {
    return undefined;
  }

  const rawValue = request.headers.get("x-test-user-id");
  const validatedUserId = validateTestUserId(rawValue);

  if (validatedUserId) {
    console.log(`[TEST AUTH OVERRIDE] using X-Test-User-Id=${validatedUserId}`);
  }

  return validatedUserId;
}

export { isTestAuthOverrideEnabled as _isTestAuthOverrideEnabled_forTesting };

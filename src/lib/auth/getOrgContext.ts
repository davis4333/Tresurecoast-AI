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

export async function getOrgContext(explicitOrgId?: string): Promise<OrgContextResult> {
  try {
    let userId: string | null = null;
    let clerkOrgId: string | null = null;

    if (DEV_BYPASS_AUTH && !IS_PRODUCTION) {
      if (!DEV_BOOTSTRAP_CLERK_USER_ID || !DEV_BOOTSTRAP_CLERK_ORG_ID) {
        return {
          ok: false,
          status: 500,
          error: "dev_bootstrap_missing",
          message:
            "DEV_BYPASS_AUTH=true requires DEV_BOOTSTRAP_CLERK_USER_ID and DEV_BOOTSTRAP_CLERK_ORG_ID in development.",
        };
      }

      userId = DEV_BOOTSTRAP_CLERK_USER_ID;
      clerkOrgId = explicitOrgId || DEV_BOOTSTRAP_CLERK_ORG_ID;

      await bootstrapDevEnvironment(userId, clerkOrgId);
    } else {
      const { auth } = await import("@clerk/nextjs/server");
      const clerkAuth = await auth();

      userId = clerkAuth.userId;
      clerkOrgId = explicitOrgId || (clerkAuth as Record<string, unknown>).orgId as string | null || null;

      if (!userId) {
        return { ok: false, status: 401, error: "unauthorized", message: "Authentication required" };
      }
      if (!clerkOrgId) {
        return {
          ok: false,
          status: 403,
          error: "no_org_context",
          message: "No organization context. Please select an organization.",
        };
      }
    }

    const org = await prisma.organization.findUnique({
      where: { clerkOrganizationId: clerkOrgId },
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

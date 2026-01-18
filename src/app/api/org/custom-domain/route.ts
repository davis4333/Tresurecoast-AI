import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CustomDomainInputSchema } from "@/lib/validators/customDomain";
import { generateVerificationToken } from "@/lib/services/dnsVerification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(requestId: string, status: number, error: string, message: string, details?: unknown) {
  return NextResponse.json({ ok: false, requestId, error, message, details }, { status });
}

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

function isAgencyAdmin(role: string) {
  return role === "AGENCY_OWNER" || role === "AGENCY_ADMIN";
}

async function getOrganizationForUser(userId: string | null) {
  if (isDevBypass()) {
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
    return org ? { organization: org, role: "AGENCY_OWNER" as const } : null;
  }

  if (!userId) return null;

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

  return org ? { organization: org, role: "AGENCY_OWNER" as const } : null;
}

export async function GET() {
  const requestId = crypto.randomUUID();
  try {
    const { userId } = await getClerkAuth();

    if (!isDevBypass() && !userId) {
      return jsonError(requestId, 401, "unauthorized", "Authentication required");
    }

    const result = await getOrganizationForUser(userId);
    if (!result) {
      return jsonError(requestId, 404, "not_found", "Organization not found");
    }

    const admin = isAgencyAdmin(result.role);
    const org = result.organization;

    return NextResponse.json({
      ok: true,
      domain: {
        customDomain: org.customDomain,
        status: org.customDomainStatus,
        verifiedAt: org.customDomainVerifiedAt,
        lastCheckedAt: org.customDomainLastCheckedAt,
        failureReason: org.customDomainFailureReason,
        verificationToken: admin ? org.domainVerificationToken : null,
        canEdit: admin,
      },
    });
  } catch {
    return jsonError(requestId, 500, "internal_error", "Failed to load custom domain settings");
  }
}

export async function PUT(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const { userId } = await getClerkAuth();

    if (!isDevBypass() && !userId) {
      return jsonError(requestId, 401, "unauthorized", "Authentication required");
    }

    const result = await getOrganizationForUser(userId);
    if (!result) {
      return jsonError(requestId, 404, "not_found", "Organization not found");
    }

    if (!isAgencyAdmin(result.role)) {
      return jsonError(requestId, 403, "forbidden", "Only agency admins can set custom domains");
    }

    let parsed: { customDomain: string | null };
    try {
      const body = await req.json();
      const v = CustomDomainInputSchema.parse(body);
      parsed = { customDomain: v.customDomain };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Invalid input";
      return jsonError(requestId, 400, "validation_error", message);
    }

    if (parsed.customDomain) {
      const existing = await prisma.organization.findFirst({
        where: {
          customDomain: parsed.customDomain,
          id: { not: result.organization.id },
        },
        select: { id: true },
      });
      if (existing) {
        return jsonError(requestId, 409, "domain_taken", "Domain already in use by another organization");
      }
    }

    const token = parsed.customDomain ? generateVerificationToken() : null;

    const updated = await prisma.organization.update({
      where: { id: result.organization.id },
      data: {
        customDomain: parsed.customDomain,
        domainVerificationToken: token,
        customDomainStatus: parsed.customDomain ? "pending" : "none",
        customDomainVerifiedAt: null,
        customDomainLastCheckedAt: null,
        customDomainFailureReason: null,
      },
      select: {
        customDomain: true,
        domainVerificationToken: true,
        customDomainStatus: true,
      },
    });

    return NextResponse.json({
      ok: true,
      domain: {
        customDomain: updated.customDomain,
        status: updated.customDomainStatus,
        verificationToken: updated.domainVerificationToken,
        canEdit: true,
      },
    });
  } catch {
    return jsonError(requestId, 500, "internal_error", "Failed to update custom domain");
  }
}

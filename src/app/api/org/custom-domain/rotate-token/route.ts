import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    },
  });

  return org ? { organization: org, role: "AGENCY_OWNER" as const } : null;
}

export async function POST() {
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
      return jsonError(requestId, 403, "forbidden", "Only agency admins can rotate tokens");
    }

    if (!result.organization.customDomain) {
      return jsonError(requestId, 400, "validation_error", "No custom domain configured");
    }

    const token = generateVerificationToken();

    const updated = await prisma.organization.update({
      where: { id: result.organization.id },
      data: {
        domainVerificationToken: token,
        customDomainStatus: "pending",
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
      },
    });
  } catch {
    return jsonError(requestId, 500, "internal_error", "Failed to rotate verification token");
  }
}

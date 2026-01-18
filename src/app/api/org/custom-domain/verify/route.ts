import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyDomainTxt, humanizeFailure } from "@/lib/services/dnsVerification";

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
    });
    return org ? { organization: org, role: "AGENCY_OWNER" as const } : null;
  }

  if (!userId) return null;

  const org = await prisma.organization.findFirst({
    orderBy: { id: "asc" },
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
      return jsonError(requestId, 403, "forbidden", "Only agency admins can verify domains");
    }

    const org = result.organization;
    if (!org.customDomain) {
      return jsonError(requestId, 400, "validation_error", "No custom domain configured");
    }
    if (!org.domainVerificationToken) {
      return jsonError(requestId, 400, "validation_error", "No verification token found");
    }

    const verifyResult = await verifyDomainTxt(org.customDomain, org.domainVerificationToken);

    if (verifyResult.ok) {
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          customDomainStatus: "verified",
          customDomainVerifiedAt: verifyResult.verifiedAt,
          customDomainLastCheckedAt: new Date(),
          customDomainFailureReason: null,
        },
      });

      return NextResponse.json({
        ok: true,
        verified: true,
        domain: { customDomain: org.customDomain, status: "verified", verifiedAt: verifyResult.verifiedAt },
      });
    }

    await prisma.organization.update({
      where: { id: org.id },
      data: {
        customDomainStatus: "failed",
        customDomainLastCheckedAt: new Date(),
        customDomainFailureReason: verifyResult.reason,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        verified: false,
        reason: verifyResult.reason,
        message: humanizeFailure(verifyResult.reason),
      },
      { status: 400 }
    );
  } catch {
    return jsonError(requestId, 500, "internal_error", "Failed to verify domain");
  }
}

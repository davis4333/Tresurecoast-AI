import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyDomainOwnership, getVerificationErrorMessage } from "@/lib/services/dnsVerification";
import { getOrgContext } from "../_helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const ctx = await getOrgContext();
  if (!ctx.ok) {
    return NextResponse.json({ ok: false, error: ctx.error, message: ctx.message }, { status: ctx.status });
  }

  const org = ctx.org;

  if (!org.customDomain) {
    return NextResponse.json({ ok: false, error: "validation_error", message: "No custom domain configured" }, { status: 400 });
  }
  if (!org.domainVerificationToken) {
    return NextResponse.json({ ok: false, error: "validation_error", message: "No verification token found. Save your domain again." }, { status: 400 });
  }

  const result = await verifyDomainOwnership(org.customDomain, org.domainVerificationToken);

  if (result.success) {
    const updated = await prisma.organization.update({
      where: { id: org.id },
      data: {
        customDomainStatus: "verified",
        customDomainVerifiedAt: result.verifiedAt,
        customDomainLastCheckedAt: new Date(),
        customDomainFailureReason: null,
      },
      select: {
        customDomain: true,
        customDomainStatus: true,
        customDomainVerifiedAt: true,
        customDomainLastCheckedAt: true,
        customDomainFailureReason: true,
        domainVerificationToken: true,
      },
    });

    return NextResponse.json({
      ok: true,
      verified: true,
      domain: {
        customDomain: updated.customDomain,
        status: updated.customDomainStatus,
        verifiedAt: updated.customDomainVerifiedAt,
        lastCheckedAt: updated.customDomainLastCheckedAt,
      },
    });
  }

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      customDomainStatus: "failed",
      customDomainLastCheckedAt: new Date(),
      customDomainFailureReason: result.reason,
    },
  });

  return NextResponse.json(
    {
      ok: false,
      verified: false,
      error: "verification_failed",
      message: getVerificationErrorMessage(result.reason),
      reason: result.reason,
    },
    { status: 400 }
  );
}

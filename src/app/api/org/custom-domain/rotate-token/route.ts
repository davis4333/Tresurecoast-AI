import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/services/dnsVerification";
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

  const newToken = generateVerificationToken();

  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: {
      domainVerificationToken: newToken,
      customDomainStatus: "pending",
      customDomainVerifiedAt: null,
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
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CustomDomainInputSchema } from "@/lib/validators/customDomain";
import { generateVerificationToken } from "@/lib/services/dnsVerification";
import { getOrgContext } from "./_helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const ctx = await getOrgContext();
  if (!ctx.ok) {
    return NextResponse.json({ ok: false, error: ctx.error, message: ctx.message }, { status: ctx.status });
  }

  return NextResponse.json({
    ok: true,
    domain: {
      customDomain: ctx.org.customDomain,
      status: ctx.org.customDomainStatus,
      verifiedAt: ctx.org.customDomainVerifiedAt,
      lastCheckedAt: ctx.org.customDomainLastCheckedAt,
      failureReason: ctx.org.customDomainFailureReason,
      verificationToken: ctx.org.domainVerificationToken,
    },
  });
}

export async function PUT(req: NextRequest) {
  const ctx = await getOrgContext();
  if (!ctx.ok) {
    return NextResponse.json({ ok: false, error: ctx.error, message: ctx.message }, { status: ctx.status });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = CustomDomainInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", message: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const customDomain = parsed.data.customDomain; // string|null

  if (customDomain) {
    const existing = await prisma.organization.findFirst({
      where: { customDomain, id: { not: ctx.org.id } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "domain_taken", message: "This domain is already registered to another organization" },
        { status: 409 }
      );
    }
  }

  const token = customDomain ? generateVerificationToken() : null;

  const updated = await prisma.organization.update({
    where: { id: ctx.org.id },
    data: {
      customDomain: customDomain,
      domainVerificationToken: token,
      customDomainStatus: customDomain ? "pending" : "none",
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
}

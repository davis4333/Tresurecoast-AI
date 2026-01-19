import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CustomDomainInputSchema } from "@/lib/validators/customDomain";
import { generateVerificationToken, isValidVerificationToken } from "@/lib/services/dnsVerification";
import { getOrgContext, isAdmin, getTestUserId } from "@/lib/auth/getOrgContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext({ testUserId: getTestUserId(req) });
  if (!ctx.ok) {
    return NextResponse.json({ ok: false, error: ctx.error, message: ctx.message }, { status: ctx.status });
  }

  const org = await prisma.organization.findUnique({
    where: { id: ctx.org.id },
    select: {
      customDomain: true,
      customDomainStatus: true,
      customDomainVerifiedAt: true,
      customDomainLastCheckedAt: true,
      customDomainFailureReason: true,
      domainVerificationToken: true,
    },
  });

  if (!org) {
    return NextResponse.json({ ok: false, error: "not_found", message: "Organization not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    domain: {
      customDomain: org.customDomain,
      status: org.customDomainStatus,
      verifiedAt: org.customDomainVerifiedAt,
      lastCheckedAt: org.customDomainLastCheckedAt,
      failureReason: org.customDomainFailureReason,
      verificationToken: isAdmin(ctx.role) ? org.domainVerificationToken : null,
    },
  });
}

export async function PUT(req: NextRequest) {
  const ctx = await getOrgContext({ testUserId: getTestUserId(req) });
  if (!ctx.ok) {
    return NextResponse.json({ ok: false, error: ctx.error, message: ctx.message }, { status: ctx.status });
  }

  if (!isAdmin(ctx.role)) {
    return NextResponse.json(
      { ok: false, error: "forbidden", message: "Only organization owners/admins can update custom domain" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = CustomDomainInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", message: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const customDomain = parsed.data.customDomain;

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

  if (customDomain && !isValidVerificationToken(token)) {
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Failed to generate valid verification token" },
      { status: 500 }
    );
  }

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

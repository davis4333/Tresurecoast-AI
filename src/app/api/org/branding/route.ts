import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { BrandingSchema } from "@/lib/validators/branding";
import { prisma } from "@/lib/prisma";
import { getOrgContext, isAdmin } from "@/lib/auth/getOrgContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(requestId: string, status: number, error: string, message: string, details?: unknown) {
  return NextResponse.json({ ok: false, requestId, error, message, details }, { status });
}

export async function GET(_req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const ctx = await getOrgContext();
    if (!ctx.ok) {
      return jsonError(requestId, ctx.status, ctx.error, ctx.message);
    }

    const org = await prisma.organization.findUnique({
      where: { id: ctx.org.id },
      select: {
        whiteLabelEnabled: true,
        brandCompanyName: true,
        brandLogoUrl: true,
        brandPrimaryColor: true,
        showPoweredBy: true,
        customDomain: true,
      },
    });

    if (!org) {
      return jsonError(requestId, 404, "not_found", "Organization not found");
    }

    return NextResponse.json({
      ok: true,
      branding: {
        whiteLabelEnabled: org.whiteLabelEnabled,
        brandCompanyName: org.brandCompanyName,
        brandLogoUrl: org.brandLogoUrl,
        brandPrimaryColor: org.brandPrimaryColor,
        showPoweredBy: org.showPoweredBy,
        customDomain: org.customDomain,
      },
    });
  } catch {
    return jsonError(requestId, 500, "internal_error", "Failed to retrieve branding");
  }
}

export async function PUT(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const ctx = await getOrgContext();
    if (!ctx.ok) {
      return jsonError(requestId, ctx.status, ctx.error, ctx.message);
    }

    if (!isAdmin(ctx.role)) {
      return jsonError(requestId, 403, "forbidden", "Only organization owners/admins can update branding");
    }

    const body = await req.json();
    const validated = BrandingSchema.parse(body);

    const normalized = {
      whiteLabelEnabled: validated.whiteLabelEnabled,
      brandCompanyName: validated.brandCompanyName || null,
      brandLogoUrl: validated.brandLogoUrl || null,
      brandPrimaryColor: validated.brandPrimaryColor,
      showPoweredBy: validated.showPoweredBy,
      customDomain: validated.customDomain || null,
    };

    if (normalized.customDomain) {
      const existing = await prisma.organization.findUnique({
        where: { customDomain: normalized.customDomain },
        select: { id: true },
      });
      if (existing && existing.id !== ctx.org.id) {
        return jsonError(requestId, 409, "domain_taken", "This custom domain is already in use by another organization");
      }
    }

    const updated = await prisma.organization.update({
      where: { id: ctx.org.id },
      data: normalized,
      select: {
        whiteLabelEnabled: true,
        brandCompanyName: true,
        brandLogoUrl: true,
        brandPrimaryColor: true,
        showPoweredBy: true,
        customDomain: true,
      },
    });

    return NextResponse.json({ ok: true, branding: updated });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return jsonError(requestId, 400, "validation_error", "Invalid branding data", err.issues);
    }
    return jsonError(requestId, 500, "internal_error", "Failed to update branding");
  }
}

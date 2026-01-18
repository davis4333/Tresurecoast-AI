import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { BrandingSchema } from "@/lib/validators/branding";
import { prisma } from "@/lib/prisma";

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

async function getOrganizationForUser(userId: string | null) {
  if (isDevBypass()) {
    const org = await prisma.organization.findFirst({
      orderBy: { id: "asc" },
      select: {
        id: true,
        whiteLabelEnabled: true,
        brandCompanyName: true,
        brandLogoUrl: true,
        brandPrimaryColor: true,
        showPoweredBy: true,
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
      whiteLabelEnabled: true,
      brandCompanyName: true,
      brandLogoUrl: true,
      brandPrimaryColor: true,
      showPoweredBy: true,
      customDomain: true,
    },
  });

  return org ? { organization: org, role: "AGENCY_OWNER" as const } : null;
}

function canEdit(role: string) {
  return role === "AGENCY_OWNER" || role === "AGENCY_ADMIN";
}

export async function GET(req: NextRequest) {
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

    const org = result.organization;
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
    const { userId } = await getClerkAuth();
    
    if (!isDevBypass() && !userId) {
      return jsonError(requestId, 401, "unauthorized", "Authentication required");
    }

    const result = await getOrganizationForUser(userId);
    if (!result) {
      return jsonError(requestId, 404, "not_found", "Organization not found");
    }

    if (!canEdit(result.role)) {
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

    if (normalized.customDomain && normalized.customDomain !== result.organization.customDomain) {
      const existing = await prisma.organization.findUnique({
        where: { customDomain: normalized.customDomain },
        select: { id: true },
      });
      if (existing && existing.id !== result.organization.id) {
        return jsonError(requestId, 409, "domain_taken", "This custom domain is already in use by another organization");
      }
    }

    const updated = await prisma.organization.update({
      where: { id: result.organization.id },
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

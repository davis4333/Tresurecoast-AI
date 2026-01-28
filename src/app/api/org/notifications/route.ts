import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext, isAdmin } from "@/lib/auth/getOrgContext";
import { z } from "zod";
import { isValidEmail } from "@/lib/notifications/email";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  notificationEnabled: z.boolean().optional(),
  notificationEmails: z.array(z.string()).optional(),
  notifyOnHotLead: z.boolean().optional(),
  notifyOnBookingClick: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const ctx = await getOrgContext({ request });

  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  const org = await prisma.organization.findUnique({
    where: { id: ctx.org.id },
    select: {
      notificationEnabled: true,
      notificationEmails: true,
      notifyOnHotLead: true,
      notifyOnBookingClick: true,
    },
  });

  if (!org) {
    return NextResponse.json(
      { ok: false, error: "org_not_found", message: "Organization not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    settings: {
      notificationEnabled: org.notificationEnabled,
      notificationEmails: org.notificationEmails,
      notifyOnHotLead: org.notifyOnHotLead,
      notifyOnBookingClick: org.notifyOnBookingClick,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const ctx = await getOrgContext({ request });

  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  if (!isAdmin(ctx.role)) {
    return NextResponse.json(
      { ok: false, error: "forbidden", message: "Only admins can update notification settings" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_body", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parseResult = updateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", message: parseResult.error.message },
      { status: 400 }
    );
  }

  const { notificationEnabled, notificationEmails, notifyOnHotLead, notifyOnBookingClick } = parseResult.data;

  if (notificationEmails !== undefined) {
    const invalidEmails = notificationEmails.filter((email) => !isValidEmail(email.trim()));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_emails",
          message: `Invalid email addresses: ${invalidEmails.join(", ")}`,
        },
        { status: 400 }
      );
    }
  }

  const updatedOrg = await prisma.organization.update({
    where: { id: ctx.org.id },
    data: {
      ...(notificationEnabled !== undefined && { notificationEnabled }),
      ...(notificationEmails !== undefined && {
        notificationEmails: notificationEmails.map((e) => e.trim().toLowerCase()),
      }),
      ...(notifyOnHotLead !== undefined && { notifyOnHotLead }),
      ...(notifyOnBookingClick !== undefined && { notifyOnBookingClick }),
    },
    select: {
      notificationEnabled: true,
      notificationEmails: true,
      notifyOnHotLead: true,
      notifyOnBookingClick: true,
    },
  });

  return NextResponse.json({
    ok: true,
    settings: {
      notificationEnabled: updatedOrg.notificationEnabled,
      notificationEmails: updatedOrg.notificationEmails,
      notifyOnHotLead: updatedOrg.notifyOnHotLead,
      notifyOnBookingClick: updatedOrg.notifyOnBookingClick,
    },
  });
}

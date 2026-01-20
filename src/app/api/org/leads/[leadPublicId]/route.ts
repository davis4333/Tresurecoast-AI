import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext, isAdmin } from "@/lib/auth/getOrgContext";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "BOOKED", "CLOSED"]).optional(),
  notes: z.string().max(5000).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadPublicId: string }> }
) {
  const ctx = await getOrgContext({ request });

  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  const { leadPublicId } = await params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(leadPublicId)) {
    return NextResponse.json(
      { ok: false, error: "invalid_lead_id", message: "Invalid lead ID format" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findFirst({
    where: {
      publicId: leadPublicId,
      organizationId: ctx.org.id,
    },
    select: {
      publicId: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      notes: true,
      score: true,
      temperature: true,
      scoreReasons: true,
      answers: true,
      createdAt: true,
      updatedAt: true,
      service: {
        select: {
          id: true,
          name: true,
        },
      },
      bot: {
        select: {
          publicKey: true,
          name: true,
        },
      },
      conversation: {
        select: {
          publicId: true,
        },
      },
    },
  });

  if (!lead) {
    return NextResponse.json(
      { ok: false, error: "lead_not_found", message: "Lead not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    lead: {
      leadPublicId: lead.publicId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      notes: lead.notes,
      score: lead.score,
      temperature: lead.temperature,
      scoreReasons: lead.scoreReasons,
      answers: lead.answers,
      serviceName: lead.service?.name ?? null,
      serviceId: lead.service?.id ?? null,
      botName: lead.bot.name,
      botPublicKey: lead.bot.publicKey,
      conversationPublicId: lead.conversation?.publicId ?? null,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ leadPublicId: string }> }
) {
  const ctx = await getOrgContext({ request });

  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  const { leadPublicId } = await params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(leadPublicId)) {
    return NextResponse.json(
      { ok: false, error: "invalid_lead_id", message: "Invalid lead ID format" },
      { status: 400 }
    );
  }

  if (!isAdmin(ctx.role)) {
    const org = await prisma.organization.findUnique({
      where: { id: ctx.org.id },
      select: { allowClientEdits: true },
    });

    if (!org?.allowClientEdits) {
      return NextResponse.json(
        { ok: false, error: "forbidden", message: "Lead editing not permitted" },
        { status: 403 }
      );
    }
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

  const { status, notes } = parseResult.data;

  if (status === undefined && notes === undefined) {
    return NextResponse.json(
      { ok: false, error: "no_updates", message: "No updates provided" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findFirst({
    where: {
      publicId: leadPublicId,
      organizationId: ctx.org.id,
    },
    select: { id: true },
  });

  if (!lead) {
    return NextResponse.json(
      { ok: false, error: "lead_not_found", message: "Lead not found" },
      { status: 404 }
    );
  }

  const updatedLead = await prisma.lead.update({
    where: { id: lead.id },
    data: {
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
    },
    select: {
      publicId: true,
      status: true,
      notes: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    lead: {
      leadPublicId: updatedLead.publicId,
      status: updatedLead.status,
      notes: updatedLead.notes,
      updatedAt: updatedLead.updatedAt.toISOString(),
    },
  });
}

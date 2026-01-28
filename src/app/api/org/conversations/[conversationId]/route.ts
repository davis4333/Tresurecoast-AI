import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext } from "@/lib/auth/getOrgContext";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const ctx = await getOrgContext();
  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  const { conversationId } = await params;
  const organizationId = ctx.org.id;

  const conversation = await prisma.conversation.findFirst({
    where: {
      publicId: conversationId,
      organizationId,
    },
    include: {
      bot: {
        select: {
          publicKey: true,
          name: true,
          greeting: true,
        },
      },
      leads: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: {
          publicId: true,
          name: true,
          email: true,
          phone: true,
          temperature: true,
          score: true,
          createdAt: true,
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json(
      { ok: false, error: "not_found", message: "Conversation not found" },
      { status: 404 }
    );
  }

  // Query bookings separately since there's no direct relation
  const bookings = await prisma.booking.findMany({
    where: {
      conversationId: conversation.id,
      deletedAt: null,
    },
    select: {
      publicId: true,
      status: true,
      scheduledAt: true,
      customerName: true,
      service: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { scheduledAt: "desc" },
  });

  // Calculate conversation duration
  const firstMessage = conversation.messages[0];
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const durationMs = firstMessage && lastMessage
    ? new Date(lastMessage.createdAt).getTime() - new Date(firstMessage.createdAt).getTime()
    : 0;

  const lead = conversation.leads[0] || null;

  return NextResponse.json({
    ok: true,
    conversation: {
      publicId: conversation.publicId,
      bot: {
        publicKey: conversation.bot?.publicKey,
        name: conversation.bot?.name || "Unknown Bot",
        greeting: conversation.bot?.greeting,
      },
      lead: lead
        ? {
            publicId: lead.publicId,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            temperature: lead.temperature,
            score: lead.score,
            createdAt: lead.createdAt.toISOString(),
          }
        : null,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
      bookings: bookings.map((b) => ({
        publicId: b.publicId,
        status: b.status,
        scheduledAt: b.scheduledAt.toISOString(),
        customerName: b.customerName,
        serviceName: b.service?.name,
      })),
      stats: {
        messageCount: conversation.messages.length,
        userMessages: conversation.messages.filter((m) => m.role === "user").length,
        assistantMessages: conversation.messages.filter((m) => m.role === "assistant").length,
        durationMs,
      },
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    },
  });
}

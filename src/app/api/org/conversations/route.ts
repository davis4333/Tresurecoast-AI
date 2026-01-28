import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext } from "@/lib/auth/getOrgContext";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ctx = await getOrgContext();
  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  const organizationId = ctx.org.id;
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const botId = searchParams.get("botId");
  const search = searchParams.get("search")?.trim();
  const hasLead = searchParams.get("hasLead");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    organizationId,
  };

  if (botId) {
    where.botId = parseInt(botId, 10);
  }

  if (hasLead === "true") {
    where.leads = { some: {} };
  } else if (hasLead === "false") {
    where.leads = { none: {} };
  }

  // Build the query
  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      include: {
        bot: {
          select: {
            publicKey: true,
            name: true,
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
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
            role: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.conversation.count({ where }),
  ]);

  // Filter by search if provided (search in messages content)
  let filteredConversations = conversations;
  if (search) {
    const conversationIds = await prisma.message.findMany({
      where: {
        conversation: { organizationId },
        content: { contains: search, mode: "insensitive" },
      },
      select: { conversationId: true },
      distinct: ["conversationId"],
    });
    const matchingIds = new Set(conversationIds.map((m) => m.conversationId));
    filteredConversations = conversations.filter((c) => matchingIds.has(c.id));
  }

  return NextResponse.json({
    ok: true,
    conversations: filteredConversations.map((c) => {
      const lead = c.leads[0] || null;
      return {
        publicId: c.publicId,
        botName: c.bot?.name || "Unknown Bot",
        botPublicKey: c.bot?.publicKey,
        lead: lead
          ? {
              publicId: lead.publicId,
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              temperature: lead.temperature,
            }
          : null,
        messageCount: c._count.messages,
        lastMessage: c.messages[0]
          ? {
              content: c.messages[0].content,
              role: c.messages[0].role,
              createdAt: c.messages[0].createdAt.toISOString(),
            }
          : null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

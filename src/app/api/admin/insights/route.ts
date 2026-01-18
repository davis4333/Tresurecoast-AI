import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { InsightsQuerySchema } from "@/lib/admin/insightsSchemas";
import { detectTopic } from "@/lib/public/topicDetect";
import { requireClerkAdmin, handleClerkError, ClerkMisconfiguredError, ClerkUnauthorizedError } from "@/lib/admin/requireClerkAdmin";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireClerkAdmin();

    const sp = req.nextUrl.searchParams;
    const query = InsightsQuerySchema.parse({
      botPublicKey: sp.get("botPublicKey"),
      days: sp.get("days"),
    });

    const { botPublicKey, days } = query;

    const bot = await prisma.bot.findUnique({
      where: { publicKey: botPublicKey },
      select: { id: true, publicKey: true },
    });

    if (!bot) {
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 }
      );
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const conversations = await prisma.conversation.findMany({
      where: { botId: bot.id, createdAt: { gte: cutoff } },
      select: { id: true },
    });
    const conversationIds = conversations.map((c) => c.id);
    const chats = conversationIds.length;

    const [missingDataEvents, leadCaptureTriggered, redirectClicks] =
      await Promise.all([
        prisma.dataEvent.count({
          where: {
            type: "MISSING_DATA",
            createdAt: { gte: cutoff },
            conversationId: { in: conversationIds },
          },
        }),
        prisma.dataEvent.count({
          where: {
            type: "LEAD_CAPTURE_TRIGGERED",
            createdAt: { gte: cutoff },
            conversationId: { in: conversationIds },
          },
        }),
        prisma.dataEvent.count({
          where: {
            type: "REDIRECT_CLICK",
            createdAt: { gte: cutoff },
            conversationId: { in: conversationIds },
          },
        }),
      ]);

    const recentEvents = await prisma.dataEvent.findMany({
      where: {
        createdAt: { gte: cutoff },
        conversationId: { in: conversationIds },
        type: {
          in: ["MISSING_DATA", "TRUTH_RESPONSE", "TOPIC_DETECTED", "LEAD_CAPTURE_TRIGGERED", "REDIRECT_CLICK"],
        },
      },
      select: { type: true, topic: true, payload: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 800,
    });

    const missingFieldsMap = new Map<string, number>();
    const topicsMap = new Map<string, number>();

    for (const ev of recentEvents) {
      const topic = (ev.topic ?? (ev.payload as Record<string, unknown>)?.topic) as string | null;
      if (topic) topicsMap.set(topic, (topicsMap.get(topic) || 0) + 1);

      if (ev.type === "MISSING_DATA") {
        const mf = (ev.payload as Record<string, unknown>)?.missingFields;
        if (Array.isArray(mf)) {
          for (const f of mf) {
            if (typeof f === "string" && f.trim()) {
              missingFieldsMap.set(f, (missingFieldsMap.get(f) || 0) + 1);
            }
          }
        }
      }
    }

    const topMissingFields = Array.from(missingFieldsMap.entries())
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topTopics = Array.from(topicsMap.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const msgs = await prisma.message.findMany({
      where: {
        role: "user",
        createdAt: { gte: cutoff },
        conversationId: { in: conversationIds },
      },
      select: { content: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    const sampleQuestions = msgs.map((m) => {
      const topicGuess = detectTopic(m.content);
      return {
        message: m.content,
        createdAt: m.createdAt.toISOString(),
        topic: topicGuess.topic,
      };
    });

    const suggestions = generateSuggestions(topMissingFields, topTopics);

    return NextResponse.json({
      ok: true as const,
      botPublicKey: bot.publicKey,
      rangeDays: days,
      totals: {
        chats,
        missingDataEvents,
        leadCaptureTriggered,
        redirectClicks,
      },
      topMissingFields,
      topTopics,
      sampleQuestions,
      suggestions,
    });
  } catch (err) {
    if (err instanceof ClerkMisconfiguredError || err instanceof ClerkUnauthorizedError) {
      return handleClerkError(err);
    }
    if (err instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "validation_error", details: err.issues },
        { status: 400 }
      );
    }
    console.error("[INSIGHTS] error", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}

function generateSuggestions(
  missingFields: Array<{ field: string; count: number }>,
  topics: Array<{ topic: string; count: number }>
) {
  const suggestions: Array<{
    title: string;
    reason: string;
    suggestedFields: string[];
    exampleValues?: unknown;
  }> = [];

  const map: Record<
    string,
    { title: string; fields: string[]; example?: unknown }
  > = {
    hours: {
      title: "Add business hours",
      fields: ["hours"],
      example: { monday: "9:00-18:00", tuesday: "9:00-18:00" },
    },
    services: {
      title: "Add/expand services list",
      fields: ["services"],
      example: [
        { name: "Haircut", priceRange: "$35-$55", durationMinutes: 45 },
      ],
    },
    pricing: {
      title: "Add pricing ranges",
      fields: ["services", "pricing"],
      example: { haircut: "$35-$55", beard: "$15-$25" },
    },
    location: {
      title: "Add address/location",
      fields: ["businessAddress"],
      example: "123 Main St, Fort Pierce, FL",
    },
    contact: {
      title: "Add contact info",
      fields: ["businessPhone", "businessEmail"],
      example: { phone: "(555) 123-4567", email: "info@business.com" },
    },
    policies: {
      title: "Add policies (cancellation/refunds)",
      fields: ["policies"],
      example: { cancellation: "24-hour notice required" },
    },
  };

  for (const { field, count } of missingFields.slice(0, 5)) {
    const key = field.toLowerCase();
    const s = map[key];
    if (s) {
      suggestions.push({
        title: s.title,
        reason: `${count} question${count === 1 ? "" : "s"} missing "${field}" data`,
        suggestedFields: s.fields,
        exampleValues: s.example,
      });
    }
  }

  const topTopic = topics[0];
  if (topTopic && topTopic.count >= 8) {
    suggestions.push({
      title: `Deepen "${topTopic.topic}" coverage`,
      reason: `${topTopic.count} messages detected for this topic`,
      suggestedFields: ["services", "hours", "policies"],
    });
  }

  return suggestions;
}

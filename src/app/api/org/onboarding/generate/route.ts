import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getOrgContext, isAdmin, getTestUserId } from "@/lib/auth/getOrgContext";
import { OnboardingFormSchema } from "@/lib/onboarding/schemas";
import { buildBotBlueprint } from "@/lib/onboarding/botBlueprint";
import {
  applyTemplateToBlueprint,
  seedTemplateKnowledge,
} from "@/lib/templates";
import { generateDrafts } from "@/lib/ai/draftGenerator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const testUserId = getTestUserId(request);
    const ctx = await getOrgContext({ request, testUserId });

    if (!ctx.ok) {
      return NextResponse.json(
        { ok: false, error: ctx.error, message: ctx.message },
        { status: ctx.status }
      );
    }

    if (!isAdmin(ctx.role)) {
      return NextResponse.json(
        { ok: false, error: "forbidden", message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "invalid_body", message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = OnboardingFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "validation_error",
          message: "Invalid form data",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const formData = parsed.data;
    const baseBlueprint = buildBotBlueprint(formData);

    const templateInput = {
      businessName: formData.businessName,
      category: formData.category,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      hours: formData.hours || undefined,
      websiteUrl: formData.websiteUrl || undefined,
      bookingUrl: formData.bookingUrl || undefined,
    };

    const blueprint = applyTemplateToBlueprint(
      baseBlueprint,
      formData.templateKey,
      templateInput
    );

    let workspace = await prisma.workspace.findFirst({
      where: { organizationId: ctx.org.id },
      orderBy: { createdAt: "asc" },
    });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          organizationId: ctx.org.id,
          name: "Default Workspace",
        },
      });
    }

    const existingBot = await prisma.bot.findFirst({
      where: {
        organizationId: ctx.org.id,
        name: blueprint.botName,
      },
    });

    let bot;
    if (existingBot) {
      bot = await prisma.bot.update({
        where: { id: existingBot.id },
        data: {
          greeting: blueprint.greeting,
          fallbackText: blueprint.fallbackText,
          businessPhone: formData.phone || null,
          businessAddress: formData.address || null,
          hours: formData.hours ? { raw: formData.hours } : Prisma.DbNull,
          status: "ACTIVE",
        },
      });

      if (formData.bookingUrl) {
        const existingLink = await prisma.botLink.findFirst({
          where: { botId: bot.id, type: "BOOKING" },
        });

        if (existingLink) {
          await prisma.botLink.update({
            where: { id: existingLink.id },
            data: { url: formData.bookingUrl, label: "Book Now" },
          });
        } else {
          await prisma.botLink.create({
            data: {
              botId: bot.id,
              type: "BOOKING",
              label: "Book Now",
              url: formData.bookingUrl,
            },
          });
        }
      }
    } else {
      bot = await prisma.bot.create({
        data: {
          organizationId: ctx.org.id,
          workspaceId: workspace.id,
          name: blueprint.botName,
          greeting: blueprint.greeting,
          fallbackText: blueprint.fallbackText,
          businessPhone: formData.phone || null,
          businessAddress: formData.address || null,
          hours: formData.hours ? { raw: formData.hours } : Prisma.DbNull,
          status: "ACTIVE",
        },
      });

      if (formData.bookingUrl) {
        await prisma.botLink.create({
          data: {
            botId: bot.id,
            type: "BOOKING",
            label: "Book Now",
            url: formData.bookingUrl,
          },
        });
      }

      if (formData.websiteUrl) {
        await prisma.botLink.create({
          data: {
            botId: bot.id,
            type: "OTHER",
            label: "Visit Website",
            url: formData.websiteUrl,
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          organizationId: ctx.org.id,
          workspaceId: workspace.id,
          action: "BOT_CREATED",
          summary: `Bot "${blueprint.botName}" created via onboarding wizard`,
          actorId: ctx.userId,
        },
      });
    }

    await seedTemplateKnowledge(
      bot.id,
      ctx.org.id,
      formData.templateKey,
      templateInput
    );

    // Generate AI drafts (Step S05 - AI Draft Generation)
    let draftsGenerated = false;
    try {
      if (process.env.OPENAI_API_KEY) {
        const drafts = await generateDrafts({
          name: formData.businessName,
          category: formData.category || 'business',
          websiteUrl: formData.websiteUrl,
          phone: formData.phone,
          address: formData.address,
          hours: formData.hours,
          services: formData.services?.split(',').map(s => s.trim()),
          bookingUrl: formData.bookingUrl,
          brandVoice: formData.brandVoice || 'professional',
          primaryGoal: formData.primaryGoal || 'bookings',
        });

        // Store "About Us" draft
        if (drafts.aboutText) {
          const contentHash = createHash('sha256').update(drafts.aboutText).digest('hex');
          await prisma.botKnowledgeSource.create({
            data: {
              botId: bot.id,
              organizationId: ctx.org.id,
              type: 'PASTE',
              title: 'About Us (AI Draft)',
              content: drafts.aboutText,
              contentHash,
              status: 'DRAFT',
            },
          });
        }

        // Store FAQ drafts
        for (const faq of drafts.faqs || []) {
          const contentHash = createHash('sha256').update(faq.question + faq.answer).digest('hex');
          await prisma.botKnowledgeSource.create({
            data: {
              botId: bot.id,
              organizationId: ctx.org.id,
              type: 'PASTE',
              title: faq.question,
              content: faq.answer,
              contentHash,
              status: 'DRAFT',
            },
          });
        }

        // Store knowledge base entry drafts
        for (const entry of drafts.kbEntries || []) {
          const contentHash = createHash('sha256').update(entry.title + entry.content).digest('hex');
          await prisma.botKnowledgeSource.create({
            data: {
              botId: bot.id,
              organizationId: ctx.org.id,
              type: 'PASTE',
              title: entry.title,
              content: entry.content,
              contentHash,
              status: 'DRAFT',
            },
          });
        }

        draftsGenerated = true;
      }
    } catch (error) {
      console.error('[Onboarding] AI draft generation failed:', error);
      // Continue without drafts (non-blocking)
    }

    return NextResponse.json({
      ok: true,
      botPublicKey: bot.publicKey,
      draftsGenerated,
      message: draftsGenerated
        ? 'Bot created with AI-generated drafts. Review and publish them in the Knowledge Base.'
        : 'Bot created successfully.',
    });
  } catch (error) {
    console.error("[onboarding/generate] Error:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Failed to generate bot" },
      { status: 500 }
    );
  }
}

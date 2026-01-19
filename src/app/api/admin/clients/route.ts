import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClerkAdmin, handleClerkError } from "@/lib/admin/requireClerkAdmin";
import { CreateClientSchema } from "@/lib/admin/clientSchemas";
import { buildBotBlueprint } from "@/lib/onboarding/botBlueprint";
import { getScriptEmbedSnippet, getIframeEmbedSnippet } from "@/lib/widget/embedSnippet";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await requireClerkAdmin();

    const body = await req.json();
    const parsed = CreateClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "validation_error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: input.orgName,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          clerkUserId: input.ownerClerkUserId,
          role: "AGENCY_OWNER",
        },
      });

      const hoursJson = input.hours ? { text: input.hours } : undefined;

      await tx.businessProfile.create({
        data: {
          organizationId: org.id,
          businessName: input.businessName,
          category: input.category,
          phone: input.phone || null,
          address: input.address || null,
          hours: hoursJson ?? undefined,
          websiteUrl: input.websiteUrl || null,
          bookingUrl: input.bookingUrl || null,
          tone: input.tone,
          primaryGoal: input.primaryGoal,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          organizationId: org.id,
          name: "Default Workspace",
        },
      });

      const blueprint = buildBotBlueprint({
        businessName: input.businessName,
        category: input.category,
        brandVoice: input.tone,
        primaryGoal: input.primaryGoal,
        websiteUrl: input.websiteUrl || undefined,
        bookingUrl: input.bookingUrl || undefined,
        phone: input.phone || undefined,
        address: input.address || undefined,
        hours: input.hours || undefined,
      });

      const bot = await tx.bot.create({
        data: {
          organizationId: org.id,
          workspaceId: workspace.id,
          name: blueprint.botName,
          greeting: blueprint.greeting,
          fallbackText: blueprint.fallbackText,
          businessPhone: input.phone || null,
          businessAddress: input.address || null,
          hours: hoursJson ?? undefined,
        },
      });

      if (input.bookingUrl) {
        await tx.botLink.create({
          data: {
            botId: bot.id,
            type: "BOOKING",
            label: "Book Now",
            url: input.bookingUrl,
          },
        });
      }

      const profileContent = buildProfileContent(input);
      const contentHash = crypto.createHash("sha256").update(profileContent).digest("hex");

      await tx.botKnowledgeSource.create({
        data: {
          botId: bot.id,
          organizationId: org.id,
          type: "PASTE",
          title: "Business Profile",
          content: profileContent,
          contentHash,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: org.id,
          workspaceId: workspace.id,
          action: "ORG_CREATED",
          summary: `Created client organization: ${input.orgName}`,
          actorId: input.ownerClerkUserId,
        },
      });

      return { org, bot };
    });

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
    const embedSnippet = getScriptEmbedSnippet(appBaseUrl, result.bot.publicKey);
    const iframeSnippet = getIframeEmbedSnippet(appBaseUrl, result.bot.publicKey);

    const nextSteps = [
      "1. Copy the embed snippet and add it to your client's website",
      "2. Configure the bot's knowledge base with FAQs and business info",
      "3. Test the widget on a staging site before going live",
      "4. Create a client invite so they can access their dashboard",
    ].join("\n");

    return NextResponse.json({
      ok: true,
      orgId: result.org.id,
      orgPublicId: result.org.publicId,
      botPublicKey: result.bot.publicKey,
      embedSnippet,
      iframeSnippet,
      nextSteps,
    });
  } catch (error) {
    return handleClerkError(error);
  }
}

function buildProfileContent(input: {
  businessName: string;
  category: string;
  phone?: string;
  address?: string;
  hours?: string;
  websiteUrl?: string;
  bookingUrl?: string;
}): string {
  const lines: string[] = [
    `Business Name: ${input.businessName}`,
    `Category: ${input.category}`,
  ];

  if (input.phone) lines.push(`Phone: ${input.phone}`);
  if (input.address) lines.push(`Address: ${input.address}`);
  if (input.hours) lines.push(`Hours: ${input.hours}`);
  if (input.websiteUrl) lines.push(`Website: ${input.websiteUrl}`);
  if (input.bookingUrl) lines.push(`Booking URL: ${input.bookingUrl}`);

  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  try {
    await requireClerkAdmin();

    const clients = await prisma.organization.findMany({
      select: {
        id: true,
        publicId: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            bots: true,
          },
        },
        businessProfile: {
          select: {
            businessName: true,
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      ok: true,
      clients: clients.map((c) => ({
        id: c.id,
        publicId: c.publicId,
        name: c.name,
        createdAt: c.createdAt.toISOString(),
        botCount: c._count.bots,
        businessName: c.businessProfile?.businessName || null,
        category: c.businessProfile?.category || null,
      })),
    });
  } catch (error) {
    return handleClerkError(error);
  }
}

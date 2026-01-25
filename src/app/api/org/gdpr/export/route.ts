import { NextRequest, NextResponse } from 'next/server';
import { getOrgContext } from '@/lib/auth/getOrgContext';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/org/gdpr/export
 * Export all organization data in JSON format (GDPR Article 20 - Right to Data Portability)
 */
export async function GET(request: NextRequest) {
  const ctx = await getOrgContext({ request });
  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  try {
    // Fetch all organization data
    const [
      organization,
      workspaces,
      bots,
      conversations,
      leads,
      members,
      services,
      hours,
      businessProfile,
    ] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: ctx.org.id },
        select: {
          id: true,
          publicId: true,
          name: true,
          planTier: true,
          planStartedAt: true,
          planExpiresAt: true,
          conversationsLimit: true,
          botsLimit: true,
          conversationsThisMonth: true,
          whiteLabelEnabled: true,
          brandCompanyName: true,
          brandLogoUrl: true,
          brandPrimaryColor: true,
          showPoweredBy: true,
          customDomain: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.workspace.findMany({
        where: { organizationId: ctx.org.id },
        select: {
          id: true,
          publicId: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.bot.findMany({
        where: { organizationId: ctx.org.id },
        select: {
          id: true,
          publicKey: true,
          name: true,
          status: true,
          greeting: true,
          fallbackText: true,
          businessPhone: true,
          businessEmail: true,
          businessAddress: true,
          hours: true,
          services: true,
          createdAt: true,
          updatedAt: true,
          links: {
            select: {
              type: true,
              label: true,
              url: true,
            },
          },
          allowlist: {
            select: {
              domain: true,
            },
          },
          knowledgeSources: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              publishedAt: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.conversation.findMany({
        where: { organizationId: ctx.org.id },
        select: {
          id: true,
          publicId: true,
          createdAt: true,
          updatedAt: true,
          messages: {
            select: {
              role: true,
              content: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.lead.findMany({
        where: { organizationId: ctx.org.id },
        select: {
          publicId: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          notes: true,
          score: true,
          temperature: true,
          answers: true,
          scoreReasons: true,
          serviceId: true,
          service: {
            select: {
              name: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.organizationMember.findMany({
        where: { organizationId: ctx.org.id },
        select: {
          clerkUserId: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.organizationService.findMany({
        where: { organizationId: ctx.org.id },
        select: {
          id: true,
          name: true,
          priceCents: true,
          bookingUrl: true,
          paymentUrl: true,
          isActive: true,
          displayOrder: true,
          createdAt: true,
        },
      }),
      prisma.organizationHours.findMany({
        where: { organizationId: ctx.org.id },
        select: {
          id: true,
          dayOfWeek: true,
          openTime: true,
          closeTime: true,
          isClosed: true,
        },
      }),
      prisma.businessProfile.findUnique({
        where: { organizationId: ctx.org.id },
        select: {
          cancellationPolicy: true,
          depositPolicy: true,
          refundPolicy: true,
          serviceArea: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    // Assemble comprehensive data export
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: ctx.userId || 'unknown',
      exportFormat: 'GDPR Article 20 - Right to Data Portability',
      organization,
      workspaces,
      bots,
      conversations: conversations.map((conv) => ({
        ...conv,
        messageCount: conv.messages.length,
      })),
      leads,
      members,
      services,
      businessHours: hours,
      businessProfile,
    };

    // Return as JSON file download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="treasurecoast-ai-data-export-${ctx.org.id}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('[GDPR Export] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

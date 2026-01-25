import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/auth/getOrgContext";
import { prisma } from "@/lib/prisma";
import { evaluateSetup, SetupInput } from "@/lib/setup/setupChecker";

export const dynamic = 'force-dynamic';

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
      whiteLabelEnabled: true,
    },
  });

  if (!org) {
    return NextResponse.json(
      { ok: false, error: "ORG_NOT_FOUND", message: "Organization not found" },
      { status: 404 }
    );
  }

  const bot = await prisma.bot.findFirst({
    where: { organizationId: ctx.org.id },
    orderBy: { createdAt: "asc" },
    select: {
      name: true,
      greeting: true,
      fallbackText: true,
      businessPhone: true,
      businessEmail: true,
      businessAddress: true,
      hours: true,
      services: true,
    },
  });

  const businessProfile = await prisma.businessProfile.findUnique({
    where: { organizationId: ctx.org.id },
    select: {
      phone: true,
      address: true,
      serviceArea: true,
      cancellationPolicy: true,
      bookingUrl: true,
    },
  });

  const botDomainAllowlist = await prisma.botDomainAllowlist.findFirst({
    where: {
      bot: { organizationId: ctx.org.id },
    },
  });

  const kbStats = await prisma.botKnowledgeSource.groupBy({
    by: ["type"],
    where: { organizationId: ctx.org.id },
    _count: true,
  });
  const totalArticles = kbStats.reduce(
    (sum: number, s) => sum + s._count,
    0
  );
  const publishedArticles = totalArticles;

  const hasLeads = (await prisma.lead.count({
    where: { organizationId: ctx.org.id },
    take: 1,
  })) > 0;

  const input: SetupInput = {
    bot: bot
      ? {
          name: bot.name,
          greeting: bot.greeting,
          fallbackText: bot.fallbackText,
          businessPhone: bot.businessPhone,
          businessEmail: bot.businessEmail,
          businessAddress: bot.businessAddress,
          hours: bot.hours,
          services: bot.services,
          bookingUrl: businessProfile?.bookingUrl ?? null,
          industryTemplate: null,
        }
      : null,
    businessProfile,
    org: {
      notificationEnabled: org.notificationEnabled,
      notificationEmails: org.notificationEmails,
      customBranding: org.whiteLabelEnabled ? {} : null,
      allowedDomains: botDomainAllowlist ? [botDomainAllowlist.domain] : [],
    },
    kb: {
      totalArticles,
      publishedArticles,
    },
    hasLeads,
  };

  const status = evaluateSetup(input);

  return NextResponse.json({ ok: true, status });
}

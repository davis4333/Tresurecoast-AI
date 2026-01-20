import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  const existingSeed = await prisma.auditLog.findFirst({
    where: {
      action: "ORG_CREATED",
      summary: { contains: "[SEED_V1" },
    },
    orderBy: { createdAt: "desc" },
    select: { summary: true },
  });

  if (existingSeed) {
    const match = existingSeed.summary.match(
      /\[SEED_V1 orgId=(\d+) wsId=(\d+) botId=(\d+)\]/
    );
    if (match && match[1] && match[2] && match[3]) {
      const botId = parseInt(match[3], 10);
      const bot = await prisma.bot.findUnique({
        where: { id: botId },
        select: { publicKey: true },
      });
      if (bot) {
        console.log("✅ Existing seed found!");
        console.log(`   Bot publicKey: ${bot.publicKey}`);
        console.log(`\n   Set this in your environment:`);
        console.log(`   NEXT_PUBLIC_DEMO_BOT_KEY=${bot.publicKey}`);
        return;
      }
    }
  }

  console.log("Creating new demo organization...");

  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: "Treasure Coast AI Demo",
        averageOrderValue: 150,
      },
    });

    const profile = await tx.businessProfile.create({
      data: {
        organizationId: org.id,
        category: "technology",
        businessName: "Treasure Coast AI Demo",
        phone: "(772) 555-0123",
        email: "demo@treasurecoastai.com",
        address: "123 Ocean Dr, Stuart, FL 34994",
        hours: {
          monday: "9am-5pm",
          tuesday: "9am-5pm",
          wednesday: "9am-5pm",
          thursday: "9am-5pm",
          friday: "9am-5pm",
          saturday: "10am-2pm",
          sunday: "Closed",
        },
        tone: "friendly",
        primaryGoal: "leads",
        cancellationPolicy: "24-hour cancellation notice required",
        depositPolicy: "50% deposit required to book",
        refundPolicy: "Refunds processed within 5-7 business days",
      },
    });

    const ws = await tx.workspace.create({
      data: {
        organizationId: org.id,
        name: "Default Workspace",
      },
    });

    const bot = await tx.bot.create({
      data: {
        organizationId: org.id,
        workspaceId: ws.id,
        name: "Demo Assistant",
        greeting:
          "Hey there! 👋 I'm the Treasure Coast AI demo assistant. Ask me about our services, hours, or book an appointment!",
        fallbackText:
          "I'm not 100% sure from the info I have. Want to leave your name and number so the team can follow up?",
        status: "ACTIVE",
      },
    });

    await tx.botLink.createMany({
      data: [
        {
          botId: bot.id,
          type: "BOOKING",
          label: "Book Now",
          url: "https://calendly.com/demo-booking",
        },
        {
          botId: bot.id,
          type: "PAYMENT",
          label: "Pay Deposit",
          url: "https://example.com/pay-deposit",
        },
      ],
    });

    await tx.organizationService.createMany({
      data: [
        {
          organizationId: org.id,
          name: "Strategy Consultation",
          priceCents: 15000,
          displayOrder: 1,
        },
        {
          organizationId: org.id,
          name: "Bot Setup & Configuration",
          priceCents: 49900,
          displayOrder: 2,
        },
        {
          organizationId: org.id,
          name: "Monthly Management",
          priceCents: 9900,
          displayOrder: 3,
        },
      ],
    });

    await tx.botKnowledgeSource.createMany({
      data: [
        {
          botId: bot.id,
          organizationId: org.id,
          type: "PASTE",
          title: "About Treasure Coast AI",
          content:
            "Treasure Coast AI helps local businesses capture more leads with smart AI chatbots. Our bots answer customer questions 24/7, book appointments, and never miss a lead.",
          contentHash: "about-hash-1",
        },
        {
          botId: bot.id,
          organizationId: org.id,
          type: "PASTE",
          title: "Pricing Information",
          content:
            "Strategy consultations start at $150. Full bot setup is $499. Monthly management packages start at $99/month. All prices include training and support.",
          contentHash: "pricing-hash-1",
        },
        {
          botId: bot.id,
          organizationId: org.id,
          type: "PASTE",
          title: "FAQ - How long does setup take?",
          content:
            "Most bots are live within 48 hours. We gather your business info, configure the bot, and embed it on your website.",
          contentHash: "faq-setup-hash-1",
        },
        {
          botId: bot.id,
          organizationId: org.id,
          type: "PASTE",
          title: "FAQ - Do I need technical skills?",
          content:
            "No technical skills required! We handle everything. You just review and approve the content.",
          contentHash: "faq-technical-hash-1",
        },
      ],
    });

    const member = await tx.organizationMember.create({
      data: {
        organizationId: org.id,
        clerkUserId: "user_b_admin",
        role: "AGENCY_OWNER",
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: org.id,
        workspaceId: ws.id,
        action: "ORG_CREATED",
        summary: `[SEED_V1 orgId=${org.id} wsId=${ws.id} botId=${bot.id}] Seeded demo org/workspace/bot via prisma/seed.ts`,
        actorId: null,
      },
    });

    return { org, ws, bot, profile, member };
  });

  console.log("✅ Seed completed successfully!");
  console.log(`   Organization: ${result.org.name} (id: ${result.org.id})`);
  console.log(`   Workspace: ${result.ws.name} (id: ${result.ws.id})`);
  console.log(`   Bot: ${result.bot.name} (publicKey: ${result.bot.publicKey})`);
  console.log(`   Admin: ${result.member.clerkUserId}`);
  console.log(`\n   Set this in your environment:`);
  console.log(`   NEXT_PUBLIC_DEMO_BOT_KEY=${result.bot.publicKey}`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

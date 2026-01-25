import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DemoRequestSchema } from "@/lib/public/demoRequestSchema";
import { notifyDemoRequest } from "@/lib/notifications/webhooks";
import { checkRateLimit } from "@/lib/public/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimitCheck = await checkRateLimit(request, "demo_request", "global");
  if (!rateLimitCheck.allowed) {
    return NextResponse.json(
      { error: rateLimitCheck.error || "Rate limit exceeded" },
      { status: 429 }
    );
  }

  // Origin validation to prevent abuse from unauthorized domains
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  const allowedOrigins = [
    'https://treasurecoast.ai',
    'https://www.treasurecoast.ai',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  const isAllowed = allowedOrigins.some(allowed =>
    origin?.startsWith(allowed) || referer?.includes(allowed)
  );

  if (!isAllowed && process.env.NODE_ENV === 'production') {
    console.warn('[request-demo] Blocked request from unauthorized origin', {
      origin,
      referer,
    });
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = DemoRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const demoRequest = await prisma.demoRequest.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        businessName: parsed.data.businessName,
        phone: parsed.data.phone ?? null,
      },
    });

    notifyDemoRequest({
      id: demoRequest.id,
      name: demoRequest.name,
      email: demoRequest.email,
      businessName: demoRequest.businessName,
      phone: demoRequest.phone,
      createdAt: demoRequest.createdAt.toISOString(),
    }).catch((err) => {
      console.error("[DEMO_REQUEST_NOTIFICATION_ERROR]", err);
    });

    return NextResponse.json(
      { success: true, id: demoRequest.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/public/request-demo] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

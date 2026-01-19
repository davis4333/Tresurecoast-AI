import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DemoRequestSchema } from "@/lib/public/demoRequestSchema";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

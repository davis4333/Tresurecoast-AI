import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext, getTestUserId, isAdmin } from "@/lib/auth/getOrgContext";
import { MemberUpdateSchema, validateLastOwnerConstraint } from "@/lib/validators/membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId: memberIdStr } = await params;
  const memberId = parseInt(memberIdStr, 10);

  if (isNaN(memberId)) {
    return NextResponse.json(
      { ok: false, error: "invalid_member_id", message: "Invalid member ID" },
      { status: 400 }
    );
  }

  const ctx = await getOrgContext({ request: req, testUserId: getTestUserId(req) });

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

  const member = await prisma.organizationMember.findUnique({
    where: { id: memberId },
  });

  if (!member || member.organizationId !== ctx.org.id) {
    return NextResponse.json(
      { ok: false, error: "member_not_found", message: "Member not found" },
      { status: 404 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_body", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = MemberUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", message: parsed.error.message },
      { status: 400 }
    );
  }

  const { role: newRole } = parsed.data;

  if (member.role === "AGENCY_OWNER" && newRole !== "AGENCY_OWNER") {
    const constraint = await validateLastOwnerConstraint(prisma, ctx.org.id, memberId);
    if (!constraint.ok) {
      return NextResponse.json(
        { ok: false, error: "last_owner", message: constraint.error },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.organizationMember.update({
    where: { id: memberId },
    data: { role: newRole },
    select: { id: true, role: true, updatedAt: true },
  });

  return NextResponse.json({ ok: true, member: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId: memberIdStr } = await params;
  const memberId = parseInt(memberIdStr, 10);

  if (isNaN(memberId)) {
    return NextResponse.json(
      { ok: false, error: "invalid_member_id", message: "Invalid member ID" },
      { status: 400 }
    );
  }

  const ctx = await getOrgContext({ request: req, testUserId: getTestUserId(req) });

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

  const member = await prisma.organizationMember.findUnique({
    where: { id: memberId },
  });

  if (!member || member.organizationId !== ctx.org.id) {
    return NextResponse.json(
      { ok: false, error: "member_not_found", message: "Member not found" },
      { status: 404 }
    );
  }

  if (member.clerkUserId === ctx.userId) {
    return NextResponse.json(
      { ok: false, error: "cannot_remove_self", message: "Cannot remove yourself from the organization" },
      { status: 400 }
    );
  }

  if (member.role === "AGENCY_OWNER") {
    const constraint = await validateLastOwnerConstraint(prisma, ctx.org.id, memberId);
    if (!constraint.ok) {
      return NextResponse.json(
        { ok: false, error: "last_owner", message: constraint.error },
        { status: 400 }
      );
    }
  }

  await prisma.organizationMember.delete({
    where: { id: memberId },
  });

  return NextResponse.json({ ok: true });
}

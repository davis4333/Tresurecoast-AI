import { z } from "zod";
import type { PrismaClient } from "@prisma/client";

export const InviteCreateSchema = z.object({
  role: z.enum(["AGENCY_OWNER", "AGENCY_ADMIN", "CLIENT"]),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export const InviteAcceptSchema = z.object({
  token: z.string().min(1),
});

export const MemberUpdateSchema = z.object({
  role: z.enum(["AGENCY_OWNER", "AGENCY_ADMIN", "CLIENT"]),
});

export type InviteCreateInput = z.infer<typeof InviteCreateSchema>;
export type InviteAcceptInput = z.infer<typeof InviteAcceptSchema>;
export type MemberUpdateInput = z.infer<typeof MemberUpdateSchema>;

export async function validateLastOwnerConstraint(
  prisma: PrismaClient,
  orgId: number,
  excludeMemberId?: number
): Promise<{ ok: boolean; error?: string }> {
  const ownerCount = await prisma.organizationMember.count({
    where: {
      organizationId: orgId,
      role: "AGENCY_OWNER",
      ...(excludeMemberId !== undefined ? { id: { not: excludeMemberId } } : {}),
    },
  });

  if (ownerCount < 1) {
    return {
      ok: false,
      error: "Cannot remove or demote the last owner of the organization",
    };
  }

  return { ok: true };
}

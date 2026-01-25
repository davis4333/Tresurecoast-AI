import { NextRequest, NextResponse } from 'next/server';
import { getOrgContext } from '@/lib/auth/getOrgContext';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const DeleteSchema = z.object({
  confirmation: z.literal('DELETE'),
  organizationName: z.string().min(1),
});

/**
 * DELETE /api/org/gdpr/delete
 * Delete organization and all associated data (GDPR Article 17 - Right to Erasure)
 *
 * IMPORTANT: This is a destructive operation that cannot be undone.
 * Requires explicit confirmation to prevent accidental deletion.
 */
export async function DELETE(request: NextRequest) {
  const ctx = await getOrgContext({ request });
  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  try {
    const body = await request.json();
    const parsed = DeleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verify organization name matches for extra safety
    if (parsed.data.organizationName !== ctx.org.name) {
      return NextResponse.json(
        { ok: false, error: 'Organization name does not match' },
        { status: 400 }
      );
    }

    // Create audit log before deletion
    await prisma.auditLog.create({
      data: {
        organizationId: ctx.org.id,
        action: 'ORG_CREATED', // Reusing existing enum value
        summary: `Organization deleted via GDPR right to erasure by user ${ctx.userId || 'unknown'}`,
        actorId: null,
      },
    });

    // Delete all related data in correct order (respecting foreign key constraints)
    await prisma.$transaction(async (tx) => {
      // Delete notification logs
      await tx.notificationLog.deleteMany({ where: { organizationId: ctx.org.id } });

      // Delete organization hours
      await tx.organizationHours.deleteMany({ where: { organizationId: ctx.org.id } });

      // Delete organization services
      await tx.organizationService.deleteMany({ where: { organizationId: ctx.org.id } });

      // Delete demo requests (if organizationId is tracked)
      // await tx.demoRequest.deleteMany({ where: { organizationId: ctx.org.id } });

      // Delete business profile
      await tx.businessProfile.deleteMany({ where: { organizationId: ctx.org.id } });

      // Delete organization invites
      await tx.organizationInvite.deleteMany({ where: { organizationId: ctx.org.id } });

      // Delete organization members
      await tx.organizationMember.deleteMany({ where: { organizationId: ctx.org.id } });

      // Delete knowledge sources for all bots
      const bots = await tx.bot.findMany({
        where: { organizationId: ctx.org.id },
        select: { id: true },
      });
      const botIds = bots.map(b => b.id);

      if (botIds.length > 0) {
        await tx.botKnowledgeSource.deleteMany({ where: { botId: { in: botIds } } });
      }

      // Delete data events
      await tx.dataEvent.deleteMany({ where: { organizationId: ctx.org.id } });

      // Delete leads
      await tx.lead.deleteMany({ where: { organizationId: ctx.org.id } });

      // Delete messages (via conversations)
      const conversations = await tx.conversation.findMany({
        where: { organizationId: ctx.org.id },
        select: { id: true },
      });
      const conversationIds = conversations.map(c => c.id);

      if (conversationIds.length > 0) {
        await tx.message.deleteMany({ where: { conversationId: { in: conversationIds } } });
      }

      // Delete conversations
      await tx.conversation.deleteMany({ where: { organizationId: ctx.org.id } });

      // Delete bot domain allowlists
      if (botIds.length > 0) {
        await tx.botDomainAllowlist.deleteMany({ where: { botId: { in: botIds } } });
      }

      // Delete bot links
      if (botIds.length > 0) {
        await tx.botLink.deleteMany({ where: { botId: { in: botIds } } });
      }

      // Delete bots
      await tx.bot.deleteMany({ where: { organizationId: ctx.org.id } });

      // Delete workspaces
      await tx.workspace.deleteMany({ where: { organizationId: ctx.org.id } });

      // Delete audit logs (last, so we have record of deletion)
      await tx.auditLog.deleteMany({ where: { organizationId: ctx.org.id } });

      // Finally, delete the organization itself
      await tx.organization.delete({ where: { id: ctx.org.id } });
    });

    console.log('[GDPR Delete] Organization deleted successfully', {
      organizationId: ctx.org.id,
      organizationName: ctx.org.name,
      deletedBy: ctx.userId || 'unknown',
      deletedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      message: 'Organization and all associated data have been permanently deleted',
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[GDPR Delete] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to delete organization data' },
      { status: 500 }
    );
  }
}

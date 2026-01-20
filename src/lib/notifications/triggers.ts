import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { sendNotification, buildHotLeadEmail, buildBookingClickEmail } from "./email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5000";

export async function triggerHotLeadNotification(params: {
  organizationId: number;
  leadId: number;
  leadPublicId: string;
  lead: {
    name: string | null;
    email: string | null;
    phone: string | null;
    score: number;
    temperature: string;
    serviceName?: string | null;
  };
}): Promise<void> {
  const { organizationId, leadId, leadPublicId, lead } = params;

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      notificationEnabled: true,
      notifyOnHotLead: true,
      notificationEmails: true,
    },
  });

  if (!org) {
    console.log(`[NOTIFICATION] Organization ${organizationId} not found`);
    return;
  }

  if (!org.notificationEnabled) {
    console.log(`[NOTIFICATION] Notifications disabled for org ${organizationId}`);
    return;
  }

  if (!org.notifyOnHotLead) {
    console.log(`[NOTIFICATION] Hot lead notifications disabled for org ${organizationId}`);
    return;
  }

  if (!org.notificationEmails || org.notificationEmails.length === 0) {
    console.log(`[NOTIFICATION] No notification emails configured for org ${organizationId}`);
    return;
  }

  await sendNotification({
    organizationId,
    leadId,
    leadPublicId,
    type: NotificationType.HOT_LEAD,
    recipientEmails: org.notificationEmails,
    emailBuilder: () => buildHotLeadEmail(lead, APP_URL, leadPublicId),
  });
}

export async function triggerBookingClickNotification(params: {
  organizationId: number;
  leadId: number;
  leadPublicId: string;
  lead: {
    name: string | null;
    email: string | null;
    phone: string | null;
    serviceName?: string | null;
  };
}): Promise<void> {
  const { organizationId, leadId, leadPublicId, lead } = params;

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      notificationEnabled: true,
      notifyOnBookingClick: true,
      notificationEmails: true,
    },
  });

  if (!org) {
    console.log(`[NOTIFICATION] Organization ${organizationId} not found`);
    return;
  }

  if (!org.notificationEnabled) {
    console.log(`[NOTIFICATION] Notifications disabled for org ${organizationId}`);
    return;
  }

  if (!org.notifyOnBookingClick) {
    console.log(`[NOTIFICATION] Booking click notifications disabled for org ${organizationId}`);
    return;
  }

  if (!org.notificationEmails || org.notificationEmails.length === 0) {
    console.log(`[NOTIFICATION] No notification emails configured for org ${organizationId}`);
    return;
  }

  await sendNotification({
    organizationId,
    leadId,
    leadPublicId,
    type: NotificationType.BOOKING_LINK_CLICK,
    recipientEmails: org.notificationEmails,
    emailBuilder: () => buildBookingClickEmail(lead, APP_URL, leadPublicId),
  });
}

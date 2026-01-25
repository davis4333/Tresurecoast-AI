import { prisma } from "@/lib/prisma";
import { NotificationType, NotificationStatus } from "@prisma/client";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || "noreply@treasurecoast.ai";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function sendEmailWithResend(payload: EmailPayload): Promise<SendResult> {
  if (!RESEND_API_KEY) {
    console.log("[NOTIFICATION] Resend API key not configured, skipping email");
    return { success: false, error: "Email provider not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      messageId: data.id,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function sendEmailWithRetry(payload: EmailPayload): Promise<SendResult> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await sendEmailWithResend(payload);

    if (result.success) {
      return result;
    }

    lastError = result.error;

    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
    }
  }

  return { success: false, error: lastError };
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildHotLeadEmail(lead: {
  name: string | null;
  email: string | null;
  phone: string | null;
  score: number;
  temperature: string;
  serviceName?: string | null;
}, appUrl: string, leadPublicId: string): EmailPayload {
  const leadUrl = `${appUrl}/app/leads?lead=${leadPublicId}`;

  return {
    to: "",
    subject: `Hot Lead Alert: ${escapeHtml(lead.name) || "New Lead"}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hot Lead Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px 12px 0 0; padding: 32px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Hot Lead Alert</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">A high-intent lead just came in!</p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #ffffff; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding-bottom: 24px;">
              <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 20px;">${escapeHtml(lead.name) || "New Lead"}</h2>
              <table role="presentation" cellspacing="0" cellpadding="0">
                ${lead.email ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 80px;">Email:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px;"><a href="mailto:${escapeHtml(lead.email)}" style="color: #6366f1; text-decoration: none;">${escapeHtml(lead.email)}</a></td>
                </tr>
                ` : ""}
                ${lead.phone ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Phone:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px;"><a href="tel:${escapeHtml(lead.phone)}" style="color: #6366f1; text-decoration: none;">${escapeHtml(lead.phone)}</a></td>
                </tr>
                ` : ""}
                ${lead.serviceName ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Service:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${escapeHtml(lead.serviceName)}</td>
                </tr>
                ` : ""}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #10b981; color: #ffffff; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">${escapeHtml(lead.temperature)}</td>
                  <td style="padding-left: 12px; color: #1f2937; font-size: 24px; font-weight: 700;">Score: ${lead.score}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <a href="${leadUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">View Lead Details</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">Sent by Treasure Coast AI</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  };
}

export function buildPaymentReceiptEmail(params: {
  organizationName: string;
  planName: string;
  amount: number;
  invoiceUrl?: string;
  receiptUrl?: string;
}): EmailPayload {
  const { organizationName, planName, amount, invoiceUrl, receiptUrl } = params;
  const formattedAmount = `$${(amount / 100).toFixed(2)}`;

  return {
    to: "",
    subject: `Payment Receipt - ${planName} Plan`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px 12px 0 0; padding: 32px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Payment Successful</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Thank you for your payment!</p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #ffffff; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding-bottom: 24px;">
              <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 20px;">Payment Details</h2>
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Organization:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${escapeHtml(organizationName)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Plan:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${escapeHtml(planName)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-weight: 600;">Amount Paid:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 18px; font-weight: 700; text-align: right; border-top: 1px solid #e5e7eb; padding-top: 12px;">${formattedAmount}</td>
                </tr>
              </table>
            </td>
          </tr>
          ${invoiceUrl || receiptUrl ? `
          <tr>
            <td style="padding-bottom: 24px;">
              ${invoiceUrl ? `<a href="${invoiceUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; margin-right: 8px;">View Invoice</a>` : ""}
              ${receiptUrl ? `<a href="${receiptUrl}" style="display: inline-block; background-color: #f3f4f6; color: #374151; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">Download Receipt</a>` : ""}
            </td>
          </tr>
          ` : ""}
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
              <p style="margin: 0 0 8px;">If you have any questions about this payment, please contact our support team.</p>
              <p style="margin: 0;">Thank you for being a Treasure Coast AI customer!</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">Sent by Treasure Coast AI</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  };
}

export function buildBookingClickEmail(lead: {
  name: string | null;
  email: string | null;
  phone: string | null;
  serviceName?: string | null;
}, appUrl: string, leadPublicId: string): EmailPayload {
  const leadUrl = `${appUrl}/app/leads?lead=${leadPublicId}`;

  return {
    to: "",
    subject: `Booking Link Clicked: ${escapeHtml(lead.name) || "Lead"}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Link Clicked</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 12px 12px 0 0; padding: 32px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Booking Link Clicked</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Someone is ready to book!</p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #ffffff; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding-bottom: 24px;">
              <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 20px;">${escapeHtml(lead.name) || "Lead"}</h2>
              <table role="presentation" cellspacing="0" cellpadding="0">
                ${lead.email ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 80px;">Email:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px;"><a href="mailto:${escapeHtml(lead.email)}" style="color: #6366f1; text-decoration: none;">${escapeHtml(lead.email)}</a></td>
                </tr>
                ` : ""}
                ${lead.phone ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Phone:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px;"><a href="tel:${escapeHtml(lead.phone)}" style="color: #6366f1; text-decoration: none;">${escapeHtml(lead.phone)}</a></td>
                </tr>
                ` : ""}
                ${lead.serviceName ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Service:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${escapeHtml(lead.serviceName)}</td>
                </tr>
                ` : ""}
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <a href="${leadUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">View Lead Details</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">Sent by Treasure Coast AI</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  };
}

export async function sendNotification(params: {
  organizationId: number;
  leadId: number;
  leadPublicId: string;
  type: NotificationType;
  recipientEmails: string[];
  emailBuilder: (to: string) => EmailPayload;
}): Promise<void> {
  const { organizationId, leadId, leadPublicId, type, recipientEmails, emailBuilder } = params;

  for (const email of recipientEmails) {
    const emailPayload = emailBuilder(email);
    emailPayload.to = email;

    const log = await prisma.notificationLog.create({
      data: {
        organizationId,
        leadId,
        type,
        recipientEmail: email,
        status: NotificationStatus.PENDING,
      },
    });

    const result = await sendEmailWithRetry(emailPayload);

    await prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
        providerMessageId: result.messageId,
        errorMessage: result.error,
      },
    });

    if (result.success) {
      console.log(`[NOTIFICATION] Sent ${type} email to ${email} for lead ${leadPublicId}`);
    } else {
      console.error(`[NOTIFICATION] Failed to send ${type} email to ${email}: ${result.error}`);
    }
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validateEmailList(emails: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of emails) {
    const trimmed = email.trim().toLowerCase();
    if (trimmed && isValidEmail(trimmed)) {
      valid.push(trimmed);
    } else if (trimmed) {
      invalid.push(trimmed);
    }
  }

  return { valid, invalid };
}

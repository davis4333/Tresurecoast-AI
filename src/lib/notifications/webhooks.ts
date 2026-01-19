export interface DemoRequestPayload {
  id: number;
  name: string;
  email: string;
  businessName: string;
  phone: string | null;
  createdAt: string;
}

export interface LeadPayload {
  leadPublicId: string;
  orgId: number;
  botId: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string;
}

export function logDemoRequest(payload: DemoRequestPayload): void {
  console.log(
    `[DEMO_REQUEST] name=${payload.name} email=${payload.email} business=${payload.businessName} phone=${payload.phone || ""} id=${payload.id}`
  );
}

export function logNewLead(payload: LeadPayload): void {
  console.log(
    `[NEW_LEAD] orgId=${payload.orgId} botId=${payload.botId} leadId=${payload.leadPublicId} name=${payload.name || ""} phone=${payload.phone || ""} source=${payload.source}`
  );
}

export async function sendDemoRequestWebhook(payload: DemoRequestPayload): Promise<boolean> {
  const webhookUrl = process.env.DEMO_REQUEST_WEBHOOK_URL;
  if (!webhookUrl) {
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "demo_request",
        ...payload,
      }),
    });

    if (!response.ok) {
      console.error(`[DEMO_REQUEST_WEBHOOK] Failed with status ${response.status}`);
    }

    return response.ok;
  } catch (error) {
    console.error("[DEMO_REQUEST_WEBHOOK] Error:", error);
    return false;
  }
}

export async function sendLeadWebhook(payload: LeadPayload): Promise<boolean> {
  const webhookUrl = process.env.LEAD_WEBHOOK_URL;
  if (!webhookUrl) {
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "new_lead",
        ...payload,
      }),
    });

    if (!response.ok) {
      console.error(`[LEAD_WEBHOOK] Failed with status ${response.status}`);
    }

    return response.ok;
  } catch (error) {
    console.error("[LEAD_WEBHOOK] Error:", error);
    return false;
  }
}

export async function notifyDemoRequest(payload: DemoRequestPayload): Promise<void> {
  logDemoRequest(payload);
  await sendDemoRequestWebhook(payload);
}

export async function notifyNewLead(payload: LeadPayload): Promise<void> {
  logNewLead(payload);
  await sendLeadWebhook(payload);
}

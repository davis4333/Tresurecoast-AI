const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const LIMITS = {
  chat: { max: 30, window: 60 },
  leads: { max: 10, window: 60 },
  leads_status: { max: 20, window: 60 },
  demo_request: { max: 5, window: 60 },
  booking_click: { max: 20, window: 60 },
  bot_fetch: { max: 60, window: 60 },
  widget_config: { max: 60, window: 60 },
  messages_fetch: { max: 30, window: 60 },
  lead_detail: { max: 30, window: 60 },
  leads_recent: { max: 30, window: 60 }
} as const;

type Endpoint = keyof typeof LIMITS;

function getClientIdentifier(req: Request): string {
  // Prefer client IP (works behind proxies if configured)
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  // Final fallback: stable but coarse
  return "unknown";
}

export async function checkRateLimit(
  req: Request,
  endpoint: Endpoint,
  botPublicKey: string
): Promise<{ allowed: boolean; error?: string }> {
  // No-op if Upstash not configured.
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return { allowed: true };
  }

  const identifier = getClientIdentifier(req);
  const key = `rl:${endpoint}:${botPublicKey}:${identifier}`;
  const limit = LIMITS[endpoint];

  try {
    const incrRes = await fetch(`${UPSTASH_URL}/incr/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: "no-store"
    });

    if (!incrRes.ok) {
      console.error("[RATE LIMIT] INCR failed", await incrRes.text());
      return { allowed: true };
    }

    const incrData: unknown = await incrRes.json();
    const countRaw = (incrData as any)?.result;
    const count = typeof countRaw === "number" ? countRaw : Number(countRaw);

    if (!Number.isFinite(count)) {
      console.error("[RATE LIMIT] Unexpected count", countRaw);
      return { allowed: true };
    }

    if (count === 1) {
      const expRes = await fetch(
        `${UPSTASH_URL}/expire/${encodeURIComponent(key)}/${limit.window}`,
        {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
          cache: "no-store"
        }
      );

      if (!expRes.ok) {
        console.error("[RATE LIMIT] EXPIRE failed", await expRes.text());
      }
    }

    if (count > limit.max) {
      return { allowed: false, error: "Rate limit exceeded" };
    }

    return { allowed: true };
  } catch (error) {
    console.error("[RATE LIMIT] Error:", error);
    // Fail-open to avoid bricking the widget if Upstash has an incident.
    return { allowed: true };
  }
}

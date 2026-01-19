import { prisma } from "@/lib/prisma";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getDemoBotKeyFromEnv(): string | null {
  const key = process.env.NEXT_PUBLIC_DEMO_BOT_KEY;
  if (!key) return null;
  if (!UUID_REGEX.test(key)) {
    console.warn("[DEMO] NEXT_PUBLIC_DEMO_BOT_KEY is not a valid UUID:", key);
    return null;
  }
  return key;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function resolveDemoBotKey(): Promise<string | null> {
  const envKey = getDemoBotKeyFromEnv();
  if (envKey) {
    return envKey;
  }

  if (isProduction()) {
    return null;
  }

  const firstBot = await prisma.bot.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: { publicKey: true },
  });

  return firstBot?.publicKey ?? null;
}

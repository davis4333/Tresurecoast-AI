import type { Metadata } from "next";
import { ChatBox } from "./ChatBox";

export const metadata: Metadata = {
  title: "Treasure Coast AI Widget",
  robots: {
    index: false,
    follow: false
  }
};

type BotConfig = {
  ok: boolean;
  bot?: {
    botPublicKey: string;
    name: string;
    greeting: string | null;
    fallbackText: string | null;
    orgPublicId: string;
    orgName: string;
    workspacePublicId: string;
    workspaceName: string;
    links: Array<{
      type: string;
      label: string;
      url: string;
    }>;
    domainAllowlist: string[];
  };
  error?: string;
};

async function fetchBotConfig(botPublicKey: string): Promise<BotConfig> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!baseUrl) {
    return { ok: false, error: "Configuration error" };
  }

  try {
    const res = await fetch(`${baseUrl}/api/public/bots/${encodeURIComponent(botPublicKey)}`, {
      cache: "no-store"
    });

    const data = (await res
      .json()
      .catch(() => ({ ok: false, error: "Invalid response" }))) as BotConfig;

    return data;
  } catch {
    return { ok: false, error: "Failed to load bot" };
  }
}

export default async function WidgetPage({ params }: { params: { botPublicKey: string } }) {
  const config = await fetchBotConfig(params.botPublicKey);

  if (!config.ok || !config.bot) {
    return (
      <main className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto max-w-md rounded-lg border border-white/10 bg-white/5 p-6">
          <h1 className="text-xl font-semibold">Bot Not Available</h1>
          <p className="mt-2 text-sm text-white/70">{config.error || "This bot could not be found."}</p>
          <p className="mt-4 font-mono text-xs text-white/40">Treasure Coast AI</p>
        </div>
      </main>
    );
  }

  const { bot } = config;

  const bubbleText = bot.greeting?.trim() || bot.fallbackText?.trim() || "Hi — how can I help today?";

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-md space-y-6">
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h1 className="text-2xl font-semibold">{bot.name}</h1>
          <p className="mt-1 text-sm text-white/70">{bot.orgName || "Treasure Coast AI"}</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/90">{bubbleText}</p>
        </div>

        {bot.links.length > 0 && (
          <div className="space-y-2">
            {bot.links.map((link) => (
              <a
                key={`${link.type}:${link.url}`}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-md border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-medium text-white hover:bg-white/10"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        <ChatBox botPublicKey={bot.botPublicKey} />

        <p className="font-mono text-xs text-white/40">{bot.botPublicKey}</p>
      </div>
    </main>
  );
}

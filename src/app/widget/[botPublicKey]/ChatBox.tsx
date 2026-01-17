"use client";

import { useState } from "react";

type ChatBoxProps = {
  botPublicKey: string;
};

type ChatResponse = {
  ok: boolean;
  error?: string;
  conversationPublicId?: string;
  assistant?: {
    content?: string;
  };
};

export function ChatBox({ botPublicKey }: ChatBoxProps) {
  const [message, setMessage] = useState("");
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);

    try {
      const storageKey = `tca_conversation_${botPublicKey}`;
      const storedConvId = localStorage.getItem(storageKey);

      const res = await fetch("/api/public/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botPublicKey,
          conversationPublicId: storedConvId,
          message: trimmed
        })
      });

      const data = (await res
        .json()
        .catch(() => ({ ok: false, error: "Invalid response" }))) as ChatResponse;

      if (data.ok) {
        if (typeof data.conversationPublicId === "string" && typeof data.assistant?.content === "string") {
          localStorage.setItem(storageKey, data.conversationPublicId);
          setLastReply(data.assistant.content);
          setMessage("");
        } else {
          setLastReply("Error: Invalid response from server");
        }
      } else {
        setLastReply(`Error: ${data.error || "Unknown error"}`);
      }
    } catch {
      setLastReply("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {lastReply && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/90">{lastReply}</p>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          disabled={isLoading}
          className="flex-1 rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-white/30 focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !message.trim()}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

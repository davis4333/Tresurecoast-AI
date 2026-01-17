"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { isValidUUID } from "@/lib/public/uuid";

type ChatBoxProps = {
  botPublicKey: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export function ChatBox({ botPublicKey }: ChatBoxProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const storageKey = `tca_conversation_${botPublicKey}`;

  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const fetchHistory = useCallback(
    async (convId: string) => {
      setIsLoadingHistory(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/public/conversations/${encodeURIComponent(convId)}/messages?botPublicKey=${encodeURIComponent(
            botPublicKey
          )}`
        );

        const data = await res.json();

        if (data.ok) {
          setMessages(data.messages);
        } else if (res.status === 400 || res.status === 404) {
          localStorage.removeItem(storageKey);
          setMessages([]);
        } else {
          setError("Failed to load message history");
        }
      } catch {
        setError("Failed to load message history");
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [botPublicKey, storageKey]
  );

  useEffect(() => {
    const convId = localStorage.getItem(storageKey);
    if (convId) {
      if (!isValidUUID(convId)) {
        localStorage.removeItem(storageKey);
        return;
      }
      fetchHistory(convId);
    }
  }, [storageKey, fetchHistory]);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSending || showLeadForm) return;

    setIsSending(true);
    setError(null);

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");

    try {
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

      const data = await res.json();

      if (data.ok) {
        if (typeof data.conversationPublicId === "string" && typeof data.assistant?.content === "string") {
          const wasNewConversation = !storedConvId;

          localStorage.setItem(storageKey, data.conversationPublicId);

          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: data.assistant.content,
            timestamp: new Date().toISOString()
          };
          setMessages((prev) => [...prev, assistantMessage]);

          if (wasNewConversation) {
            fetchHistory(data.conversationPublicId);
          }

          if (data.leadCaptureRequested === true) {
            setShowLeadForm(true);
          }
        } else {
          setError("Invalid response from server");
        }
      } else {
        setError(data.error || "Failed to send message");
      }
    } catch {
      setError("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleLeadSubmit = async () => {
    const trimmedName = leadName.trim();
    const trimmedEmail = leadEmail.trim();
    const trimmedPhone = leadPhone.trim();

    if (!trimmedName && !trimmedEmail && !trimmedPhone) {
      setLeadError("Please provide at least one contact field");
      return;
    }

    setIsSubmittingLead(true);
    setLeadError(null);

    try {
      const convId = localStorage.getItem(storageKey);

      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botPublicKey,
          conversationPublicId: convId,
          name: trimmedName || undefined,
          email: trimmedEmail || undefined,
          phone: trimmedPhone || undefined
        })
      });

      const data = await res.json();

      if (data.ok) {
        setShowLeadForm(false);
        setLeadName("");
        setLeadEmail("");
        setLeadPhone("");

        if (convId) {
          fetchHistory(convId);
        }
      } else {
        setLeadError(data.error || "Failed to submit");
      }
    } catch {
      setLeadError("Failed to submit");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleCancelLead = () => {
    setShowLeadForm(false);
    setLeadError(null);
  };

  const isInputDisabled = isSending || isLoadingHistory || showLeadForm || isSubmittingLead;

  return (
    <div className="space-y-4">
      {isLoadingHistory && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-sm text-white/60">Loading conversation...</p>
        </div>
      )}

      {!isLoadingHistory && messages.length > 0 && (
        <div className="max-h-96 space-y-3 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/5 text-white/90"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {showLeadForm && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
          <p className="text-sm text-white/80">Leave your contact info:</p>

          <input
            type="text"
            value={leadName}
            onChange={(e) => setLeadName(e.target.value)}
            placeholder="Name"
            disabled={isSubmittingLead}
            className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-white/30 focus:outline-none disabled:opacity-50"
          />

          <input
            type="email"
            value={leadEmail}
            onChange={(e) => setLeadEmail(e.target.value)}
            placeholder="Email"
            disabled={isSubmittingLead}
            className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-white/30 focus:outline-none disabled:opacity-50"
          />

          <input
            type="tel"
            value={leadPhone}
            onChange={(e) => setLeadPhone(e.target.value)}
            placeholder="Phone"
            disabled={isSubmittingLead}
            className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-white/30 focus:outline-none disabled:opacity-50"
          />

          {leadError && (
            <p className="text-sm text-red-400">{leadError}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleLeadSubmit}
              disabled={isSubmittingLead}
              className="flex-1 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
            >
              {isSubmittingLead ? "Submitting..." : "Submit"}
            </button>

            <button
              onClick={handleCancelLead}
              disabled={isSubmittingLead}
              className="rounded-md border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/5 disabled:opacity-50"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          disabled={isInputDisabled}
          className="flex-1 rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-white/30 focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={isInputDisabled || !message.trim()}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
        >
          {isSending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

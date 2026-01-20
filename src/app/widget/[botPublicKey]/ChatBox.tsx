"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { isValidUUID } from "@/lib/public/uuid";
import { BookingDirectives, type BookingService, type BookingDirectiveType } from "./BookingDirectives";

type ChatBoxProps = {
  botPublicKey: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

type BookingFlowData = {
  directiveType?: BookingDirectiveType;
  services?: BookingService[];
  bookingUrl?: string;
  leadCreated?: boolean;
};

type WidgetBranding = {
  whiteLabelEnabled?: boolean;
  brandCompanyName?: string | null;
  brandLogoUrl?: string | null;
  brandPrimaryColor?: string;
  showPoweredBy?: boolean;
};

type WidgetConfig = {
  botName?: string;
  greeting?: string;
  branding?: WidgetBranding;
};

export function ChatBox({ botPublicKey }: ChatBoxProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [bookingFlow, setBookingFlow] = useState<BookingFlowData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const storageKey = `tca_conversation_${botPublicKey}`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`/api/public/widget-config?botPublicKey=${encodeURIComponent(botPublicKey)}`);
        const data = await res.json();
        if (data.ok && data.config) {
          setConfig({
            botName: data.config.name,
            greeting: data.config.greeting,
            branding: data.config.branding,
          });
        }
      } catch {
        // Silently fail - header will show defaults
      }
    }
    fetchConfig();
  }, [botPublicKey]);

  const fetchHistory = useCallback(
    async (convId: string) => {
      setIsLoadingHistory(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/public/conversations/${encodeURIComponent(convId)}/messages?botPublicKey=${encodeURIComponent(botPublicKey)}`
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
    if (!trimmed || isSending) return;

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
        if (
          typeof data.conversationPublicId === "string" &&
          typeof data.assistant?.content === "string"
        ) {
          const wasNewConversation = !storedConvId;

          localStorage.setItem(storageKey, data.conversationPublicId);

          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: data.assistant.content,
            timestamp: new Date().toISOString()
          };
          setMessages((prev) => [...prev, assistantMessage]);

          if (data.leadCaptureRequested === true && !leadSubmitted) {
            setShowLeadForm(true);
          }

          if (data.bookingFlow) {
            setBookingFlow({
              directiveType: data.bookingFlow.directiveType,
              services: data.bookingFlow.services,
              bookingUrl: data.externalRedirectUrl || data.bookingFlow.bookingUrl,
              leadCreated: data.bookingFlow.leadCreated,
            });
          } else {
            setBookingFlow(null);
          }

          if (wasNewConversation) {
            fetchHistory(data.conversationPublicId);
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
      setLeadError("Please provide at least one contact method");
      return;
    }

    setIsSubmittingLead(true);
    setLeadError(null);

    try {
      const storedConvId = localStorage.getItem(storageKey);

      if (!storedConvId) {
        throw new Error("No active conversation");
      }

      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botPublicKey,
          conversationPublicId: storedConvId,
          name: trimmedName || undefined,
          email: trimmedEmail || undefined,
          phone: trimmedPhone || undefined
        })
      });

      const data = await res.json();

      if (data.ok) {
        setShowLeadForm(false);
        setLeadSubmitted(true);
        setLeadName("");
        setLeadEmail("");
        setLeadPhone("");
        fetchHistory(storedConvId);
      } else {
        setLeadError(data.error || "Failed to submit contact information");
      }
    } catch (err) {
      setLeadError(
        err instanceof Error
          ? err.message
          : "Failed to submit contact information"
      );
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const leadHasAny = !!leadName.trim() || !!leadEmail.trim() || !!leadPhone.trim();

  const handleServiceSelect = useCallback(async (service: BookingService) => {
    setIsSending(true);
    setError(null);

    const userMessage: ChatMessage = {
      role: "user",
      content: service.name,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const storedConvId = localStorage.getItem(storageKey);

      const res = await fetch("/api/public/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botPublicKey,
          conversationPublicId: storedConvId,
          message: service.name
        })
      });

      const data = await res.json();

      if (data.ok && data.assistant?.content) {
        localStorage.setItem(storageKey, data.conversationPublicId);

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.assistant.content,
          timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (data.bookingFlow) {
          setBookingFlow({
            directiveType: data.bookingFlow.directiveType,
            services: data.bookingFlow.services,
            bookingUrl: data.externalRedirectUrl || data.bookingFlow.bookingUrl,
            leadCreated: data.bookingFlow.leadCreated,
          });
        } else {
          setBookingFlow(null);
        }
      } else {
        setError(data.error || "Failed to send message");
      }
    } catch {
      setError("Failed to send message");
    } finally {
      setIsSending(false);
    }
  }, [botPublicKey, storageKey]);

  const branding = config?.branding;
  const headerBg = branding?.whiteLabelEnabled && branding?.brandPrimaryColor
    ? branding.brandPrimaryColor
    : "var(--color-brand-primary)";
  const showLogo = branding?.whiteLabelEnabled && branding?.brandLogoUrl;
  const showCompanyName = branding?.whiteLabelEnabled && branding?.brandCompanyName;
  const showPoweredBy = branding?.showPoweredBy !== false;
  const poweredByText = branding?.whiteLabelEnabled && branding?.brandCompanyName
    ? `Powered by ${branding.brandCompanyName}`
    : "Powered by Treasure Coast AI";

  return (
    <div className="flex flex-col space-y-4">
      {/* Header - premium branding section with animation */}
      <div
        className="tca-chat-header text-white"
        style={{
          backgroundColor: headerBg,
        }}
      >
        <div className="flex items-center gap-3">
          {showLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.brandLogoUrl!}
              alt="Logo"
              className="h-8 w-8 rounded-md object-contain"
            />
          )}
          <div className="flex-1">
            <h2 className="text-lg font-semibold leading-tight">
              {showCompanyName ? branding.brandCompanyName : (config?.botName || "Chat Support")}
            </h2>

            {config?.greeting && (
              <p className="mt-1 text-sm opacity-90">
                {config.greeting}
              </p>
            )}
          </div>
        </div>
      </div>

      {isLoadingHistory && (
        <div className="tca-loading-message">
          <p className="text-sm tca-text-secondary">Loading conversation...</p>
        </div>
      )}

      {!isLoadingHistory && messages.length > 0 && (
        <div className="tca-message-container-enter tca-surface tca-border tca-radius-lg max-h-96 space-y-3 overflow-y-auto p-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex tca-message-enter ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] sm:max-w-[70%] lg:max-w-[60%] ${
                  msg.role === "user" ? "tca-bubble-user" : "tca-bubble-assistant"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {bookingFlow && (
        bookingFlow.directiveType === "SHOW_SERVICE_PICKER" ||
        bookingFlow.directiveType === "SHOW_BOOKING_LINK"
      ) && (
        <BookingDirectives
          directiveType={bookingFlow.directiveType}
          services={bookingFlow.services}
          bookingUrl={bookingFlow.bookingUrl}
          conversationPublicId={localStorage.getItem(storageKey) || undefined}
          botPublicKey={botPublicKey}
          headerBg={headerBg}
          onServiceSelect={handleServiceSelect}
        />
      )}

      {showLeadForm && (
        <div className="tca-lead-form">
          <p className="mb-4 text-sm font-medium tca-text-primary">
            Please share your contact information:
          </p>
          <div className="space-y-3">
            <input
              type="text"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              placeholder="Name"
              disabled={isSubmittingLead}
              className="tca-input tca-focus-ring"
              data-testid="input-lead-name"
            />
            <input
              type="email"
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
              placeholder="Email"
              disabled={isSubmittingLead}
              className="tca-input tca-focus-ring"
              data-testid="input-lead-email"
            />
            <input
              type="tel"
              value={leadPhone}
              onChange={(e) => setLeadPhone(e.target.value)}
              placeholder="Phone"
              disabled={isSubmittingLead}
              className="tca-input tca-focus-ring"
              data-testid="input-lead-phone"
            />
            {leadError && (
              <p className="text-sm font-medium text-red-500" data-testid="error-lead-submission">
                {leadError}
              </p>
            )}
            <button
              onClick={handleLeadSubmit}
              disabled={isSubmittingLead || !leadHasAny}
              className="tca-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-lead-submit"
            >
              {isSubmittingLead ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="tca-error-message">
          <p className="text-sm font-medium text-red-600 dark:text-red-400" data-testid="error-message">
            {error}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          disabled={isSending || isLoadingHistory || showLeadForm || isSubmittingLead}
          data-testid="chat-input"
          className="tca-input tca-focus-ring flex-1"
        />
        <button
          onClick={handleSend}
          disabled={
            isSending ||
            isLoadingHistory ||
            showLeadForm ||
            isSubmittingLead ||
            !message.trim()
          }
          data-testid="chat-send"
          style={{
            backgroundColor: headerBg,
          }}
          className="tca-btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isSending ? "..." : "Send"}
        </button>
      </div>

      {/* Powered by footer */}
      {showPoweredBy && (
        <div className="text-center text-xs text-[var(--color-text-muted)]">
          {poweredByText}
        </div>
      )}
    </div>
  );
}

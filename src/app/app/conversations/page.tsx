"use client";

import { useState, useEffect } from "react";
import { TcaCard, TcaCardBody, TcaCardHeader } from "@/components/tca/TcaCard";
import { TcaButton } from "@/components/tca/TcaButton";
import { TcaBadge } from "@/components/tca/TcaBadge";
import {
  MessageSquare,
  User,
  Bot,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Phone,
  Mail,
  Calendar,
  Flame,
} from "lucide-react";

interface ConversationSummary {
  publicId: string;
  botName: string;
  botPublicKey: string | null;
  lead: {
    publicId: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    temperature: string;
  } | null;
  messageCount: number;
  lastMessage: {
    content: string;
    role: string;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: number;
  role: string;
  content: string;
  createdAt: string;
}

interface ConversationDetail {
  publicId: string;
  bot: {
    publicKey: string | null;
    name: string;
    greeting: string | null;
  };
  lead: {
    publicId: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    temperature: string;
    score: number | null;
    createdAt: string;
  } | null;
  messages: Message[];
  bookings: Array<{
    publicId: string;
    status: string;
    scheduledAt: string;
    customerName: string;
    serviceName: string | null;
  }>;
  stats: {
    messageCount: number;
    userMessages: number;
    assistantMessages: number;
    durationMs: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TEMP_COLORS: Record<string, string> = {
  HOT: "bg-orange-500/20 text-orange-400",
  WARM: "bg-yellow-500/20 text-yellow-400",
  COLD: "bg-blue-500/20 text-blue-400",
};

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

function formatDuration(ms: number): string {
  if (ms < 60000) return "< 1 min";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [hasLeadFilter, setHasLeadFilter] = useState<string>("");

  useEffect(() => {
    fetchConversations(1);
  }, [search, hasLeadFilter]);

  async function fetchConversations(page: number) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (hasLeadFilter) params.set("hasLead", hasLeadFilter);

      const res = await fetch(`/api/org/conversations?${params}`);
      const data = await res.json();

      if (data.ok) {
        setConversations(data.conversations);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  }

  async function selectConversation(publicId: string) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/org/conversations/${publicId}`);
      const data = await res.json();

      if (data.ok) {
        setSelectedConversation(data.conversation);
      }
    } catch (err) {
      console.error("Failed to fetch conversation:", err);
    } finally {
      setDetailLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="tca-gradient-text text-3xl font-extrabold tracking-tight">
            Conversations
          </h2>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            View chat histories and conversation transcripts.
          </p>
        </div>
        {pagination && (
          <div className="text-sm text-[var(--color-text-secondary)]">
            {pagination.total} conversation{pagination.total !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-10 pr-10 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand-primary)] focus:outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <select
          value={hasLeadFilter}
          onChange={(e) => setHasLeadFilter(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
        >
          <option value="">All conversations</option>
          <option value="true">With lead</option>
          <option value="false">Without lead</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Conversation List */}
        <div className="lg:col-span-1">
          <TcaCard>
            <TcaCardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Conversations
              </div>
            </TcaCardHeader>
            <TcaCardBody className="max-h-[600px] overflow-y-auto p-0">
              {loading ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-[var(--color-text-secondary)]">
                  No conversations found
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {conversations.map((conv) => (
                    <button
                      key={conv.publicId}
                      onClick={() => selectConversation(conv.publicId)}
                      className={`w-full p-4 text-left transition-colors hover:bg-[var(--color-surface-hover)] ${
                        selectedConversation?.publicId === conv.publicId
                          ? "bg-[var(--color-surface-hover)]"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[var(--color-text-primary)] truncate">
                              {conv.lead?.name || conv.lead?.email || "Anonymous"}
                            </span>
                            {conv.lead?.temperature && (
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TEMP_COLORS[conv.lead.temperature] || ""}`}>
                                {conv.lead.temperature === "HOT" && <Flame className="mr-1 h-3 w-3" />}
                                {conv.lead.temperature}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                            {conv.botName} - {conv.messageCount} messages
                          </div>
                          {conv.lastMessage && (
                            <div className="mt-2 truncate text-sm text-[var(--color-text-secondary)]">
                              {conv.lastMessage.content.slice(0, 60)}
                              {conv.lastMessage.content.length > 60 ? "..." : ""}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                          {formatTimeAgo(conv.updatedAt)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--color-border)] p-4">
                  <TcaButton
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchConversations(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </TcaButton>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <TcaButton
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchConversations(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </TcaButton>
                </div>
              )}
            </TcaCardBody>
          </TcaCard>
        </div>

        {/* Conversation Detail */}
        <div className="lg:col-span-2">
          {detailLoading ? (
            <TcaCard>
              <TcaCardBody>
                <div className="flex h-96 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-primary)] border-t-transparent" />
                </div>
              </TcaCardBody>
            </TcaCard>
          ) : selectedConversation ? (
            <div className="space-y-4">
              {/* Lead Info Card */}
              {selectedConversation.lead && (
                <TcaCard>
                  <TcaCardBody>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                            {selectedConversation.lead.name || "Anonymous Lead"}
                          </h3>
                          <TcaBadge className={TEMP_COLORS[selectedConversation.lead.temperature] || ""}>
                            {selectedConversation.lead.temperature === "HOT" && <Flame className="mr-1 h-3 w-3" />}
                            {selectedConversation.lead.temperature}
                          </TcaBadge>
                          {selectedConversation.lead.score && (
                            <span className="text-sm text-[var(--color-text-secondary)]">
                              Score: {selectedConversation.lead.score}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--color-text-secondary)]">
                          {selectedConversation.lead.email && (
                            <a
                              href={`mailto:${selectedConversation.lead.email}`}
                              className="flex items-center gap-1 hover:text-[var(--color-brand-primary)]"
                            >
                              <Mail className="h-4 w-4" />
                              {selectedConversation.lead.email}
                            </a>
                          )}
                          {selectedConversation.lead.phone && (
                            <a
                              href={`tel:${selectedConversation.lead.phone}`}
                              className="flex items-center gap-1 hover:text-[var(--color-brand-primary)]"
                            >
                              <Phone className="h-4 w-4" />
                              {selectedConversation.lead.phone}
                            </a>
                          )}
                        </div>
                      </div>
                      <TcaButton
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open(`/app/leads?lead=${selectedConversation.lead?.publicId}`, "_blank")}
                      >
                        View Lead
                      </TcaButton>
                    </div>
                  </TcaCardBody>
                </TcaCard>
              )}

              {/* Bookings */}
              {selectedConversation.bookings.length > 0 && (
                <TcaCard>
                  <TcaCardHeader>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Bookings from this conversation
                    </div>
                  </TcaCardHeader>
                  <TcaCardBody>
                    <div className="space-y-2">
                      {selectedConversation.bookings.map((booking) => (
                        <div
                          key={booking.publicId}
                          className="flex items-center justify-between rounded-lg bg-[var(--color-surface-hover)] p-3"
                        >
                          <div>
                            <div className="font-medium text-[var(--color-text-primary)]">
                              {booking.serviceName || "Service"}
                            </div>
                            <div className="text-sm text-[var(--color-text-secondary)]">
                              {new Date(booking.scheduledAt).toLocaleString()}
                            </div>
                          </div>
                          <TcaBadge>{booking.status}</TcaBadge>
                        </div>
                      ))}
                    </div>
                  </TcaCardBody>
                </TcaCard>
              )}

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <TcaCard>
                  <TcaCardBody className="text-center">
                    <div className="text-2xl font-bold text-[var(--color-brand-primary)]">
                      {selectedConversation.stats.messageCount}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Messages</div>
                  </TcaCardBody>
                </TcaCard>
                <TcaCard>
                  <TcaCardBody className="text-center">
                    <div className="text-2xl font-bold text-[var(--color-brand-primary)]">
                      {selectedConversation.stats.userMessages}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">User</div>
                  </TcaCardBody>
                </TcaCard>
                <TcaCard>
                  <TcaCardBody className="text-center">
                    <div className="text-2xl font-bold text-[var(--color-brand-primary)]">
                      {selectedConversation.stats.assistantMessages}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Bot</div>
                  </TcaCardBody>
                </TcaCard>
                <TcaCard>
                  <TcaCardBody className="text-center">
                    <div className="text-2xl font-bold text-[var(--color-brand-primary)]">
                      {formatDuration(selectedConversation.stats.durationMs)}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Duration</div>
                  </TcaCardBody>
                </TcaCard>
              </div>

              {/* Transcript */}
              <TcaCard>
                <TcaCardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Transcript
                    </div>
                    <span className="text-sm text-[var(--color-text-muted)]">
                      {selectedConversation.bot.name}
                    </span>
                  </div>
                </TcaCardHeader>
                <TcaCardBody className="max-h-[500px] overflow-y-auto">
                  <div className="space-y-4">
                    {selectedConversation.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            msg.role === "user"
                              ? "bg-[var(--color-brand-primary)]"
                              : "bg-[var(--color-surface-elevated)]"
                          }`}
                        >
                          {msg.role === "user" ? (
                            <User className="h-4 w-4 text-white" />
                          ) : (
                            <Bot className="h-4 w-4 text-[var(--color-text-secondary)]" />
                          )}
                        </div>
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === "user"
                              ? "bg-[var(--color-brand-primary)] text-white"
                              : "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]"
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                          <div
                            className={`mt-1 text-xs ${
                              msg.role === "user" ? "text-white/70" : "text-[var(--color-text-muted)]"
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TcaCardBody>
              </TcaCard>
            </div>
          ) : (
            <TcaCard>
              <TcaCardBody>
                <div className="flex h-96 flex-col items-center justify-center text-center">
                  <MessageSquare className="h-12 w-12 text-[var(--color-text-muted)]" />
                  <h3 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                    Select a conversation
                  </h3>
                  <p className="mt-2 text-[var(--color-text-secondary)]">
                    Click on a conversation from the list to view the full transcript
                  </p>
                </div>
              </TcaCardBody>
            </TcaCard>
          )}
        </div>
      </div>
    </div>
  );
}

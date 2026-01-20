"use client";

import { useState, useCallback, useEffect } from "react";
import { TcaCard, TcaCardBody, TcaCardHeader } from "@/components/tca/TcaCard";
import { TcaButton } from "@/components/tca/TcaButton";
import { TcaBadge } from "@/components/tca/TcaBadge";
import { LeadDetailDrawer } from "./LeadDetailDrawer";
import { Download } from "lucide-react";

interface Lead {
  leadPublicId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: "NEW" | "CONTACTED" | "BOOKED" | "CLOSED";
  notes: string | null;
  score: number;
  temperature: "HOT" | "WARM" | "COLD";
  serviceName: string | null;
  serviceId: number | null;
  botName: string;
  botPublicKey: string;
  conversationPublicId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Summary {
  total: number;
  byStatus: {
    NEW: number;
    CONTACTED: number;
    BOOKED: number;
    CLOSED: number;
  };
  byTemperature: {
    HOT: number;
    WARM: number;
    COLD: number;
  };
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  NEW: "tca-status-new",
  CONTACTED: "tca-status-contacted",
  BOOKED: "tca-status-booked",
  CLOSED: "tca-status-closed",
};

const TEMPERATURE_BADGE_CLASSES: Record<string, string> = {
  HOT: "tca-status-booked",
  WARM: "tca-status-contacted",
  COLD: "tca-status-closed",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<string>("30");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [tempFilter, setTempFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (dateRange && dateRange !== "all") params.set("days", dateRange);
      if (statusFilter) params.set("status", statusFilter);
      if (tempFilter) params.set("temperature", tempFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/org/leads?${params.toString()}`);
      const data = await res.json();

      if (!data.ok) {
        setError(data.message || data.error || "Failed to fetch leads");
        setLeads([]);
      } else {
        setLeads(data.leads || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      setError("Network error");
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, statusFilter, tempFilter, debouncedSearch]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getContactInfo = (lead: Lead) => {
    if (lead.name) return lead.name;
    if (lead.email) return lead.email;
    if (lead.phone) return lead.phone;
    return "No contact info";
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
  };

  const handleLeadUpdate = (updatedLead: Partial<Lead>) => {
    if (selectedLead) {
      const updated = { ...selectedLead, ...updatedLead };
      setSelectedLead(updated);
      setLeads((prev) =>
        prev.map((l) => (l.leadPublicId === updated.leadPublicId ? updated : l))
      );
    }
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (dateRange && dateRange !== "all") params.set("days", dateRange);
    if (statusFilter) params.set("status", statusFilter);
    if (tempFilter) params.set("temperature", tempFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    window.open(`/api/org/leads/export?${params.toString()}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="tca-gradient-text text-3xl font-extrabold tracking-tight">
            Leads Inbox
          </h2>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            View and manage leads captured by your chatbots.
          </p>
        </div>
        <TcaButton
          variant="secondary"
          onClick={handleExportCsv}
          data-testid="button-export-leads"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </TcaButton>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TcaCard>
            <TcaCardBody className="py-4">
              <div className="text-sm text-[var(--color-text-muted)]">Total Leads</div>
              <div className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]" data-testid="stat-total">
                {summary.total}
              </div>
            </TcaCardBody>
          </TcaCard>
          <TcaCard>
            <TcaCardBody className="py-4">
              <div className="text-sm text-[var(--color-text-muted)]">Hot Leads</div>
              <div className="mt-1 text-2xl font-bold text-green-400" data-testid="stat-hot">
                {summary.byTemperature.HOT}
              </div>
            </TcaCardBody>
          </TcaCard>
          <TcaCard>
            <TcaCardBody className="py-4">
              <div className="text-sm text-[var(--color-text-muted)]">New</div>
              <div className="mt-1 text-2xl font-bold text-blue-400" data-testid="stat-new">
                {summary.byStatus.NEW}
              </div>
            </TcaCardBody>
          </TcaCard>
          <TcaCard>
            <TcaCardBody className="py-4">
              <div className="text-sm text-[var(--color-text-muted)]">Booked</div>
              <div className="mt-1 text-2xl font-bold text-green-400" data-testid="stat-booked">
                {summary.byStatus.BOOKED}
              </div>
            </TcaCardBody>
          </TcaCard>
        </div>
      )}

      <TcaCard>
        <TcaCardHeader>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters</h3>
        </TcaCardHeader>
        <TcaCardBody>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="tca-input w-full"
                data-testid="select-date-range"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="tca-input w-full"
                data-testid="select-status"
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="BOOKED">Booked</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                Temperature
              </label>
              <select
                value={tempFilter}
                onChange={(e) => setTempFilter(e.target.value)}
                className="tca-input w-full"
                data-testid="select-temperature"
              >
                <option value="">All Temperatures</option>
                <option value="HOT">Hot</option>
                <option value="WARM">Warm</option>
                <option value="COLD">Cold</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, email, or phone..."
                className="tca-input w-full"
                data-testid="input-search"
              />
            </div>
          </div>
        </TcaCardBody>
      </TcaCard>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400" data-testid="error-message">{error}</p>
        </div>
      )}

      {isLoading ? (
        <TcaCard>
          <TcaCardBody>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 w-24 animate-pulse rounded bg-[var(--color-surface-hover)]" />
                  <div className="h-4 w-40 animate-pulse rounded bg-[var(--color-surface-hover)]" />
                  <div className="h-4 w-20 animate-pulse rounded bg-[var(--color-surface-hover)]" />
                  <div className="h-4 w-16 animate-pulse rounded bg-[var(--color-surface-hover)]" />
                </div>
              ))}
            </div>
          </TcaCardBody>
        </TcaCard>
      ) : leads.length === 0 ? (
        <TcaCard>
          <TcaCardBody>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-hover)]">
                <svg className="h-8 w-8 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]" data-testid="empty-state">
                No Leads Found
              </h3>
              <p className="mt-2 max-w-sm text-sm text-[var(--color-text-secondary)]">
                {searchQuery || statusFilter || tempFilter
                  ? "Try adjusting your filters to see more leads."
                  : "Leads will appear here when visitors submit their contact information through your chatbot."}
              </p>
            </div>
          </TcaCardBody>
        </TcaCard>
      ) : (
        <TcaCard>
          <TcaCardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="tca-table" data-testid="leads-table">
                <thead>
                  <tr>
                    <th>Created</th>
                    <th>Contact</th>
                    <th>Service</th>
                    <th>Temperature</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.leadPublicId}
                      onClick={() => handleLeadClick(lead)}
                      className="cursor-pointer"
                      data-testid={`lead-row-${lead.leadPublicId}`}
                    >
                      <td className="whitespace-nowrap text-[var(--color-text-secondary)]">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td>
                        <div className="max-w-xs truncate font-medium text-[var(--color-text-primary)]">
                          {getContactInfo(lead)}
                        </div>
                        {lead.email && lead.name && (
                          <div className="mt-0.5 max-w-xs truncate text-xs text-[var(--color-text-muted)]">
                            {lead.email}
                          </div>
                        )}
                      </td>
                      <td className="text-[var(--color-text-secondary)]">
                        {lead.serviceName || "-"}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TEMPERATURE_BADGE_CLASSES[lead.temperature] || ""}`}
                            data-testid={`temp-${lead.leadPublicId}`}
                          >
                            {lead.temperature}
                          </span>
                          <span className="text-sm text-[var(--color-text-muted)]">
                            {lead.score}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_CLASSES[lead.status] || ""}`}
                          data-testid={`status-${lead.leadPublicId}`}
                        >
                          {lead.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TcaCardBody>
        </TcaCard>
      )}

      <LeadDetailDrawer
        lead={selectedLead}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onLeadUpdate={handleLeadUpdate}
      />
    </div>
  );
}

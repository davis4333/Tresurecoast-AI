"use client";

import { useState, useEffect } from "react";
import { TcaBadge } from "@/components/tca/TcaBadge";
import { cx } from "@/components/tca/tca";

interface ClientData {
  id: number;
  publicId: string;
  name: string;
  createdAt: string;
  botCount: number;
  businessName: string | null;
  category: string | null;
}

interface CreateClientResult {
  ok: true;
  orgId: number;
  orgPublicId: string;
  botPublicKey: string;
  embedSnippet: string;
  iframeSnippet: string;
  nextSteps: string;
}

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "luxury", label: "Luxury" },
  { value: "bold", label: "Bold" },
  { value: "chill", label: "Chill" },
];

const GOAL_OPTIONS = [
  { value: "bookings", label: "Bookings" },
  { value: "leads", label: "Lead Capture" },
  { value: "faqs", label: "FAQ Support" },
  { value: "support", label: "Customer Support" },
];

const TEMPLATE_OPTIONS = [
  { value: "universal_blank", label: "Universal (Blank)" },
  { value: "barber_shop", label: "Barber Shop" },
  { value: "nail_salon", label: "Nail Salon" },
  { value: "fitness_gym", label: "Fitness / Gym" },
  { value: "dentist", label: "Dental Practice" },
  { value: "sober_living", label: "Sober Living" },
  { value: "epoxy_flooring", label: "Epoxy Flooring" },
];

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<CreateClientResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    orgName: "",
    ownerClerkUserId: "",
    businessName: "",
    category: "",
    phone: "",
    address: "",
    hours: "",
    websiteUrl: "",
    bookingUrl: "",
    tone: "friendly",
    primaryGoal: "leads",
    templateKey: "universal_blank",
  });

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      const res = await fetch("/api/admin/clients");
      const data = await res.json();
      if (data.ok) {
        setClients(data.clients);
      }
    } catch {
      console.error("Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Failed to create client");
        return;
      }

      setResult(data);
      setFormData({
        orgName: "",
        ownerClerkUserId: "",
        businessName: "",
        category: "",
        phone: "",
        address: "",
        hours: "",
        websiteUrl: "",
        bookingUrl: "",
        tone: "friendly",
        primaryGoal: "leads",
        templateKey: "universal_blank",
      });
      fetchClients();
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]" data-testid="admin-clients-title">
          Client Management
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Create and manage client organizations with their bots
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Create New Client
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  name="orgName"
                  value={formData.orgName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                  data-testid="input-org-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Owner User ID *
                </label>
                <input
                  type="text"
                  name="ownerClerkUserId"
                  value={formData.ownerClerkUserId}
                  onChange={handleChange}
                  required
                  placeholder="user_xxxxx or dev-user-id"
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                  data-testid="input-owner-user-id"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                  data-testid="input-business-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Dental Practice, Salon, Law Firm"
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                  data-testid="input-category"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Industry Template
              </label>
              <select
                name="templateKey"
                value={formData.templateKey}
                onChange={handleChange}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                data-testid="select-template"
              >
                {TEMPLATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                Templates pre-fill the bot with industry-specific content
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Tone *
                </label>
                <select
                  name="tone"
                  value={formData.tone}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                  data-testid="select-tone"
                >
                  {TONE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Primary Goal *
                </label>
                <select
                  name="primaryGoal"
                  value={formData.primaryGoal}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                  data-testid="select-primary-goal"
                >
                  {GOAL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                  data-testid="input-phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                  data-testid="input-address"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Business Hours
              </label>
              <input
                type="text"
                name="hours"
                value={formData.hours}
                onChange={handleChange}
                placeholder="e.g., Mon-Fri 9am-5pm, Sat 10am-2pm"
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                data-testid="input-hours"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                  data-testid="input-website-url"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Booking URL
                </label>
                <input
                  type="url"
                  name="bookingUrl"
                  value={formData.bookingUrl}
                  onChange={handleChange}
                  placeholder="https://calendly.com/..."
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
                  data-testid="input-booking-url"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400" data-testid="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className={cx(
                "w-full rounded-md px-4 py-2.5 font-medium text-white transition-colors",
                creating
                  ? "cursor-not-allowed bg-[var(--color-brand-primary)]/50"
                  : "bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/80"
              )}
              data-testid="button-create-client"
            >
              {creating ? "Creating..." : "Create Client + Bot"}
            </button>
          </form>
        </div>

        {result && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-6" data-testid="create-result">
            <h2 className="text-lg font-semibold text-green-400 mb-4">
              Client Created Successfully
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Bot Public Key
                </label>
                <code className="block rounded bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] font-mono" data-testid="text-bot-public-key">
                  {result.botPublicKey}
                </code>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Script Embed
                </label>
                <code className="block rounded bg-[var(--color-background)] px-3 py-2 text-xs text-[var(--color-text-primary)] font-mono break-all" data-testid="text-embed-snippet">
                  {result.embedSnippet}
                </code>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Iframe Embed
                </label>
                <code className="block rounded bg-[var(--color-background)] px-3 py-2 text-xs text-[var(--color-text-primary)] font-mono break-all">
                  {result.iframeSnippet}
                </code>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Next Steps
                </label>
                <pre className="rounded bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
                  {result.nextSteps}
                </pre>
              </div>

              <div className="flex gap-3 pt-2">
                <a
                  href={`/app/bots/${result.botPublicKey}`}
                  className="rounded-md bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-primary)]/80 transition-colors"
                  data-testid="link-open-bot"
                >
                  Open Bot
                </a>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(result.embedSnippet)}
                  className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                  data-testid="button-copy-embed"
                >
                  Copy Embed
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Existing Clients
        </h2>

        {loading ? (
          <div className="text-[var(--color-text-secondary)]">Loading...</div>
        ) : clients.length === 0 ? (
          <div className="text-[var(--color-text-secondary)]">No clients yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="clients-table">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Organization
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Business
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Bots
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-[var(--color-border)] last:border-b-0" data-testid={`client-row-${client.id}`}>
                    <td className="px-4 py-3 text-[var(--color-text-primary)]">
                      {client.name}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-primary)]">
                      {client.businessName || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {client.category ? (
                        <TcaBadge>{client.category}</TcaBadge>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-primary)]">
                      {client.botCount}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/app/bots`}
                        className="text-[var(--color-brand-primary)] hover:underline"
                      >
                        View Bots
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

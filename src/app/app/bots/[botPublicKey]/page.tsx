"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TcaCard, TcaCardBody, TcaCardHeader } from "@/components/tca/TcaCard";
import { TcaButton } from "@/components/tca/TcaButton";
import { getScriptEmbedSnippet, getIframeEmbedSnippet } from "@/lib/widget/embedSnippet";

interface BotLink {
  id?: number;
  type: "BOOKING" | "PAYMENT" | "CONTACT" | "OTHER";
  label: string;
  url: string;
}

interface BotService {
  name: string;
  description?: string;
  priceRange?: string;
  durationMinutes?: number;
  active: boolean;
}

interface BotHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

interface Bot {
  publicKey: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  greeting: string | null;
  fallbackText: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
  hours: BotHours | null;
  services: BotService[] | null;
  links: BotLink[];
  organizationName: string;
  workspaceName: string;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export default function BotDetailPage() {
  const params = useParams<{ botPublicKey: string }>();
  const botPublicKey = params.botPublicKey;

  const [bot, setBot] = useState<Bot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    greeting: "",
    fallbackText: "",
    businessPhone: "",
    businessEmail: "",
    businessAddress: "",
    hours: {} as BotHours,
    services: [] as BotService[],
    links: [] as BotLink[],
  });

  const fetchBot = useCallback(async () => {
    if (!botPublicKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/bots/${botPublicKey}`);
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Failed to fetch bot");
        setBot(null);
      } else {
        setBot(data.bot);
        setFormData({
          name: data.bot.name || "",
          greeting: data.bot.greeting || "",
          fallbackText: data.bot.fallbackText || "",
          businessPhone: data.bot.businessPhone || "",
          businessEmail: data.bot.businessEmail || "",
          businessAddress: data.bot.businessAddress || "",
          hours: data.bot.hours || {},
          services: data.bot.services || [],
          links: data.bot.links || [],
        });
      }
    } catch {
      setError("Network error");
      setBot(null);
    } finally {
      setIsLoading(false);
    }
  }, [botPublicKey]);

  useEffect(() => {
    fetchBot();
  }, [fetchBot]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);

    const cleanedHours: BotHours = {};
    for (const [day, value] of Object.entries(formData.hours)) {
      if (value && value.trim()) {
        cleanedHours[day as keyof BotHours] = value.trim();
      }
    }

    const cleanedServices = formData.services
      .filter((s) => s.name && s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        description: s.description?.trim() || null,
        priceRange: s.priceRange?.trim() || null,
        durationMinutes: s.durationMinutes && s.durationMinutes > 0 ? s.durationMinutes : null,
        active: s.active,
      }));

    const cleanedLinks = formData.links
      .filter((l) => l.url && l.url.trim() && l.label && l.label.trim())
      .map((l) => ({
        type: l.type,
        label: l.label.trim(),
        url: l.url.trim(),
      }));

    try {
      const res = await fetch(`/api/admin/bots/${botPublicKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          greeting: formData.greeting.trim() || null,
          fallbackText: formData.fallbackText.trim() || null,
          businessPhone: formData.businessPhone.trim() || null,
          businessEmail: formData.businessEmail.trim() || null,
          businessAddress: formData.businessAddress.trim() || null,
          hours: Object.keys(cleanedHours).length > 0 ? cleanedHours : null,
          services: cleanedServices.length > 0 ? cleanedServices : null,
          links: cleanedLinks,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        showToast(data.error || "Failed to save", "error");
      } else {
        showToast("Changes saved successfully", "success");
        fetchBot();
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateHours = (day: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      hours: { ...prev.hours, [day]: value },
    }));
  };

  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, { name: "", description: "", priceRange: "", active: true }],
    }));
  };

  const updateService = (index: number, field: keyof BotService, value: string | boolean | number) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  const removeService = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const addLink = () => {
    setFormData((prev) => ({
      ...prev,
      links: [...prev.links, { type: "OTHER", label: "", url: "" }],
    }));
  };

  const updateLink = (index: number, field: keyof BotLink, value: string) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    }));
  };

  const removeLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-[var(--color-text-secondary)]">Loading bot...</div>
      </div>
    );
  }

  if (error || !bot) {
    return (
      <div className="space-y-6">
        <Link href="/app/bots" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Bots
        </Link>
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">{error || "Bot not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed right-6 top-20 z-50 rounded-lg border px-4 py-3 shadow-lg ${
          toast.type === "success" 
            ? "border-green-500/20 bg-green-500/10 text-green-400" 
            : "border-red-500/20 bg-red-500/10 text-red-400"
        }`}>
          <p className="text-sm">{toast.message}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link href="/app/bots" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Bots
        </Link>
        <div className="flex gap-3">
          <a
            href={`/widget/${botPublicKey}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="preview-widget"
          >
            <TcaButton variant="outline">Preview Widget</TcaButton>
          </a>
          <TcaButton onClick={handleSave} disabled={isSaving} data-testid="save-changes">
            {isSaving ? "Saving..." : "Save Changes"}
          </TcaButton>
        </div>
      </div>

      <div className="tca-page-header">
        <h2 className="tca-page-title">{bot.name}</h2>
        <p className="tca-page-subtitle">
          {bot.workspaceName} &bull; {bot.organizationName}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TcaCard>
          <TcaCardHeader>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Identity</h3>
          </TcaCardHeader>
          <TcaCardBody className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Bot Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="tca-input"
                data-testid="input-name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Greeting Message</label>
              <textarea
                value={formData.greeting}
                onChange={(e) => updateField("greeting", e.target.value)}
                rows={3}
                className="tca-input resize-none"
                placeholder="How can I help you today?"
                data-testid="input-greeting"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Fallback Message</label>
              <textarea
                value={formData.fallbackText}
                onChange={(e) => updateField("fallbackText", e.target.value)}
                rows={3}
                className="tca-input resize-none"
                placeholder="Message shown when AI doesn't know the answer..."
                data-testid="input-fallback"
              />
            </div>
          </TcaCardBody>
        </TcaCard>

        <TcaCard>
          <TcaCardHeader>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Contact Info</h3>
          </TcaCardHeader>
          <TcaCardBody className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Business Phone</label>
              <input
                type="tel"
                value={formData.businessPhone}
                onChange={(e) => updateField("businessPhone", e.target.value)}
                className="tca-input"
                placeholder="+1 (555) 123-4567"
                data-testid="input-phone"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Business Email</label>
              <input
                type="email"
                value={formData.businessEmail}
                onChange={(e) => updateField("businessEmail", e.target.value)}
                className="tca-input"
                placeholder="contact@business.com"
                data-testid="input-email"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">Address</label>
              <textarea
                value={formData.businessAddress}
                onChange={(e) => updateField("businessAddress", e.target.value)}
                rows={2}
                className="tca-input resize-none"
                placeholder="123 Main St, City, State 12345"
                data-testid="input-address"
              />
            </div>
          </TcaCardBody>
        </TcaCard>

        <TcaCard>
          <TcaCardHeader>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Business Hours</h3>
          </TcaCardHeader>
          <TcaCardBody>
            <div className="grid gap-3">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-24 text-sm capitalize text-[var(--color-text-secondary)]">{day}</span>
                  <input
                    type="text"
                    value={formData.hours[day] || ""}
                    onChange={(e) => updateHours(day, e.target.value)}
                    className="tca-input flex-1"
                    placeholder="9:00 AM - 5:00 PM"
                    data-testid={`input-hours-${day}`}
                  />
                </div>
              ))}
            </div>
          </TcaCardBody>
        </TcaCard>

        <TcaCard>
          <TcaCardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Links</h3>
              <TcaButton variant="ghost" size="sm" onClick={addLink} data-testid="add-link">
                + Add Link
              </TcaButton>
            </div>
          </TcaCardHeader>
          <TcaCardBody>
            {formData.links.length === 0 ? (
              <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">No links added yet</p>
            ) : (
              <div className="space-y-4">
                {formData.links.map((link, index) => (
                  <div key={index} className="rounded-lg border border-[var(--color-border-subtle)] p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <select
                        value={link.type}
                        onChange={(e) => updateLink(index, "type", e.target.value)}
                        className="tca-input w-auto"
                        data-testid={`link-type-${index}`}
                      >
                        <option value="BOOKING">Booking</option>
                        <option value="PAYMENT">Payment</option>
                        <option value="CONTACT">Contact</option>
                        <option value="OTHER">Other</option>
                      </select>
                      <TcaButton variant="ghost" size="sm" onClick={() => removeLink(index)} data-testid={`remove-link-${index}`}>
                        Remove
                      </TcaButton>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateLink(index, "label", e.target.value)}
                        className="tca-input"
                        placeholder="Label"
                        data-testid={`link-label-${index}`}
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateLink(index, "url", e.target.value)}
                        className="tca-input"
                        placeholder="https://..."
                        data-testid={`link-url-${index}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TcaCardBody>
        </TcaCard>
      </div>

      <TcaCard>
        <TcaCardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Services</h3>
            <TcaButton variant="ghost" size="sm" onClick={addService} data-testid="add-service">
              + Add Service
            </TcaButton>
          </div>
        </TcaCardHeader>
        <TcaCardBody>
          {formData.services.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">No services added yet</p>
          ) : (
            <div className="space-y-4">
              {formData.services.map((service, index) => (
                <div key={index} className="rounded-lg border border-[var(--color-border-subtle)] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={service.active}
                        onChange={(e) => updateService(index, "active", e.target.checked)}
                        className="h-4 w-4 rounded border-[var(--color-border)]"
                        data-testid={`service-active-${index}`}
                      />
                      <span className="text-sm text-[var(--color-text-secondary)]">Active</span>
                    </label>
                    <TcaButton variant="ghost" size="sm" onClick={() => removeService(index)} data-testid={`remove-service-${index}`}>
                      Remove
                    </TcaButton>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <input
                      type="text"
                      value={service.name}
                      onChange={(e) => updateService(index, "name", e.target.value)}
                      className="tca-input"
                      placeholder="Service name"
                      data-testid={`service-name-${index}`}
                    />
                    <input
                      type="text"
                      value={service.description || ""}
                      onChange={(e) => updateService(index, "description", e.target.value)}
                      className="tca-input"
                      placeholder="Description"
                      data-testid={`service-desc-${index}`}
                    />
                    <input
                      type="text"
                      value={service.priceRange || ""}
                      onChange={(e) => updateService(index, "priceRange", e.target.value)}
                      className="tca-input"
                      placeholder="$50-$100"
                      data-testid={`service-price-${index}`}
                    />
                    <input
                      type="number"
                      value={service.durationMinutes || ""}
                      onChange={(e) => updateService(index, "durationMinutes", parseInt(e.target.value) || 0)}
                      className="tca-input"
                      placeholder="Duration (min)"
                      data-testid={`service-duration-${index}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TcaCardBody>
      </TcaCard>

      <TcaCard data-testid="install-section">
        <TcaCardHeader>
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Install Widget</h3>
        </TcaCardHeader>
        <TcaCardBody className="space-y-6">
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <p className="text-sm text-green-400">
              Copy one of the snippets below and paste it into your website. Works with WordPress, Wix, Squarespace, and any HTML site.
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                Script Embed (Recommended)
              </label>
              <TcaButton
                variant="ghost"
                size="sm"
                data-testid="copy-script-embed"
                onClick={() => {
                  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
                  const snippet = getScriptEmbedSnippet(baseUrl, botPublicKey);
                  navigator.clipboard.writeText(snippet);
                  showToast("Script snippet copied!", "success");
                }}
              >
                Copy
              </TcaButton>
            </div>
            <textarea
              readOnly
              value={typeof window !== "undefined" ? getScriptEmbedSnippet(window.location.origin, botPublicKey) : ""}
              className="tca-input h-20 resize-none font-mono text-xs"
              data-testid="script-embed-snippet"
            />
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Paste in {"<head>"} or before {"</body>"}. Creates a floating chat button.
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                Iframe Embed (Fallback)
              </label>
              <TcaButton
                variant="ghost"
                size="sm"
                data-testid="copy-iframe-embed"
                onClick={() => {
                  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
                  const snippet = getIframeEmbedSnippet(baseUrl, botPublicKey);
                  navigator.clipboard.writeText(snippet);
                  showToast("Iframe snippet copied!", "success");
                }}
              >
                Copy
              </TcaButton>
            </div>
            <textarea
              readOnly
              value={typeof window !== "undefined" ? getIframeEmbedSnippet(window.location.origin, botPublicKey) : ""}
              className="tca-input h-20 resize-none font-mono text-xs"
              data-testid="iframe-embed-snippet"
            />
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Use if the script embed doesn&apos;t work on your platform.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`/widget/${botPublicKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--color-brand-primary)] hover:underline"
              data-testid="link-preview-widget"
            >
              Open widget preview in new tab
            </a>
          </div>
        </TcaCardBody>
      </TcaCard>
    </div>
  );
}

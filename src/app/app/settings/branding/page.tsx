"use client";

import { useState, useEffect } from "react";
import { CustomDomainSection } from "./CustomDomainSection";

type BrandingData = {
  whiteLabelEnabled: boolean;
  brandCompanyName: string | null;
  brandLogoUrl: string | null;
  brandPrimaryColor: string;
  showPoweredBy: boolean;
  customDomain: string | null;
  widgetPosition: "bottom-right" | "bottom-left";
};

export default function BrandingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(false);
  const [brandCompanyName, setBrandCompanyName] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [brandPrimaryColor, setBrandPrimaryColor] = useState("#6366f1");
  const [showPoweredBy, setShowPoweredBy] = useState(true);
  const [widgetPosition, setWidgetPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");

  useEffect(() => {
    async function fetchBranding() {
      try {
        const res = await fetch("/api/org/branding");
        const data = await res.json();
        if (data.ok && data.branding) {
          const b: BrandingData = data.branding;
          setWhiteLabelEnabled(b.whiteLabelEnabled);
          setBrandCompanyName(b.brandCompanyName || "");
          setBrandLogoUrl(b.brandLogoUrl || "");
          setBrandPrimaryColor(b.brandPrimaryColor || "#6366f1");
          setShowPoweredBy(b.showPoweredBy);
          setWidgetPosition(b.widgetPosition || "bottom-right");
        }
      } catch {
        setError("Failed to load branding settings");
      } finally {
        setLoading(false);
      }
    }
    fetchBranding();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/org/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whiteLabelEnabled,
          brandCompanyName: brandCompanyName || null,
          brandLogoUrl: brandLogoUrl || null,
          brandPrimaryColor,
          showPoweredBy,
          widgetPosition,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        setSuccess(true);
        document.documentElement.style.setProperty(
          "--tca-brand-primary",
          whiteLabelEnabled ? brandPrimaryColor : "#6366f1"
        );
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.message || "Failed to save branding settings");
      }
    } catch {
      setError("Failed to save branding settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="tca-page-header">
          <h1 className="tca-page-title">White-Label Branding</h1>
          <p className="tca-page-subtitle">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="tca-page-header">
        <h1 className="tca-page-title">White-Label Branding</h1>
        <p className="tca-page-subtitle">
          Customize your organization&apos;s branding across the dashboard and chat widget
        </p>
      </div>

      <div className="tca-card p-6 max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <p className="text-sm text-green-400">Branding settings saved successfully!</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-[var(--color-text-primary)]">
              Enable White-Label
            </label>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Turn on to customize branding across your organization
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={whiteLabelEnabled}
            data-testid="toggle-whitelabel"
            onClick={() => setWhiteLabelEnabled(!whiteLabelEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              whiteLabelEnabled ? "bg-[var(--color-brand-primary)]" : "bg-[var(--color-surface-hover)]"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                whiteLabelEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="tca-divider" />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={brandCompanyName}
              onChange={(e) => setBrandCompanyName(e.target.value)}
              disabled={!whiteLabelEnabled}
              placeholder="Your Company Name"
              data-testid="input-company-name"
              className="tca-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Logo URL
            </label>
            <input
              type="url"
              value={brandLogoUrl}
              onChange={(e) => setBrandLogoUrl(e.target.value)}
              disabled={!whiteLabelEnabled}
              placeholder="https://example.com/logo.png"
              data-testid="input-logo-url"
              className="tca-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Primary Color
            </label>
            <div className="flex gap-3">
              <input
                type="color"
                value={brandPrimaryColor}
                onChange={(e) => setBrandPrimaryColor(e.target.value)}
                disabled={!whiteLabelEnabled}
                data-testid="branding-color-input"
                className="h-10 w-14 cursor-pointer rounded-md border border-[var(--color-border)] bg-transparent p-1 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <input
                type="text"
                value={brandPrimaryColor}
                onChange={(e) => setBrandPrimaryColor(e.target.value)}
                disabled={!whiteLabelEnabled}
                placeholder="#6366f1"
                data-testid="input-primary-color-text"
                className="tca-input flex-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)]">
                Show &quot;Powered by&quot;
              </label>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Display attribution in the chat widget footer
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showPoweredBy}
              data-testid="branding-powered-toggle"
              onClick={() => setShowPoweredBy(!showPoweredBy)}
              disabled={!whiteLabelEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                showPoweredBy ? "bg-[var(--color-brand-primary)]" : "bg-[var(--color-surface-hover)]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showPoweredBy ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Widget Position
            </label>
            <p className="text-xs text-[var(--color-text-muted)] mb-3">
              Choose where the chat widget appears on your website
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setWidgetPosition("bottom-right")}
                className={`flex-1 rounded-lg border p-4 text-center transition-colors ${
                  widgetPosition === "bottom-right"
                    ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10"
                    : "border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
                }`}
              >
                <div className="relative h-16 w-full rounded bg-[var(--color-surface-hover)] mb-2">
                  <div
                    className="absolute bottom-1 right-1 h-4 w-4 rounded"
                    style={{ backgroundColor: brandPrimaryColor }}
                  />
                </div>
                <span className="text-sm text-[var(--color-text-primary)]">Bottom Right</span>
              </button>
              <button
                type="button"
                onClick={() => setWidgetPosition("bottom-left")}
                className={`flex-1 rounded-lg border p-4 text-center transition-colors ${
                  widgetPosition === "bottom-left"
                    ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10"
                    : "border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
                }`}
              >
                <div className="relative h-16 w-full rounded bg-[var(--color-surface-hover)] mb-2">
                  <div
                    className="absolute bottom-1 left-1 h-4 w-4 rounded"
                    style={{ backgroundColor: brandPrimaryColor }}
                  />
                </div>
                <span className="text-sm text-[var(--color-text-primary)]">Bottom Left</span>
              </button>
            </div>
          </div>

        </div>

        <div className="tca-divider" />

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            data-testid="branding-save-button"
            className="tca-btn-primary"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="mt-6 max-w-2xl">
        <CustomDomainSection />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { TcaCard, TcaCardBody, TcaCardHeader } from "@/components/tca/TcaCard";
import { TcaButton } from "@/components/tca/TcaButton";

const TEMPLATE_OPTIONS = [
  { value: "universal_blank", label: "Universal (Blank)", description: "Start fresh with no preset content" },
  { value: "barber_shop", label: "Barber Shop", description: "Pre-filled for barbering services" },
  { value: "nail_salon", label: "Nail Salon", description: "Pre-filled for nail services" },
  { value: "fitness_gym", label: "Fitness / Gym", description: "Pre-filled for fitness businesses" },
  { value: "dentist", label: "Dental Practice", description: "Pre-filled for dental offices" },
  { value: "sober_living", label: "Sober Living", description: "Pre-filled for recovery facilities" },
  { value: "epoxy_flooring", label: "Epoxy Flooring", description: "Pre-filled for flooring services" },
];

const BRAND_VOICE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "luxury", label: "Luxury" },
  { value: "bold", label: "Bold" },
  { value: "chill", label: "Chill" },
];

const PRIMARY_GOAL_OPTIONS = [
  { value: "bookings", label: "Bookings" },
  { value: "leads", label: "Lead Capture" },
  { value: "faqs", label: "FAQs" },
  { value: "support", label: "Support" },
];

export default function OnboardingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [formData, setFormData] = useState({
    templateKey: "universal_blank",
    businessName: "",
    category: "",
    websiteUrl: "",
    bookingUrl: "",
    phone: "",
    address: "",
    hours: "",
    brandVoice: "friendly",
    primaryGoal: "leads",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName.trim()) {
      setError("Business name is required");
      return;
    }
    if (!formData.category.trim()) {
      setError("Category is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/org/onboarding/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: formData.templateKey,
          businessName: formData.businessName.trim(),
          category: formData.category.trim(),
          websiteUrl: formData.websiteUrl.trim() || undefined,
          bookingUrl: formData.bookingUrl.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          address: formData.address.trim() || undefined,
          hours: formData.hours.trim() || undefined,
          brandVoice: formData.brandVoice,
          primaryGoal: formData.primaryGoal,
        }),
      });

      const data = await res.json();

      if (data.ok && data.botPublicKey) {
        showToast("Bot created successfully!", "success");
        window.location.href = `/app/bots/${data.botPublicKey}`;
      } else {
        setError(data.message || "Failed to generate bot");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {toast && (
        <div
          className={`fixed right-6 top-20 z-50 rounded-lg border px-4 py-3 shadow-lg ${
            toast.type === "success"
              ? "border-green-500/20 bg-green-500/10 text-green-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}
        >
          <p className="text-sm">{toast.message}</p>
        </div>
      )}

      <div className="tca-page-header">
        <h2 className="tca-page-title">Create Your AI Bot</h2>
        <p className="tca-page-subtitle">
          Tell us about your business and we&apos;ll generate a custom AI assistant
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <TcaCard>
          <TcaCardHeader>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              Industry Template
            </h3>
          </TcaCardHeader>
          <TcaCardBody>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                Choose a Template
              </label>
              <select
                value={formData.templateKey}
                onChange={(e) => updateField("templateKey", e.target.value)}
                className="tca-input"
                data-testid="select-template"
              >
                {TEMPLATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                Templates pre-fill your bot with industry-specific greetings and knowledge base content
              </p>
            </div>
          </TcaCardBody>
        </TcaCard>

        <TcaCard className="mt-6">
          <TcaCardHeader>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              Business Information
            </h3>
          </TcaCardHeader>
          <TcaCardBody className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                Business Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => updateField("businessName", e.target.value)}
                className="tca-input"
                placeholder="Acme Consulting"
                data-testid="input-business-name"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                Category / Niche <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => updateField("category", e.target.value)}
                className="tca-input"
                placeholder="Dental Practice, Law Firm, Spa, etc."
                data-testid="input-category"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => updateField("websiteUrl", e.target.value)}
                  className="tca-input"
                  placeholder="https://example.com"
                  data-testid="input-website"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Booking URL
                </label>
                <input
                  type="url"
                  value={formData.bookingUrl}
                  onChange={(e) => updateField("bookingUrl", e.target.value)}
                  className="tca-input"
                  placeholder="https://calendly.com/..."
                  data-testid="input-booking"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="tca-input"
                  placeholder="+1 (555) 123-4567"
                  data-testid="input-phone"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Hours
                </label>
                <input
                  type="text"
                  value={formData.hours}
                  onChange={(e) => updateField("hours", e.target.value)}
                  className="tca-input"
                  placeholder="Mon-Fri 9am-5pm"
                  data-testid="input-hours"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                className="tca-input resize-none"
                rows={2}
                placeholder="123 Main St, City, State 12345"
                data-testid="input-address"
              />
            </div>
          </TcaCardBody>
        </TcaCard>

        <TcaCard className="mt-6">
          <TcaCardHeader>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              Bot Personality
            </h3>
          </TcaCardHeader>
          <TcaCardBody className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                Brand Voice
              </label>
              <select
                value={formData.brandVoice}
                onChange={(e) => updateField("brandVoice", e.target.value)}
                className="tca-input"
                data-testid="select-brand-voice"
              >
                {BRAND_VOICE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
                Primary Goal
              </label>
              <select
                value={formData.primaryGoal}
                onChange={(e) => updateField("primaryGoal", e.target.value)}
                className="tca-input"
                data-testid="select-primary-goal"
              >
                {PRIMARY_GOAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </TcaCardBody>
        </TcaCard>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-400" data-testid="error-message">
              {error}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <TcaButton
            type="submit"
            disabled={isSubmitting}
            data-testid="button-generate-bot"
          >
            {isSubmitting ? "Generating..." : "Generate Bot"}
          </TcaButton>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Lock, Building2, Phone, Mail, MapPin, FileText, Save, AlertCircle } from "lucide-react";
import { TcaPageShell } from "@/components/tca/TcaPageShell";
import { TcaCard, TcaCardHeader, TcaCardBody } from "@/components/tca/TcaCard";
import { TcaButton } from "@/components/tca/TcaButton";

type BusinessProfile = {
  id: number;
  businessName: string;
  category: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  serviceArea: string | null;
  websiteUrl: string | null;
  bookingUrl: string | null;
  tone: string;
  primaryGoal: string;
  cancellationPolicy: string | null;
  depositPolicy: string | null;
  refundPolicy: string | null;
  createdAt: string;
  updatedAt: string;
};

type Permissions = {
  canEdit: boolean;
  allowClientEdits: boolean;
  role: string;
};

type FormData = {
  businessName: string;
  category: string;
  phone: string;
  email: string;
  address: string;
  serviceArea: string;
  websiteUrl: string;
  bookingUrl: string;
  tone: string;
  primaryGoal: string;
  cancellationPolicy: string;
  depositPolicy: string;
  refundPolicy: string;
};

const emptyForm: FormData = {
  businessName: "",
  category: "",
  phone: "",
  email: "",
  address: "",
  serviceArea: "",
  websiteUrl: "",
  bookingUrl: "",
  tone: "professional",
  primaryGoal: "leads",
  cancellationPolicy: "",
  depositPolicy: "",
  refundPolicy: "",
};

const toneOptions = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "luxury", label: "Luxury" },
  { value: "bold", label: "Bold" },
  { value: "chill", label: "Chill" },
];

const goalOptions = [
  { value: "bookings", label: "Bookings" },
  { value: "leads", label: "Leads" },
  { value: "faqs", label: "FAQs" },
  { value: "support", label: "Support" },
];

const categoryOptions = [
  { value: "general", label: "General Business" },
  { value: "barber_shop", label: "Barber Shop" },
  { value: "nail_salon", label: "Nail Salon" },
  { value: "beauty_salon", label: "Beauty Salon" },
  { value: "medical_spa", label: "Medical Spa" },
  { value: "dental_office", label: "Dental Office" },
  { value: "fitness_studio", label: "Fitness Studio" },
  { value: "restaurant", label: "Restaurant" },
  { value: "real_estate", label: "Real Estate" },
  { value: "legal", label: "Legal Services" },
  { value: "consulting", label: "Consulting" },
  { value: "other", label: "Other" },
];

export default function BusinessSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/org/settings/business");
      const data = await res.json();
      if (data.ok) {
        setProfile(data.profile);
        setPermissions(data.permissions);
        if (data.profile) {
          setFormData({
            businessName: data.profile.businessName || "",
            category: data.profile.category || "",
            phone: data.profile.phone || "",
            email: data.profile.email || "",
            address: data.profile.address || "",
            serviceArea: data.profile.serviceArea || "",
            websiteUrl: data.profile.websiteUrl || "",
            bookingUrl: data.profile.bookingUrl || "",
            tone: data.profile.tone || "professional",
            primaryGoal: data.profile.primaryGoal || "leads",
            cancellationPolicy: data.profile.cancellationPolicy || "",
            depositPolicy: data.profile.depositPolicy || "",
            refundPolicy: data.profile.refundPolicy || "",
          });
        }
      } else {
        setError(data.message || "Failed to load business settings");
      }
    } catch {
      setError("Failed to load business settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const canEdit = permissions?.canEdit ?? false;

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!canEdit) return;
    
    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, string | null> = {};
      
      if (formData.businessName.trim()) payload.businessName = formData.businessName.trim();
      if (formData.category) payload.category = formData.category;
      payload.phone = formData.phone.trim() || null;
      payload.email = formData.email.trim() || null;
      payload.address = formData.address.trim() || null;
      payload.serviceArea = formData.serviceArea.trim() || null;
      payload.websiteUrl = formData.websiteUrl.trim() || null;
      payload.bookingUrl = formData.bookingUrl.trim() || null;
      if (formData.tone) payload.tone = formData.tone;
      if (formData.primaryGoal) payload.primaryGoal = formData.primaryGoal;
      payload.cancellationPolicy = formData.cancellationPolicy.trim() || null;
      payload.depositPolicy = formData.depositPolicy.trim() || null;
      payload.refundPolicy = formData.refundPolicy.trim() || null;

      const res = await fetch("/api/org/settings/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.ok) {
        setProfile(data.profile);
        setHasChanges(false);
        showSuccess("Business settings saved successfully!");
      } else {
        setError(data.message || "Failed to save settings");
      }
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <TcaPageShell title="Business Settings" subtitle="Manage your business information and policies">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-[var(--color-surface)]" />
          ))}
        </div>
      </TcaPageShell>
    );
  }

  return (
    <TcaPageShell title="Business Settings" subtitle="Manage your business information and policies">
      {!canEdit && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4" data-testid="banner-locked">
          <Lock className="h-5 w-5 text-yellow-400" />
          <div>
            <div className="font-medium text-yellow-400">View Only</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              Contact your administrator to make changes to business settings.
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4" data-testid="alert-error">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="text-red-400">{error}</div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-400" data-testid="alert-success">
          {successMessage}
        </div>
      )}

      <div className="space-y-6">
        <TcaCard data-testid="card-business-info">
          <TcaCardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[var(--color-brand-primary)]" />
              <span>Business Information</span>
            </div>
          </TcaCardHeader>
          <TcaCardBody>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange("businessName", e.target.value)}
                  disabled={!canEdit}
                  placeholder="Your Business Name"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] disabled:opacity-50"
                  data-testid="input-business-name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Business Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  disabled={!canEdit}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] disabled:opacity-50"
                  data-testid="select-category"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Bot Tone
                </label>
                <select
                  value={formData.tone}
                  onChange={(e) => handleInputChange("tone", e.target.value)}
                  disabled={!canEdit}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] disabled:opacity-50"
                  data-testid="select-tone"
                >
                  {toneOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  How your AI assistant should communicate
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Primary Goal
                </label>
                <select
                  value={formData.primaryGoal}
                  onChange={(e) => handleInputChange("primaryGoal", e.target.value)}
                  disabled={!canEdit}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] disabled:opacity-50"
                  data-testid="select-primary-goal"
                >
                  {goalOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  What your bot should prioritize
                </p>
              </div>
            </div>
          </TcaCardBody>
        </TcaCard>

        <TcaCard data-testid="card-contact">
          <TcaCardHeader>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-[var(--color-brand-primary)]" />
              <span>Contact Information</span>
            </div>
          </TcaCardHeader>
          <TcaCardBody>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                  <Phone className="mr-1 inline h-4 w-4" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={!canEdit}
                  placeholder="(555) 123-4567"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] disabled:opacity-50"
                  data-testid="input-phone"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                  <Mail className="mr-1 inline h-4 w-4" />
                  Business Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={!canEdit}
                  placeholder="contact@yourbusiness.com"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] disabled:opacity-50"
                  data-testid="input-email"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                  disabled={!canEdit}
                  placeholder="https://yourbusiness.com"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] disabled:opacity-50"
                  data-testid="input-website"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Booking URL
                </label>
                <input
                  type="url"
                  value={formData.bookingUrl}
                  onChange={(e) => handleInputChange("bookingUrl", e.target.value)}
                  disabled={!canEdit}
                  placeholder="https://calendly.com/yourbusiness"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] disabled:opacity-50"
                  data-testid="input-booking-url"
                />
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Where customers can book appointments
                </p>
              </div>
            </div>
          </TcaCardBody>
        </TcaCard>

        <TcaCard data-testid="card-location">
          <TcaCardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[var(--color-brand-primary)]" />
              <span>Location & Service Area</span>
            </div>
          </TcaCardHeader>
          <TcaCardBody>
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Business Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  disabled={!canEdit}
                  placeholder="123 Main Street, Suite 100&#10;City, State 12345"
                  rows={2}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] disabled:opacity-50"
                  data-testid="input-address"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Service Area
                </label>
                <textarea
                  value={formData.serviceArea}
                  onChange={(e) => handleInputChange("serviceArea", e.target.value)}
                  disabled={!canEdit}
                  placeholder="Describe the areas you serve (e.g., 'We serve all of Treasure Coast including Fort Pierce, Port St. Lucie, and Stuart')"
                  rows={2}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] disabled:opacity-50"
                  data-testid="input-service-area"
                />
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Your AI will use this to answer questions about where you provide services
                </p>
              </div>
            </div>
          </TcaCardBody>
        </TcaCard>

        <TcaCard data-testid="card-policies">
          <TcaCardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--color-brand-primary)]" />
              <span>Business Policies</span>
            </div>
          </TcaCardHeader>
          <TcaCardBody>
            <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
              Your AI assistant will use these policies to answer customer questions accurately. 
              Be clear and concise - these responses will be given directly to customers.
            </p>
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Cancellation Policy
                </label>
                <textarea
                  value={formData.cancellationPolicy}
                  onChange={(e) => handleInputChange("cancellationPolicy", e.target.value)}
                  disabled={!canEdit}
                  placeholder="e.g., We require 24 hours notice for cancellations. Same-day cancellations may be subject to a 50% fee."
                  rows={3}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] disabled:opacity-50"
                  data-testid="input-cancellation-policy"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Deposit Policy
                </label>
                <textarea
                  value={formData.depositPolicy}
                  onChange={(e) => handleInputChange("depositPolicy", e.target.value)}
                  disabled={!canEdit}
                  placeholder="e.g., We require a 25% deposit at the time of booking. The remaining balance is due at your appointment."
                  rows={3}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] disabled:opacity-50"
                  data-testid="input-deposit-policy"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Refund Policy
                </label>
                <textarea
                  value={formData.refundPolicy}
                  onChange={(e) => handleInputChange("refundPolicy", e.target.value)}
                  disabled={!canEdit}
                  placeholder="e.g., Refunds are available within 7 days of service if you're not satisfied. Please contact us to discuss any concerns."
                  rows={3}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)] disabled:opacity-50"
                  data-testid="input-refund-policy"
                />
              </div>
            </div>
          </TcaCardBody>
        </TcaCard>

        {canEdit && (
          <div className="flex justify-end">
            <TcaButton
              variant="primary"
              size="lg"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              data-testid="button-save"
            >
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </TcaButton>
          </div>
        )}
      </div>
    </TcaPageShell>
  );
}

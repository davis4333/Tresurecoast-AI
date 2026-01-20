"use client";

import { useState, useEffect, useCallback } from "react";
import {
  dollarsToCents,
  centsToDollars,
  centsToInput,
  truncateUrl,
  isValidUrl,
  reorderItems,
} from "@/lib/validators/serviceHelpers";
import { Lock, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Copy, Check, ExternalLink } from "lucide-react";

type Service = {
  id: number;
  name: string;
  priceCents: number | null;
  bookingUrl: string | null;
  paymentUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Permissions = {
  canEdit: boolean;
  allowClientEdits: boolean;
  role: string;
};

type FormData = {
  name: string;
  priceInput: string;
  bookingUrl: string;
  paymentUrl: string;
  isActive: boolean;
};

type FormErrors = {
  name?: string;
  priceInput?: string;
  bookingUrl?: string;
  paymentUrl?: string;
};

const emptyForm: FormData = {
  name: "",
  priceInput: "",
  bookingUrl: "",
  paymentUrl: "",
  isActive: true,
};

export default function ServicesSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch("/api/org/settings/services");
      const data = await res.json();
      if (data.ok) {
        setServices(data.services);
        setPermissions(data.permissions);
      } else {
        setError(data.message || "Failed to load services");
      }
    } catch {
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const canEdit = permissions?.canEdit ?? false;

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = "Service name is required";
    } else if (formData.name.trim().length > 100) {
      errors.name = "Service name must be 100 characters or less";
    }
    
    if (formData.priceInput.trim()) {
      const cents = dollarsToCents(formData.priceInput);
      if (cents === null) {
        errors.priceInput = "Enter a valid price (e.g., 25.00)";
      }
    }
    
    if (formData.bookingUrl.trim() && !isValidUrl(formData.bookingUrl)) {
      errors.bookingUrl = "Enter a valid URL (e.g., https://example.com)";
    }
    
    if (formData.paymentUrl.trim() && !isValidUrl(formData.paymentUrl)) {
      errors.paymentUrl = "Enter a valid URL (e.g., https://example.com)";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAddModal = () => {
    setEditingService(null);
    setFormData(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      priceInput: centsToInput(service.priceCents),
      bookingUrl: service.bookingUrl || "",
      paymentUrl: service.paymentUrl || "",
      isActive: service.isActive,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingService(null);
    setFormData(emptyForm);
    setFormErrors({});
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const priceCents = formData.priceInput.trim() 
        ? dollarsToCents(formData.priceInput) 
        : null;
      
      const body = {
        ...(editingService && { id: editingService.id }),
        name: formData.name.trim(),
        priceCents,
        bookingUrl: formData.bookingUrl.trim() || null,
        paymentUrl: formData.paymentUrl.trim() || null,
        isActive: formData.isActive,
      };
      
      const method = editingService ? "PUT" : "POST";
      const res = await fetch("/api/org/settings/services", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (data.ok) {
        showSuccess(editingService ? "Service updated" : "Service created");
        closeModal();
        fetchServices();
      } else {
        if (data.error === "duplicate_service") {
          setFormErrors({ name: "That service name already exists" });
        } else if (data.error === "forbidden") {
          setError("Edits are locked by the agency");
          closeModal();
        } else {
          setError(data.message || "Something went wrong");
        }
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (serviceId: number) => {
    setDeleting(true);
    setError(null);
    
    try {
      const res = await fetch("/api/org/settings/services", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: serviceId }),
      });
      
      const data = await res.json();
      
      if (data.ok) {
        showSuccess("Service deleted");
        setDeleteConfirmId(null);
        fetchServices();
      } else if (data.error === "forbidden") {
        setError("Edits are locked by the agency");
      } else {
        setError(data.message || "Failed to delete service");
      }
    } catch {
      setError("Failed to delete service");
    } finally {
      setDeleting(false);
    }
  };

  const handleReorder = async (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= services.length) return;
    
    const reordered = reorderItems(services, fromIndex, toIndex);
    setServices(reordered);
    
    const updates = reordered.filter((s, i) => s.displayOrder !== services[i]?.displayOrder);
    
    for (const service of updates) {
      try {
        await fetch("/api/org/settings/services", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: service.id, displayOrder: service.displayOrder }),
        });
      } catch {
        setError("Failed to save order");
        fetchServices();
        return;
      }
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      // Fallback for older browsers
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="tca-page-header">
          <h1 className="tca-page-title">Services</h1>
          <p className="tca-page-subtitle">Loading...</p>
        </div>
        <div className="tca-card p-6 max-w-4xl animate-pulse">
          <div className="h-12 bg-[var(--color-surface-hover)] rounded mb-4" />
          <div className="h-12 bg-[var(--color-surface-hover)] rounded mb-4" />
          <div className="h-12 bg-[var(--color-surface-hover)] rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="tca-page-header">
        <h1 className="tca-page-title">Services</h1>
        <p className="tca-page-subtitle">
          Manage your service menu with booking and payment links
        </p>
      </div>

      {!canEdit && (
        <div 
          className="mb-6 max-w-4xl rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 flex items-center gap-3"
          data-testid="banner-locked"
        >
          <Lock className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-400">Editing is locked</p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              Your agency has restricted editing for this account. Contact them for changes.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 max-w-4xl rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400" data-testid="text-error">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 max-w-4xl rounded-lg border border-green-500/20 bg-green-500/10 p-4">
          <p className="text-sm text-green-400" data-testid="text-success">{successMessage}</p>
        </div>
      )}

      <div className="tca-card p-6 max-w-4xl">
        {canEdit && (
          <div className="flex justify-end mb-4">
            <button
              onClick={openAddModal}
              className="tca-btn-primary flex items-center gap-2"
              data-testid="button-add-service"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </button>
          </div>
        )}

        {services.length === 0 ? (
          <div className="text-center py-12" data-testid="empty-state">
            <div className="w-12 h-12 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 text-[var(--color-text-muted)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              Add your first service
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto mb-4">
              Services power your booking links and lead capture. Add the services you offer to help customers find what they need.
            </p>
            {canEdit && (
              <button
                onClick={openAddModal}
                className="tca-btn-primary"
                data-testid="button-add-service-empty"
              >
                Add Service
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service, index) => (
              <div
                key={service.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]"
                data-testid={`service-row-${service.id}`}
              >
                {canEdit && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleReorder(index, "up")}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-[var(--color-surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
                      data-testid={`button-move-up-${service.id}`}
                      aria-label="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReorder(index, "down")}
                      disabled={index === services.length - 1}
                      className="p-1 rounded hover:bg-[var(--color-surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
                      data-testid={`button-move-down-${service.id}`}
                      aria-label="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="font-medium text-[var(--color-text-primary)]"
                      data-testid={`text-service-name-${service.id}`}
                    >
                      {service.name}
                    </span>
                    {service.priceCents !== null && (
                      <span 
                        className="text-sm text-[var(--color-text-secondary)]"
                        data-testid={`text-service-price-${service.id}`}
                      >
                        {centsToDollars(service.priceCents)}
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        service.isActive
                          ? "bg-green-500/10 text-green-400"
                          : "bg-gray-500/10 text-gray-400"
                      }`}
                      data-testid={`badge-status-${service.id}`}
                    >
                      {service.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-xs text-[var(--color-text-muted)]">
                    {service.bookingUrl && (
                      <div className="flex items-center gap-1">
                        <span>Book:</span>
                        <a
                          href={service.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--color-brand-primary)] hover:underline flex items-center gap-1"
                        >
                          {truncateUrl(service.bookingUrl, 25)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => copyToClipboard(service.bookingUrl!)}
                          className="p-1 rounded hover:bg-[var(--color-surface-hover)]"
                          data-testid={`button-copy-booking-${service.id}`}
                        >
                          {copiedUrl === service.bookingUrl ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                    {service.paymentUrl && (
                      <div className="flex items-center gap-1">
                        <span>Pay:</span>
                        <a
                          href={service.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--color-brand-primary)] hover:underline flex items-center gap-1"
                        >
                          {truncateUrl(service.paymentUrl, 25)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => copyToClipboard(service.paymentUrl!)}
                          className="p-1 rounded hover:bg-[var(--color-surface-hover)]"
                          data-testid={`button-copy-payment-${service.id}`}
                        >
                          {copiedUrl === service.paymentUrl ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(service)}
                      className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                      data-testid={`button-edit-${service.id}`}
                      aria-label="Edit service"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(service.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--color-text-secondary)] hover:text-red-400"
                      data-testid={`button-delete-${service.id}`}
                      aria-label="Delete service"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          data-testid="modal-service"
        >
          <div className="bg-[var(--color-surface)] rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              {editingService ? "Edit Service" : "Add Service"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Men's Haircut"
                  className={`tca-input ${formErrors.name ? "border-red-500" : ""}`}
                  data-testid="input-service-name"
                />
                {formErrors.name && (
                  <p className="text-xs text-red-400 mt-1" data-testid="error-service-name">
                    {formErrors.name}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Price (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">$</span>
                  <input
                    type="text"
                    value={formData.priceInput}
                    onChange={(e) => setFormData({ ...formData, priceInput: e.target.value })}
                    placeholder="25.00"
                    className={`tca-input pl-7 ${formErrors.priceInput ? "border-red-500" : ""}`}
                    data-testid="input-service-price"
                  />
                </div>
                {formErrors.priceInput && (
                  <p className="text-xs text-red-400 mt-1" data-testid="error-service-price">
                    {formErrors.priceInput}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Booking URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.bookingUrl}
                  onChange={(e) => setFormData({ ...formData, bookingUrl: e.target.value })}
                  placeholder="https://calendly.com/..."
                  className={`tca-input ${formErrors.bookingUrl ? "border-red-500" : ""}`}
                  data-testid="input-booking-url"
                />
                {formErrors.bookingUrl && (
                  <p className="text-xs text-red-400 mt-1" data-testid="error-booking-url">
                    {formErrors.bookingUrl}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Payment URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.paymentUrl}
                  onChange={(e) => setFormData({ ...formData, paymentUrl: e.target.value })}
                  placeholder="https://pay.stripe.com/..."
                  className={`tca-input ${formErrors.paymentUrl ? "border-red-500" : ""}`}
                  data-testid="input-payment-url"
                />
                {formErrors.paymentUrl && (
                  <p className="text-xs text-red-400 mt-1" data-testid="error-payment-url">
                    {formErrors.paymentUrl}
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    Active
                  </label>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Hidden services won&apos;t appear to customers
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isActive}
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isActive ? "bg-[var(--color-brand-primary)]" : "bg-[var(--color-surface-hover)]"
                  }`}
                  data-testid="toggle-active"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                data-testid="button-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="tca-btn-primary"
                data-testid="button-save-service"
              >
                {saving ? "Saving..." : editingService ? "Save Changes" : "Add Service"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId !== null && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirmId(null); }}
          data-testid="modal-delete-confirm"
        >
          <div className="bg-[var(--color-surface)] rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl border border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              Delete Service?
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              This action cannot be undone. The service will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                data-testid="button-cancel-delete"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg"
                data-testid="button-confirm-delete"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { TcaButton } from "@/components/tca/TcaButton";
import { X } from "lucide-react";

interface Service {
  id: number;
  name: string;
  priceCents: number | null;
  durationMinutes: number;
}

interface NewBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function NewBookingModal({ open, onOpenChange, onCreated }: NewBookingModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [serviceId, setServiceId] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      // Fetch services
      fetch("/api/org/settings/services")
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setServices(data.services || []);
          }
        })
        .catch(() => {});

      // Set default date to today
      const today = new Date();
      setDate(today.toISOString().split("T")[0] ?? "");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

      const res = await fetch("/api/org/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: serviceId || undefined,
          scheduledAt,
          customerName,
          customerEmail: customerEmail || undefined,
          customerPhone: customerPhone || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.message || "Failed to create booking");
        return;
      }

      // Reset form
      setServiceId("");
      setDate("");
      setTime("");
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setNotes("");

      onCreated();
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-lg rounded-xl bg-[var(--color-surface)] p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            New Booking
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-2 hover:bg-[var(--color-surface-hover)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="tca-input w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                Time *
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="tca-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Service
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : "")}
              className="tca-input w-full"
            >
              <option value="">No service selected</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                  {service.priceCents && ` - $${(service.priceCents / 100).toFixed(2)}`}
                  {` (${service.durationMinutes} min)`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Customer Name *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              placeholder="John Smith"
              className="tca-input w-full"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="john@example.com"
                className="tca-input w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                Phone
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="tca-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests..."
              rows={3}
              className="tca-input w-full"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <TcaButton type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </TcaButton>
            <TcaButton type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Booking"}
            </TcaButton>
          </div>
        </form>
      </div>
    </div>
  );
}

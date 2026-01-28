"use client";

import { useState } from "react";
import { TcaButton } from "@/components/tca/TcaButton";
import { X, Check, XCircle, Clock } from "lucide-react";

interface Booking {
  bookingPublicId: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  scheduledAt: string;
  endAt: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  notes: string | null;
  serviceName: string | null;
  serviceId: number | null;
  durationMinutes: number | null;
  priceCents: number | null;
  createdAt: string;
}

interface BookingDetailDrawerProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingUpdate: (booking: Partial<Booking>) => void;
  onRefresh: () => void;
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending", icon: Clock, color: "text-yellow-400" },
  { value: "CONFIRMED", label: "Confirmed", icon: Check, color: "text-green-400" },
  { value: "COMPLETED", label: "Completed", icon: Check, color: "text-blue-400" },
  { value: "CANCELLED", label: "Cancelled", icon: XCircle, color: "text-red-400" },
  { value: "NO_SHOW", label: "No Show", icon: XCircle, color: "text-gray-400" },
];

export function BookingDetailDrawer({
  booking,
  open,
  onOpenChange,
  onBookingUpdate,
  onRefresh,
}: BookingDetailDrawerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [staffNotes, setStaffNotes] = useState("");

  if (!open || !booking) return null;

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/org/bookings/${booking.bookingPublicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.ok) {
        onBookingUpdate({ status: newStatus as Booking["status"] });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/org/bookings/${booking.bookingPublicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED", cancelReason: "Cancelled by staff" }),
      });
      const data = await res.json();
      if (data.ok) {
        onBookingUpdate({ status: "CANCELLED" });
        onRefresh();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full max-w-md bg-[var(--color-surface)] shadow-xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Booking Details
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-2 hover:bg-[var(--color-surface-hover)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              {/* Status */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isActive = booking.status === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleStatusChange(option.value)}
                        disabled={isUpdating}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-[var(--color-brand-primary)] text-white"
                            : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? "" : option.color}`} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date & Time */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Date & Time
                </label>
                <p className="text-[var(--color-text-primary)]">
                  {formatDateTime(booking.scheduledAt)}
                </p>
                {booking.durationMinutes && (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Duration: {booking.durationMinutes} minutes
                  </p>
                )}
              </div>

              {/* Service */}
              {booking.serviceName && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                    Service
                  </label>
                  <p className="text-[var(--color-text-primary)]">{booking.serviceName}</p>
                  {booking.priceCents && (
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {formatPrice(booking.priceCents)}
                    </p>
                  )}
                </div>
              )}

              {/* Customer Info */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Customer
                </label>
                <p className="font-medium text-[var(--color-text-primary)]">
                  {booking.customerName}
                </p>
                {booking.customerEmail && (
                  <a
                    href={`mailto:${booking.customerEmail}`}
                    className="block text-sm text-[var(--color-brand-primary)] hover:underline"
                  >
                    {booking.customerEmail}
                  </a>
                )}
                {booking.customerPhone && (
                  <a
                    href={`tel:${booking.customerPhone}`}
                    className="block text-sm text-[var(--color-brand-primary)] hover:underline"
                  >
                    {booking.customerPhone}
                  </a>
                )}
              </div>

              {/* Customer Notes */}
              {booking.notes && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                    Customer Notes
                  </label>
                  <p className="rounded-lg bg-[var(--color-surface-hover)] p-3 text-sm text-[var(--color-text-primary)]">
                    {booking.notes}
                  </p>
                </div>
              )}

              {/* Staff Notes */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Staff Notes
                </label>
                <textarea
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  className="tca-input w-full"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] p-4">
            <div className="flex gap-2">
              {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
                <TcaButton
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isUpdating}
                  className="text-red-400 hover:text-red-300"
                >
                  Cancel Booking
                </TcaButton>
              )}
              <div className="flex-1" />
              <TcaButton variant="secondary" onClick={() => onOpenChange(false)}>
                Close
              </TcaButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

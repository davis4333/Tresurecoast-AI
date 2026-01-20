"use client";

import { useCallback } from "react";

export type BookingService = {
  id: number;
  name: string;
  price?: number | null;
  bookingUrl?: string | null;
};

export type BookingDirectiveType =
  | "SHOW_SERVICE_PICKER"
  | "SHOW_BOOKING_LINK"
  | "ASK_FOR_NAME"
  | "ASK_FOR_PHONE"
  | "ASK_FOR_EMAIL"
  | "FLOW_COMPLETE"
  | "CONTINUE_CHAT";

type BookingDirectivesProps = {
  directiveType: BookingDirectiveType | null;
  services?: BookingService[];
  bookingUrl?: string;
  conversationPublicId?: string;
  botPublicKey: string;
  headerBg?: string;
  onServiceSelect: (service: BookingService) => void;
};

export function BookingDirectives({
  directiveType,
  services,
  bookingUrl,
  conversationPublicId,
  botPublicKey,
  headerBg = "var(--color-brand-primary)",
  onServiceSelect,
}: BookingDirectivesProps) {
  const handleBookingLinkClick = useCallback(async () => {
    if (!conversationPublicId || !bookingUrl) return;

    try {
      await fetch("/api/public/booking-click", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botPublicKey,
          conversationPublicId,
          bookingUrl,
        }),
      });
    } catch {
      // Silently fail analytics tracking
    }
  }, [botPublicKey, conversationPublicId, bookingUrl]);

  if (directiveType === "SHOW_SERVICE_PICKER" && services && services.length > 0) {
    return (
      <div
        className="rounded-lg border border-white/10 bg-white/5 p-4"
        data-testid="booking-service-picker"
      >
        <p className="mb-3 text-sm text-white/90">Select a service:</p>
        <div className="flex flex-wrap gap-2">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => onServiceSelect(service)}
              data-testid={`button-service-${service.id}`}
              style={{
                backgroundColor: headerBg,
              }}
              className="rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              {service.name}
              {service.price !== null && service.price !== undefined && (
                <span className="ml-2 opacity-75">
                  ${service.price}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (directiveType === "SHOW_BOOKING_LINK" && bookingUrl) {
    return (
      <div
        className="rounded-lg border border-white/10 bg-white/5 p-4"
        data-testid="booking-link-container"
      >
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleBookingLinkClick}
          data-testid="link-booking"
          style={{
            backgroundColor: headerBg,
          }}
          className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Book Now
        </a>
      </div>
    );
  }

  return null;
}

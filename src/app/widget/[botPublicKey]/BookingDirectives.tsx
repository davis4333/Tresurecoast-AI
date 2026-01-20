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
        className="tca-booking-container"
        data-testid="booking-service-picker"
      >
        <p className="mb-4 text-sm font-medium tca-text-primary">Select a service:</p>
        <div className="flex flex-wrap gap-2">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => onServiceSelect(service)}
              data-testid={`widget-service-button-${service.id}`}
              style={{
                backgroundColor: headerBg,
              }}
              className="tca-service-btn"
            >
              {service.name}
              {service.price !== null && service.price !== undefined && (
                <span className="ml-1 opacity-90">
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
        className="tca-booking-container flex justify-center"
        data-testid="booking-link-container"
      >
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleBookingLinkClick}
          data-testid="booking-link-button"
          style={{
            backgroundColor: headerBg,
          }}
          className="tca-booking-link"
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
            className="flex-shrink-0"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Book Now</span>
        </a>
      </div>
    );
  }

  return null;
}

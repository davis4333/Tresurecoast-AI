"use client";

import { useState, useEffect, useCallback } from "react";
import { TcaCard, TcaCardBody, TcaCardHeader } from "@/components/tca/TcaCard";
import { TcaButton } from "@/components/tca/TcaButton";
import { TcaBadge } from "@/components/tca/TcaBadge";
import { BookingDetailDrawer } from "./BookingDetailDrawer";
import { NewBookingModal } from "./NewBookingModal";
import { Calendar, List, Plus, ChevronLeft, ChevronRight } from "lucide-react";

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

interface Summary {
  total: number;
  pending: number;
  confirmed: number;
  today: number;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  CONFIRMED: "bg-green-500/20 text-green-400",
  COMPLETED: "bg-blue-500/20 text-blue-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  NO_SHOW: "bg-gray-500/20 text-gray-400",
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  // Add days from previous month to start on Sunday
  const startDayOfWeek = firstDay.getDay();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  // Add all days of current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  // Add days from next month to fill the grid
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newBookingOpen, setNewBookingOpen] = useState(false);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const monthDays = getMonthDays(currentYear, currentMonth);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/org/bookings?days=90");
      const data = await res.json();

      if (!data.ok) {
        setError(data.message || data.error || "Failed to fetch bookings");
        setBookings([]);
      } else {
        setBookings(data.bookings || []);
        setSummary(data.summary || null);
      }
    } catch {
      setError("Network error");
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setDrawerOpen(true);
  };

  const handleBookingUpdate = (updated: Partial<Booking>) => {
    if (selectedBooking) {
      const merged = { ...selectedBooking, ...updated };
      setSelectedBooking(merged);
      setBookings((prev) =>
        prev.map((b) => (b.bookingPublicId === merged.bookingPublicId ? merged : b))
      );
    }
  };

  const handleNewBookingCreated = () => {
    setNewBookingOpen(false);
    fetchBookings();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const getBookingsForDay = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0] ?? "";
    return bookings.filter((b) => b.scheduledAt.startsWith(dateStr));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="tca-gradient-text text-3xl font-extrabold tracking-tight">
            Bookings
          </h2>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Manage appointments and scheduling.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                view === "list"
                  ? "bg-[var(--color-brand-primary)] text-white"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              } rounded-l-lg`}
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                view === "calendar"
                  ? "bg-[var(--color-brand-primary)] text-white"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              } rounded-r-lg`}
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </button>
          </div>
          <TcaButton onClick={() => setNewBookingOpen(true)}>
            <Plus className="h-4 w-4" />
            New Booking
          </TcaButton>
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TcaCard>
            <TcaCardBody className="py-4">
              <div className="text-sm text-[var(--color-text-muted)]">Total Bookings</div>
              <div className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                {summary.total}
              </div>
            </TcaCardBody>
          </TcaCard>
          <TcaCard>
            <TcaCardBody className="py-4">
              <div className="text-sm text-[var(--color-text-muted)]">Today</div>
              <div className="mt-1 text-2xl font-bold text-green-400">{summary.today}</div>
            </TcaCardBody>
          </TcaCard>
          <TcaCard>
            <TcaCardBody className="py-4">
              <div className="text-sm text-[var(--color-text-muted)]">Pending</div>
              <div className="mt-1 text-2xl font-bold text-yellow-400">{summary.pending}</div>
            </TcaCardBody>
          </TcaCard>
          <TcaCard>
            <TcaCardBody className="py-4">
              <div className="text-sm text-[var(--color-text-muted)]">Confirmed</div>
              <div className="mt-1 text-2xl font-bold text-blue-400">{summary.confirmed}</div>
            </TcaCardBody>
          </TcaCard>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {isLoading ? (
        <TcaCard>
          <TcaCardBody>
            <div className="flex items-center justify-center py-12">
              <div className="text-[var(--color-text-secondary)]">Loading bookings...</div>
            </div>
          </TcaCardBody>
        </TcaCard>
      ) : view === "list" ? (
        // List View
        bookings.length === 0 ? (
          <TcaCard>
            <TcaCardBody>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-hover)]">
                  <Calendar className="h-8 w-8 text-[var(--color-text-muted)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  No Bookings Yet
                </h3>
                <p className="mt-2 max-w-sm text-sm text-[var(--color-text-secondary)]">
                  Bookings will appear here when customers schedule appointments.
                </p>
                <TcaButton className="mt-4" onClick={() => setNewBookingOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create First Booking
                </TcaButton>
              </div>
            </TcaCardBody>
          </TcaCard>
        ) : (
          <TcaCard>
            <TcaCardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="tca-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr
                        key={booking.bookingPublicId}
                        onClick={() => handleBookingClick(booking)}
                        className="cursor-pointer"
                      >
                        <td>
                          <div className="font-medium text-[var(--color-text-primary)]">
                            {formatDate(booking.scheduledAt)}
                          </div>
                          <div className="text-sm text-[var(--color-text-muted)]">
                            {formatTime(booking.scheduledAt)}
                            {booking.endAt && ` - ${formatTime(booking.endAt)}`}
                          </div>
                        </td>
                        <td>
                          <div className="font-medium text-[var(--color-text-primary)]">
                            {booking.customerName}
                          </div>
                          {booking.customerEmail && (
                            <div className="text-sm text-[var(--color-text-muted)]">
                              {booking.customerEmail}
                            </div>
                          )}
                        </td>
                        <td className="text-[var(--color-text-secondary)]">
                          {booking.serviceName || "-"}
                        </td>
                        <td>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[booking.status]}`}
                          >
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TcaCardBody>
          </TcaCard>
        )
      ) : (
        // Calendar View
        <TcaCard>
          <TcaCardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="rounded-lg p-2 hover:bg-[var(--color-surface-hover)]"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="rounded-lg px-3 py-1 text-sm hover:bg-[var(--color-surface-hover)]"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="rounded-lg p-2 hover:bg-[var(--color-surface-hover)]"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </TcaCardHeader>
          <TcaCardBody>
            <div className="grid grid-cols-7 gap-px rounded-lg bg-[var(--color-border)] overflow-hidden">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="bg-[var(--color-surface)] p-2 text-center text-sm font-medium text-[var(--color-text-muted)]"
                >
                  {day}
                </div>
              ))}
              {monthDays.map((date, i) => {
                const isCurrentMonth = date.getMonth() === currentMonth;
                const isToday = date.toDateString() === today.toDateString();
                const dayBookings = getBookingsForDay(date);

                return (
                  <div
                    key={i}
                    className={`min-h-[100px] bg-[var(--color-surface)] p-2 ${
                      !isCurrentMonth ? "opacity-40" : ""
                    }`}
                  >
                    <div
                      className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                        isToday
                          ? "bg-[var(--color-brand-primary)] font-bold text-white"
                          : "text-[var(--color-text-primary)]"
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map((booking) => (
                        <button
                          key={booking.bookingPublicId}
                          onClick={() => handleBookingClick(booking)}
                          className={`w-full truncate rounded px-1 py-0.5 text-left text-xs ${STATUS_STYLES[booking.status]}`}
                        >
                          {formatTime(booking.scheduledAt)} {booking.customerName}
                        </button>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-[var(--color-text-muted)]">
                          +{dayBookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TcaCardBody>
        </TcaCard>
      )}

      <BookingDetailDrawer
        booking={selectedBooking}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onBookingUpdate={handleBookingUpdate}
        onRefresh={fetchBookings}
      />

      <NewBookingModal
        open={newBookingOpen}
        onOpenChange={setNewBookingOpen}
        onCreated={handleNewBookingCreated}
      />
    </div>
  );
}

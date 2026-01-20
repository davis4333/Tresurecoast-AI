import { z } from "zod";

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type DayName = (typeof DAY_NAMES)[number];

const TIME_REGEX = /^\d{2}:\d{2}$/;

function isValidTime(time: string): boolean {
  if (!TIME_REGEX.test(time)) return false;
  const parts = time.split(":").map(Number);
  const hours = parts[0] ?? -1;
  const minutes = parts[1] ?? -1;
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export const OrganizationHoursDaySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isClosed: z.boolean(),
    openTime: z
      .string()
      .nullable()
      .optional()
      .transform((val) => val ?? null),
    closeTime: z
      .string()
      .nullable()
      .optional()
      .transform((val) => val ?? null),
  })
  .refine(
    (data) => {
      if (data.isClosed) {
        return data.openTime === null && data.closeTime === null;
      }
      return true;
    },
    {
      message: "Closed days must not have open/close times",
      path: ["isClosed"],
    }
  )
  .refine(
    (data) => {
      if (!data.isClosed) {
        return data.openTime !== null && data.closeTime !== null;
      }
      return true;
    },
    {
      message: "Open days must have both open and close times",
      path: ["openTime"],
    }
  )
  .refine(
    (data) => {
      if (data.openTime !== null && !isValidTime(data.openTime)) {
        return false;
      }
      return true;
    },
    {
      message: "Invalid open time format (must be HH:MM)",
      path: ["openTime"],
    }
  )
  .refine(
    (data) => {
      if (data.closeTime !== null && !isValidTime(data.closeTime)) {
        return false;
      }
      return true;
    },
    {
      message: "Invalid close time format (must be HH:MM)",
      path: ["closeTime"],
    }
  )
  .refine(
    (data) => {
      if (
        !data.isClosed &&
        data.openTime !== null &&
        data.closeTime !== null
      ) {
        return data.openTime < data.closeTime;
      }
      return true;
    },
    {
      message: "Open time must be before close time",
      path: ["openTime"],
    }
  );

export type OrganizationHoursDay = z.infer<typeof OrganizationHoursDaySchema>;

export const OrganizationHoursBulkSchema = z
  .array(OrganizationHoursDaySchema)
  .refine(
    (data) => data.length === 7,
    { message: "Must provide exactly 7 days" }
  )
  .refine(
    (data) => {
      const days = data.map((d) => d.dayOfWeek);
      const uniqueDays = new Set(days);
      return uniqueDays.size === 7;
    },
    { message: "Days must be unique (0-6)" }
  )
  .refine(
    (data) => {
      const days = data.map((d) => d.dayOfWeek).sort((a, b) => a - b);
      for (let i = 0; i < 7; i++) {
        if (days[i] !== i) return false;
      }
      return true;
    },
    { message: "Must include all days 0-6" }
  );

export type OrganizationHoursBulk = z.infer<typeof OrganizationHoursBulkSchema>;

export interface NormalizedHoursDay {
  dayOfWeek: number;
  dayName: DayName;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
}

export function normalizeHoursResponse(
  dbRows: Array<{
    dayOfWeek: number;
    isClosed: boolean;
    openTime: string | null;
    closeTime: string | null;
  }>
): NormalizedHoursDay[] {
  const rowMap = new Map(dbRows.map((r) => [r.dayOfWeek, r]));

  const result: NormalizedHoursDay[] = [];
  for (let day = 0; day < 7; day++) {
    const dayName = DAY_NAMES[day] as DayName;
    const existing = rowMap.get(day);
    if (existing) {
      result.push({
        dayOfWeek: day,
        dayName,
        isClosed: existing.isClosed,
        openTime: existing.openTime,
        closeTime: existing.closeTime,
      });
    } else {
      result.push({
        dayOfWeek: day,
        dayName,
        isClosed: true,
        openTime: null,
        closeTime: null,
      });
    }
  }

  return result;
}

export function sortHoursByDay(
  hours: OrganizationHoursDay[]
): OrganizationHoursDay[] {
  return [...hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

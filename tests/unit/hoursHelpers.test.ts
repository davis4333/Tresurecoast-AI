import { describe, it, expect } from "vitest";
import {
  dayLabel,
  isValidTime,
  compareTimes,
  validateDayRow,
  normalizeHours,
  hasChanges,
  validateAllDays,
  preparePayload,
  DayHours,
} from "@/lib/settings/hoursHelpers";

describe("hoursHelpers", () => {
  describe("dayLabel", () => {
    it("returns correct day names for 0-6", () => {
      expect(dayLabel(0)).toBe("Sunday");
      expect(dayLabel(1)).toBe("Monday");
      expect(dayLabel(2)).toBe("Tuesday");
      expect(dayLabel(3)).toBe("Wednesday");
      expect(dayLabel(4)).toBe("Thursday");
      expect(dayLabel(5)).toBe("Friday");
      expect(dayLabel(6)).toBe("Saturday");
    });

    it("returns Unknown for out-of-range values", () => {
      expect(dayLabel(-1)).toBe("Unknown");
      expect(dayLabel(7)).toBe("Unknown");
      expect(dayLabel(100)).toBe("Unknown");
    });
  });

  describe("isValidTime", () => {
    it("accepts valid HH:MM times", () => {
      expect(isValidTime("00:00")).toBe(true);
      expect(isValidTime("09:00")).toBe(true);
      expect(isValidTime("12:30")).toBe(true);
      expect(isValidTime("17:00")).toBe(true);
      expect(isValidTime("23:59")).toBe(true);
    });

    it("rejects invalid times", () => {
      expect(isValidTime("")).toBe(false);
      expect(isValidTime("9:00")).toBe(false);
      expect(isValidTime("09:0")).toBe(false);
      expect(isValidTime("24:00")).toBe(false);
      expect(isValidTime("12:60")).toBe(false);
      expect(isValidTime("abc")).toBe(false);
      expect(isValidTime("12:00:00")).toBe(false);
    });

    it("rejects non-string values", () => {
      expect(isValidTime(null as unknown as string)).toBe(false);
      expect(isValidTime(undefined as unknown as string)).toBe(false);
    });
  });

  describe("compareTimes", () => {
    it("returns negative when open is before close", () => {
      expect(compareTimes("09:00", "17:00")).toBeLessThan(0);
      expect(compareTimes("08:00", "08:30")).toBeLessThan(0);
    });

    it("returns zero when times are equal", () => {
      expect(compareTimes("09:00", "09:00")).toBe(0);
      expect(compareTimes("17:30", "17:30")).toBe(0);
    });

    it("returns positive when open is after close", () => {
      expect(compareTimes("17:00", "09:00")).toBeGreaterThan(0);
      expect(compareTimes("12:00", "11:59")).toBeGreaterThan(0);
    });
  });

  describe("validateDayRow", () => {
    it("returns null for valid open day", () => {
      const day: DayHours = {
        dayOfWeek: 1,
        isClosed: false,
        openTime: "09:00",
        closeTime: "17:00",
      };
      expect(validateDayRow(day)).toBeNull();
    });

    it("returns null for valid closed day", () => {
      const day: DayHours = {
        dayOfWeek: 0,
        isClosed: true,
        openTime: null,
        closeTime: null,
      };
      expect(validateDayRow(day)).toBeNull();
    });

    it("returns error for missing open time", () => {
      const day: DayHours = {
        dayOfWeek: 1,
        isClosed: false,
        openTime: null,
        closeTime: "17:00",
      };
      const error = validateDayRow(day);
      expect(error).not.toBeNull();
      expect(error?.openTime).toBe("Open time required");
    });

    it("returns error for missing close time", () => {
      const day: DayHours = {
        dayOfWeek: 1,
        isClosed: false,
        openTime: "09:00",
        closeTime: null,
      };
      const error = validateDayRow(day);
      expect(error).not.toBeNull();
      expect(error?.closeTime).toBe("Close time required");
    });

    it("returns error for invalid time format", () => {
      const day: DayHours = {
        dayOfWeek: 1,
        isClosed: false,
        openTime: "9:00",
        closeTime: "17:00",
      };
      const error = validateDayRow(day);
      expect(error).not.toBeNull();
      expect(error?.openTime).toBe("Invalid time format (use HH:MM)");
    });

    it("returns error when open >= close", () => {
      const day: DayHours = {
        dayOfWeek: 1,
        isClosed: false,
        openTime: "17:00",
        closeTime: "09:00",
      };
      const error = validateDayRow(day);
      expect(error).not.toBeNull();
      expect(error?.closeTime).toBe("Close time must be after open time");
    });

    it("returns error when open equals close", () => {
      const day: DayHours = {
        dayOfWeek: 1,
        isClosed: false,
        openTime: "12:00",
        closeTime: "12:00",
      };
      const error = validateDayRow(day);
      expect(error).not.toBeNull();
      expect(error?.closeTime).toBe("Close time must be after open time");
    });

    it("returns error for closed day with times set", () => {
      const day: DayHours = {
        dayOfWeek: 0,
        isClosed: true,
        openTime: "09:00",
        closeTime: "17:00",
      };
      const error = validateDayRow(day);
      expect(error).not.toBeNull();
      expect(error?.general).toBe("Closed days should not have times set");
    });
  });

  describe("normalizeHours", () => {
    it("returns 7 days in order 0-6", () => {
      const result = normalizeHours([]);
      expect(result).toHaveLength(7);
      expect(result.map((d) => d.dayOfWeek)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it("fills missing days with closed defaults", () => {
      const result = normalizeHours([
        { dayOfWeek: 1, isClosed: false, openTime: "09:00", closeTime: "17:00" },
      ]);
      expect(result).toHaveLength(7);
      expect(result[0]?.isClosed).toBe(true);
      expect(result[0]?.openTime).toBeNull();
      expect(result[1]?.isClosed).toBe(false);
      expect(result[1]?.openTime).toBe("09:00");
    });

    it("includes dayName for each day", () => {
      const result = normalizeHours([]);
      expect(result[0]?.dayName).toBe("Sunday");
      expect(result[6]?.dayName).toBe("Saturday");
    });

    it("handles out-of-order input", () => {
      const result = normalizeHours([
        { dayOfWeek: 5, isClosed: false, openTime: "09:00", closeTime: "17:00" },
        { dayOfWeek: 1, isClosed: false, openTime: "08:00", closeTime: "18:00" },
      ]);
      expect(result).toHaveLength(7);
      expect(result[1]?.openTime).toBe("08:00");
      expect(result[5]?.openTime).toBe("09:00");
    });
  });

  describe("hasChanges", () => {
    it("returns false for identical arrays", () => {
      const hours: DayHours[] = [
        { dayOfWeek: 0, isClosed: true, openTime: null, closeTime: null },
      ];
      expect(hasChanges(hours, hours)).toBe(false);
    });

    it("returns true when isClosed changes", () => {
      const current: DayHours[] = [
        { dayOfWeek: 0, isClosed: false, openTime: "09:00", closeTime: "17:00" },
      ];
      const original: DayHours[] = [
        { dayOfWeek: 0, isClosed: true, openTime: null, closeTime: null },
      ];
      expect(hasChanges(current, original)).toBe(true);
    });

    it("returns true when times change", () => {
      const current: DayHours[] = [
        { dayOfWeek: 0, isClosed: false, openTime: "10:00", closeTime: "17:00" },
      ];
      const original: DayHours[] = [
        { dayOfWeek: 0, isClosed: false, openTime: "09:00", closeTime: "17:00" },
      ];
      expect(hasChanges(current, original)).toBe(true);
    });

    it("returns true for different length arrays", () => {
      const current: DayHours[] = [];
      const original: DayHours[] = [
        { dayOfWeek: 0, isClosed: true, openTime: null, closeTime: null },
      ];
      expect(hasChanges(current, original)).toBe(true);
    });
  });

  describe("validateAllDays", () => {
    it("returns empty map for valid hours", () => {
      const hours: DayHours[] = [
        { dayOfWeek: 0, isClosed: true, openTime: null, closeTime: null },
        { dayOfWeek: 1, isClosed: false, openTime: "09:00", closeTime: "17:00" },
      ];
      const errors = validateAllDays(hours);
      expect(errors.size).toBe(0);
    });

    it("returns errors for multiple invalid days", () => {
      const hours: DayHours[] = [
        { dayOfWeek: 0, isClosed: false, openTime: null, closeTime: null },
        { dayOfWeek: 1, isClosed: false, openTime: "17:00", closeTime: "09:00" },
      ];
      const errors = validateAllDays(hours);
      expect(errors.size).toBe(2);
      expect(errors.has(0)).toBe(true);
      expect(errors.has(1)).toBe(true);
    });
  });

  describe("preparePayload", () => {
    it("returns correct structure", () => {
      const hours: DayHours[] = [
        { dayOfWeek: 0, dayName: "Sunday", isClosed: true, openTime: null, closeTime: null },
        { dayOfWeek: 1, dayName: "Monday", isClosed: false, openTime: "09:00", closeTime: "17:00" },
      ];
      const payload = preparePayload(hours);
      expect(payload.hours).toHaveLength(2);
      expect(payload.hours[0]).toEqual({
        dayOfWeek: 0,
        isClosed: true,
        openTime: null,
        closeTime: null,
      });
      expect(payload.hours[1]).toEqual({
        dayOfWeek: 1,
        isClosed: false,
        openTime: "09:00",
        closeTime: "17:00",
      });
    });

    it("clears times for closed days", () => {
      const hours: DayHours[] = [
        { dayOfWeek: 0, isClosed: true, openTime: "09:00", closeTime: "17:00" },
      ];
      const payload = preparePayload(hours);
      expect(payload.hours[0]?.openTime).toBeNull();
      expect(payload.hours[0]?.closeTime).toBeNull();
    });

    it("strips dayName from payload", () => {
      const hours: DayHours[] = [
        { dayOfWeek: 0, dayName: "Sunday", isClosed: true, openTime: null, closeTime: null },
      ];
      const payload = preparePayload(hours);
      expect(payload.hours[0]).not.toHaveProperty("dayName");
    });
  });
});

import { describe, it, expect } from "vitest";
import {
  OrganizationHoursDaySchema,
  OrganizationHoursBulkSchema,
  normalizeHoursResponse,
  sortHoursByDay,
  DAY_NAMES,
} from "@/lib/validators/orgHours";

describe("OrganizationHoursDaySchema", () => {
  describe("valid inputs", () => {
    it("accepts a closed day with null times", () => {
      const result = OrganizationHoursDaySchema.safeParse({
        dayOfWeek: 0,
        isClosed: true,
        openTime: null,
        closeTime: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts an open day with valid times", () => {
      const result = OrganizationHoursDaySchema.safeParse({
        dayOfWeek: 1,
        isClosed: false,
        openTime: "09:00",
        closeTime: "17:00",
      });
      expect(result.success).toBe(true);
    });

    it("accepts early morning hours", () => {
      const result = OrganizationHoursDaySchema.safeParse({
        dayOfWeek: 2,
        isClosed: false,
        openTime: "00:00",
        closeTime: "06:00",
      });
      expect(result.success).toBe(true);
    });

    it("accepts late night hours", () => {
      const result = OrganizationHoursDaySchema.safeParse({
        dayOfWeek: 3,
        isClosed: false,
        openTime: "18:00",
        closeTime: "23:59",
      });
      expect(result.success).toBe(true);
    });

    it("accepts all valid day values 0-6", () => {
      for (let day = 0; day <= 6; day++) {
        const result = OrganizationHoursDaySchema.safeParse({
          dayOfWeek: day,
          isClosed: true,
          openTime: null,
          closeTime: null,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("invalid inputs", () => {
    it("rejects closed day with open time set", () => {
      const result = OrganizationHoursDaySchema.safeParse({
        dayOfWeek: 0,
        isClosed: true,
        openTime: "09:00",
        closeTime: null,
      });
      expect(result.success).toBe(false);
    });

    it("rejects closed day with close time set", () => {
      const result = OrganizationHoursDaySchema.safeParse({
        dayOfWeek: 0,
        isClosed: true,
        openTime: null,
        closeTime: "17:00",
      });
      expect(result.success).toBe(false);
    });

    it("rejects open day without open time", () => {
      const result = OrganizationHoursDaySchema.safeParse({
        dayOfWeek: 0,
        isClosed: false,
        openTime: null,
        closeTime: "17:00",
      });
      expect(result.success).toBe(false);
    });

    it("rejects open day without close time", () => {
      const result = OrganizationHoursDaySchema.safeParse({
        dayOfWeek: 0,
        isClosed: false,
        openTime: "09:00",
        closeTime: null,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid time format (single digit hour)", () => {
      const result = OrganizationHoursDaySchema.safeParse({
        dayOfWeek: 0,
        isClosed: false,
        openTime: "9:00",
        closeTime: "17:00",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid time format (no colon)", () => {
      const result = OrganizationHoursDaySchema.safeParse({
        dayOfWeek: 0,
        isClosed: false,
        openTime: "0900",
        closeTime: "1700",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid hour (25:00)", () => {
      const result = OrganizationHoursDaySchema.safeParse({
        dayOfWeek: 0,
        isClosed: false,
        openTime: "25:00",
        closeTime: "26:00",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid minutes (09:60)", () => {
      const result = OrganizationHoursDaySchema.safeParse({
        dayOfWeek: 0,
        isClosed: false,
        openTime: "09:60",
        closeTime: "17:00",
      });
      expect(result.success).toBe(false);
    });

    it("rejects open time >= close time", () => {
      const result = OrganizationHoursDaySchema.safeParse({
        dayOfWeek: 0,
        isClosed: false,
        openTime: "17:00",
        closeTime: "09:00",
      });
      expect(result.success).toBe(false);
    });

    it("rejects open time equal to close time", () => {
      const result = OrganizationHoursDaySchema.safeParse({
        dayOfWeek: 0,
        isClosed: false,
        openTime: "09:00",
        closeTime: "09:00",
      });
      expect(result.success).toBe(false);
    });

    it("rejects day of week out of range (7)", () => {
      const result = OrganizationHoursDaySchema.safeParse({
        dayOfWeek: 7,
        isClosed: true,
        openTime: null,
        closeTime: null,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative day of week", () => {
      const result = OrganizationHoursDaySchema.safeParse({
        dayOfWeek: -1,
        isClosed: true,
        openTime: null,
        closeTime: null,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("OrganizationHoursBulkSchema", () => {
  const validWeek = [
    { dayOfWeek: 0, isClosed: true, openTime: null, closeTime: null },
    { dayOfWeek: 1, isClosed: false, openTime: "09:00", closeTime: "17:00" },
    { dayOfWeek: 2, isClosed: false, openTime: "09:00", closeTime: "17:00" },
    { dayOfWeek: 3, isClosed: false, openTime: "09:00", closeTime: "17:00" },
    { dayOfWeek: 4, isClosed: false, openTime: "09:00", closeTime: "17:00" },
    { dayOfWeek: 5, isClosed: false, openTime: "09:00", closeTime: "17:00" },
    { dayOfWeek: 6, isClosed: true, openTime: null, closeTime: null },
  ];

  it("accepts valid 7-day payload", () => {
    const result = OrganizationHoursBulkSchema.safeParse(validWeek);
    expect(result.success).toBe(true);
  });

  it("accepts days in any order", () => {
    const shuffled = [...validWeek].reverse();
    const result = OrganizationHoursBulkSchema.safeParse(shuffled);
    expect(result.success).toBe(true);
  });

  it("rejects less than 7 days", () => {
    const result = OrganizationHoursBulkSchema.safeParse(validWeek.slice(0, 6));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes("exactly 7"))).toBe(true);
    }
  });

  it("rejects more than 7 days", () => {
    const result = OrganizationHoursBulkSchema.safeParse([
      ...validWeek,
      { dayOfWeek: 0, isClosed: true, openTime: null, closeTime: null },
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects duplicate days", () => {
    const duplicate = [
      ...validWeek.slice(0, 6),
      { dayOfWeek: 0, isClosed: true, openTime: null, closeTime: null },
    ];
    const result = OrganizationHoursBulkSchema.safeParse(duplicate);
    expect(result.success).toBe(false);
  });

  it("rejects missing days", () => {
    const missingDay3 = [
      { dayOfWeek: 0, isClosed: true, openTime: null, closeTime: null },
      { dayOfWeek: 1, isClosed: false, openTime: "09:00", closeTime: "17:00" },
      { dayOfWeek: 2, isClosed: false, openTime: "09:00", closeTime: "17:00" },
      { dayOfWeek: 4, isClosed: false, openTime: "09:00", closeTime: "17:00" },
      { dayOfWeek: 5, isClosed: false, openTime: "09:00", closeTime: "17:00" },
      { dayOfWeek: 6, isClosed: true, openTime: null, closeTime: null },
      { dayOfWeek: 4, isClosed: false, openTime: "09:00", closeTime: "17:00" },
    ];
    const result = OrganizationHoursBulkSchema.safeParse(missingDay3);
    expect(result.success).toBe(false);
  });
});

describe("normalizeHoursResponse", () => {
  it("returns 7 days even when DB is empty", () => {
    const result = normalizeHoursResponse([]);
    expect(result).toHaveLength(7);
    result.forEach((day, index) => {
      expect(day.dayOfWeek).toBe(index);
      expect(day.dayName).toBe(DAY_NAMES[index]);
      expect(day.isClosed).toBe(true);
      expect(day.openTime).toBeNull();
      expect(day.closeTime).toBeNull();
    });
  });

  it("fills missing days with closed defaults", () => {
    const dbRows = [
      { dayOfWeek: 1, isClosed: false, openTime: "09:00", closeTime: "17:00" },
    ];
    const result = normalizeHoursResponse(dbRows);
    expect(result).toHaveLength(7);
    expect(result[1]?.isClosed).toBe(false);
    expect(result[1]?.openTime).toBe("09:00");
    expect(result[0]?.isClosed).toBe(true);
    expect(result[6]?.isClosed).toBe(true);
  });

  it("preserves existing DB data", () => {
    const dbRows = [
      { dayOfWeek: 0, isClosed: false, openTime: "10:00", closeTime: "18:00" },
      { dayOfWeek: 1, isClosed: true, openTime: null, closeTime: null },
    ];
    const result = normalizeHoursResponse(dbRows);
    expect(result[0]?.openTime).toBe("10:00");
    expect(result[0]?.closeTime).toBe("18:00");
    expect(result[1]?.isClosed).toBe(true);
  });

  it("includes correct day names", () => {
    const result = normalizeHoursResponse([]);
    expect(result[0]?.dayName).toBe("Sunday");
    expect(result[1]?.dayName).toBe("Monday");
    expect(result[6]?.dayName).toBe("Saturday");
  });
});

describe("sortHoursByDay", () => {
  it("sorts hours by dayOfWeek ascending", () => {
    const unsorted = [
      { dayOfWeek: 6, isClosed: true, openTime: null, closeTime: null },
      { dayOfWeek: 0, isClosed: true, openTime: null, closeTime: null },
      { dayOfWeek: 3, isClosed: false, openTime: "09:00", closeTime: "17:00" },
    ];
    const sorted = sortHoursByDay(unsorted);
    expect(sorted[0]?.dayOfWeek).toBe(0);
    expect(sorted[1]?.dayOfWeek).toBe(3);
    expect(sorted[2]?.dayOfWeek).toBe(6);
  });

  it("does not mutate original array", () => {
    const original = [
      { dayOfWeek: 6, isClosed: true, openTime: null, closeTime: null },
      { dayOfWeek: 0, isClosed: true, openTime: null, closeTime: null },
    ];
    sortHoursByDay(original);
    expect(original[0]?.dayOfWeek).toBe(6);
  });
});

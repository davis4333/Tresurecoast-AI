export type DayHours = {
  dayOfWeek: number;
  dayName?: string;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
};

export type DayError = {
  openTime?: string;
  closeTime?: string;
  general?: string;
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function dayLabel(dayOfWeek: number): string {
  if (dayOfWeek < 0 || dayOfWeek > 6) {
    return "Unknown";
  }
  return DAY_NAMES[dayOfWeek] ?? "Unknown";
}

export function isValidTime(time: string): boolean {
  if (!time || typeof time !== "string") return false;
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(time);
}

export function compareTimes(openTime: string, closeTime: string): number {
  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);
  
  const openMinutes = (openH ?? 0) * 60 + (openM ?? 0);
  const closeMinutes = (closeH ?? 0) * 60 + (closeM ?? 0);
  
  return openMinutes - closeMinutes;
}

export function validateDayRow(day: DayHours): DayError | null {
  const errors: DayError = {};
  
  if (day.isClosed) {
    if (day.openTime || day.closeTime) {
      errors.general = "Closed days should not have times set";
    }
    return Object.keys(errors).length > 0 ? errors : null;
  }
  
  if (!day.openTime) {
    errors.openTime = "Open time required";
  } else if (!isValidTime(day.openTime)) {
    errors.openTime = "Invalid time format (use HH:MM)";
  }
  
  if (!day.closeTime) {
    errors.closeTime = "Close time required";
  } else if (!isValidTime(day.closeTime)) {
    errors.closeTime = "Invalid time format (use HH:MM)";
  }
  
  if (day.openTime && day.closeTime && isValidTime(day.openTime) && isValidTime(day.closeTime)) {
    if (compareTimes(day.openTime, day.closeTime) >= 0) {
      errors.closeTime = "Close time must be after open time";
    }
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
}

export function normalizeHours(hoursFromApi: DayHours[]): DayHours[] {
  const result: DayHours[] = [];
  
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    const existing = hoursFromApi.find((h) => h.dayOfWeek === dayOfWeek);
    if (existing) {
      result.push({
        dayOfWeek,
        dayName: dayLabel(dayOfWeek),
        isClosed: existing.isClosed,
        openTime: existing.openTime,
        closeTime: existing.closeTime,
      });
    } else {
      result.push({
        dayOfWeek,
        dayName: dayLabel(dayOfWeek),
        isClosed: true,
        openTime: null,
        closeTime: null,
      });
    }
  }
  
  return result;
}

export function hasChanges(current: DayHours[], original: DayHours[]): boolean {
  if (current.length !== original.length) return true;
  
  for (let i = 0; i < current.length; i++) {
    const c = current[i];
    const o = original[i];
    if (!c || !o) return true;
    
    if (
      c.dayOfWeek !== o.dayOfWeek ||
      c.isClosed !== o.isClosed ||
      c.openTime !== o.openTime ||
      c.closeTime !== o.closeTime
    ) {
      return true;
    }
  }
  
  return false;
}

export function validateAllDays(hours: DayHours[]): Map<number, DayError> {
  const errors = new Map<number, DayError>();
  
  for (const day of hours) {
    const dayError = validateDayRow(day);
    if (dayError) {
      errors.set(day.dayOfWeek, dayError);
    }
  }
  
  return errors;
}

export function preparePayload(hours: DayHours[]): { hours: Array<{ dayOfWeek: number; isClosed: boolean; openTime: string | null; closeTime: string | null }> } {
  return {
    hours: hours.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      isClosed: day.isClosed,
      openTime: day.isClosed ? null : day.openTime,
      closeTime: day.isClosed ? null : day.closeTime,
    })),
  };
}

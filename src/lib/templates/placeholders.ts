export interface PlaceholderValues {
  BusinessName?: string;
  Category?: string;
  Phone?: string;
  Address?: string;
  Hours?: string;
  Website?: string;
  BookingUrl?: string;
  PaymentsUrl?: string;
  ServiceArea?: string;
}

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

export function replacePlaceholders(
  template: string,
  values: PlaceholderValues
): string {
  let result = template.replace(PLACEHOLDER_PATTERN, (match, key) => {
    const value = values[key as keyof PlaceholderValues];
    return value?.trim() || "";
  });

  result = result
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("-") || trimmed.startsWith("•")) {
        const content = trimmed.slice(1).trim();
        return content.length > 0 && content !== ":" && !content.match(/^:\s*$/);
      }
      return true;
    })
    .join("\n");

  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

export function buildPlaceholderValues(data: {
  businessName?: string;
  category?: string;
  phone?: string;
  address?: string;
  hours?: string;
  websiteUrl?: string;
  bookingUrl?: string;
  paymentsUrl?: string;
  serviceArea?: string;
}): PlaceholderValues {
  return {
    BusinessName: data.businessName,
    Category: data.category,
    Phone: data.phone,
    Address: data.address,
    Hours: data.hours,
    Website: data.websiteUrl,
    BookingUrl: data.bookingUrl,
    PaymentsUrl: data.paymentsUrl,
    ServiceArea: data.serviceArea,
  };
}

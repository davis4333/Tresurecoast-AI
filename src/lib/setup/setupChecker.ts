export interface SetupCheckItem {
  id: string;
  label: string;
  completed: boolean;
  priority: "critical" | "high" | "medium" | "low";
  actionPath: string;
  actionLabel: string;
  category: "basics" | "content" | "engagement" | "advanced";
}

export interface SetupStatus {
  completedItems: number;
  totalItems: number;
  percentComplete: number;
  items: SetupCheckItem[];
  nextAction: SetupCheckItem | null;
  tier: "getting-started" | "configured" | "optimized" | "expert";
}

interface BotData {
  name: string;
  greeting: string | null;
  fallbackText: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
  hours: unknown;
  services: unknown;
  bookingUrl: string | null;
  industryTemplate: string | null;
}

interface BusinessProfileData {
  phone: string | null;
  address: string | null;
  serviceArea: string | null;
  cancellationPolicy: string | null;
  bookingUrl: string | null;
}

interface OrgData {
  notificationEnabled: boolean;
  notificationEmails: string[];
  customBranding: unknown;
  allowedDomains: string[];
}

interface KBData {
  totalArticles: number;
  publishedArticles: number;
}

export interface SetupInput {
  bot: BotData | null;
  businessProfile: BusinessProfileData | null;
  org: OrgData;
  kb: KBData;
  hasLeads: boolean;
}

function parseHours(hours: unknown): Record<string, unknown> | null {
  if (!hours) return null;
  if (typeof hours === "object" && hours !== null) {
    return hours as Record<string, unknown>;
  }
  if (typeof hours === "string") {
    try {
      return JSON.parse(hours);
    } catch {
      return null;
    }
  }
  return null;
}

function parseServices(services: unknown): unknown[] {
  if (!services) return [];
  if (Array.isArray(services)) return services;
  if (typeof services === "string") {
    try {
      const parsed = JSON.parse(services);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function hasValidHours(hours: unknown): boolean {
  const parsed = parseHours(hours);
  if (!parsed) return false;
  const daysWithHours = Object.values(parsed).filter(
    (v) =>
      v !== null &&
      typeof v === "object" &&
      "open" in (v as Record<string, unknown>) &&
      "close" in (v as Record<string, unknown>)
  );
  return daysWithHours.length >= 1;
}

function hasValidServices(services: unknown): boolean {
  const parsed = parseServices(services);
  return parsed.length >= 1;
}

export function evaluateSetup(input: SetupInput): SetupStatus {
  const items: SetupCheckItem[] = [];

  items.push({
    id: "bot-created",
    label: "Create your first bot",
    completed: input.bot !== null,
    priority: "critical",
    actionPath: "/app/bots/new",
    actionLabel: "Create Bot",
    category: "basics",
  });

  items.push({
    id: "greeting-set",
    label: "Set a custom greeting message",
    completed: Boolean(input.bot?.greeting && input.bot.greeting.length > 10),
    priority: "critical",
    actionPath: "/app/bots",
    actionLabel: "Edit Greeting",
    category: "basics",
  });

  items.push({
    id: "business-phone",
    label: "Add your business phone number",
    completed: Boolean(
      input.bot?.businessPhone || input.businessProfile?.phone
    ),
    priority: "high",
    actionPath: "/app/settings/business",
    actionLabel: "Add Phone",
    category: "basics",
  });

  items.push({
    id: "business-address",
    label: "Add your business address",
    completed: Boolean(
      input.bot?.businessAddress || input.businessProfile?.address
    ),
    priority: "high",
    actionPath: "/app/settings/business",
    actionLabel: "Add Address",
    category: "basics",
  });

  items.push({
    id: "services-added",
    label: "Add at least one service",
    completed: hasValidServices(input.bot?.services),
    priority: "critical",
    actionPath: "/app/settings/services",
    actionLabel: "Add Services",
    category: "content",
  });

  items.push({
    id: "hours-set",
    label: "Set your business hours",
    completed: hasValidHours(input.bot?.hours),
    priority: "high",
    actionPath: "/app/settings/hours",
    actionLabel: "Set Hours",
    category: "content",
  });

  items.push({
    id: "booking-url",
    label: "Add a booking link",
    completed: Boolean(
      input.bot?.bookingUrl || input.businessProfile?.bookingUrl
    ),
    priority: "high",
    actionPath: "/app/settings/business",
    actionLabel: "Add Booking Link",
    category: "engagement",
  });

  items.push({
    id: "fallback-text",
    label: "Customize fallback response",
    completed: Boolean(
      input.bot?.fallbackText && input.bot.fallbackText.length > 10
    ),
    priority: "medium",
    actionPath: "/app/bots",
    actionLabel: "Edit Fallback",
    category: "content",
  });

  items.push({
    id: "kb-articles",
    label: "Add knowledge base content",
    completed: input.kb.publishedArticles >= 1,
    priority: "high",
    actionPath: "/app/kb",
    actionLabel: "Add KB Article",
    category: "content",
  });

  items.push({
    id: "notifications-enabled",
    label: "Enable lead notifications",
    completed:
      input.org.notificationEnabled && input.org.notificationEmails.length > 0,
    priority: "high",
    actionPath: "/app/settings/notifications",
    actionLabel: "Enable Notifications",
    category: "engagement",
  });

  items.push({
    id: "domain-allowlist",
    label: "Set allowed embed domains",
    completed: input.org.allowedDomains.length > 0,
    priority: "medium",
    actionPath: "/app/settings",
    actionLabel: "Add Domains",
    category: "advanced",
  });

  items.push({
    id: "policies-set",
    label: "Add cancellation/deposit policies",
    completed: Boolean(
      input.businessProfile?.cancellationPolicy ||
        input.businessProfile?.serviceArea
    ),
    priority: "low",
    actionPath: "/app/settings/business",
    actionLabel: "Add Policies",
    category: "advanced",
  });

  const completedItems = items.filter((i) => i.completed).length;
  const totalItems = items.length;
  const percentComplete = Math.round((completedItems / totalItems) * 100);

  const priorityOrder: Record<SetupCheckItem["priority"], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  const incompleteItems = items
    .filter((i) => !i.completed)
    .sort((a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99));
  const nextAction: SetupCheckItem | null = incompleteItems[0] ?? null;

  let tier: SetupStatus["tier"];
  if (percentComplete < 40) {
    tier = "getting-started";
  } else if (percentComplete < 70) {
    tier = "configured";
  } else if (percentComplete < 100) {
    tier = "optimized";
  } else {
    tier = "expert";
  }

  return {
    completedItems,
    totalItems,
    percentComplete,
    items,
    nextAction,
    tier,
  };
}

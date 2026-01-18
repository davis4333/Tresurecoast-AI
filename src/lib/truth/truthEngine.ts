import { detectTopics, hasHighIntent, type Topic } from "@/lib/public/topicDetect";

export interface BotService {
  name: string;
  description?: string;
  priceRange?: string;
  durationMins?: number;
  active?: boolean;
}

export interface BotHours {
  [day: string]: {
    open?: string;
    close?: string;
    closed?: boolean;
  };
}

export interface BotLinkData {
  type: "BOOKING" | "PAYMENT" | "CONTACT" | "OTHER";
  label: string;
  url: string;
}

export interface TruthEngineInput {
  userMessage: string;
  bot: {
    name: string;
    greeting: string | null;
    fallbackText: string | null;
    businessPhone: string | null;
    businessEmail: string | null;
    businessAddress: string | null;
    hours: unknown;
    services: unknown;
    links: BotLinkData[];
  };
}

export interface TruthEngineOutput {
  reply: string;
  leadCaptureRequested: boolean;
  externalRedirectUrl: string | null;
  sourcedFrom: string[];
  missingData: boolean;
  missingDataTopics: string[];
}

function parseServices(raw: unknown): BotService[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter(
    (s): s is BotService =>
      typeof s === "object" && s !== null && typeof s.name === "string"
  );
}

function parseHours(raw: unknown): BotHours | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as BotHours;
}

function getDayName(): string {
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return days[new Date().getDay()] ?? "mon";
}

function formatServices(services: BotService[]): string {
  const active = services.filter((s) => s.active !== false);
  if (active.length === 0) return "";

  const lines = active.map((s) => {
    let line = `- ${s.name}`;
    if (s.priceRange) line += ` (${s.priceRange})`;
    if (s.description) line += `: ${s.description}`;
    return line;
  });

  return lines.join("\n");
}

function formatHoursForDay(hours: BotHours, day: string): string | null {
  const dayData = hours[day];
  if (!dayData) return null;

  if (dayData.closed) {
    return `We are closed on ${day}.`;
  }

  if (dayData.open && dayData.close) {
    return `We are open ${dayData.open} to ${dayData.close} on ${day}.`;
  }

  return null;
}

function findLink(links: BotLinkData[], type: "BOOKING" | "PAYMENT"): BotLinkData | null {
  return links.find((l) => l.type === type) ?? null;
}

export function runTruthEngine(input: TruthEngineInput): TruthEngineOutput {
  const { userMessage, bot } = input;
  const topics = detectTopics(userMessage);
  const services = parseServices(bot.services);
  const hours = parseHours(bot.hours);

  const sourcedFrom: string[] = [];
  const missingDataTopics: string[] = [];
  let reply = "";
  let externalRedirectUrl: string | null = null;
  let missingData = false;

  for (const topic of topics) {
    switch (topic) {
      case "SERVICES": {
        if (services.length > 0) {
          const formatted = formatServices(services);
          if (formatted) {
            reply = `Here are the services we offer:\n${formatted}`;
            sourcedFrom.push("services");
          } else {
            missingData = true;
            missingDataTopics.push("SERVICES");
          }
        } else {
          missingData = true;
          missingDataTopics.push("SERVICES");
        }
        break;
      }

      case "PRICING": {
        const withPrices = services.filter((s) => s.priceRange && s.active !== false);
        if (withPrices.length > 0) {
          const lines = withPrices.map((s) => `- ${s.name}: ${s.priceRange}`);
          reply = `Here's our pricing:\n${lines.join("\n")}`;
          sourcedFrom.push("services");
        } else {
          missingData = true;
          missingDataTopics.push("PRICING");
        }
        break;
      }

      case "HOURS": {
        if (hours) {
          const today = getDayName();
          const dayMatch = userMessage.toLowerCase().match(
            /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/
          );
          const targetDay = dayMatch ? dayMatch[0].slice(0, 3) : today;
          const formatted = formatHoursForDay(hours, targetDay);
          if (formatted) {
            reply = formatted;
            sourcedFrom.push("hours");
          } else {
            const allHours = Object.entries(hours)
              .map(([d, h]) => {
                if (h.closed) return `${d}: Closed`;
                if (h.open && h.close) return `${d}: ${h.open} - ${h.close}`;
                return null;
              })
              .filter(Boolean);
            if (allHours.length > 0) {
              reply = `Our hours:\n${allHours.join("\n")}`;
              sourcedFrom.push("hours");
            } else {
              missingData = true;
              missingDataTopics.push("HOURS");
            }
          }
        } else {
          missingData = true;
          missingDataTopics.push("HOURS");
        }
        break;
      }

      case "LOCATION": {
        if (bot.businessAddress) {
          reply = `We're located at: ${bot.businessAddress}`;
          sourcedFrom.push("businessAddress");
        } else {
          missingData = true;
          missingDataTopics.push("LOCATION");
        }
        break;
      }

      case "CONTACT": {
        const parts: string[] = [];
        if (bot.businessPhone) {
          parts.push(`Phone: ${bot.businessPhone}`);
          sourcedFrom.push("businessPhone");
        }
        if (bot.businessEmail) {
          parts.push(`Email: ${bot.businessEmail}`);
          sourcedFrom.push("businessEmail");
        }
        if (parts.length > 0) {
          reply = `You can reach us at:\n${parts.join("\n")}`;
        } else {
          missingData = true;
          missingDataTopics.push("CONTACT");
        }
        break;
      }

      case "BOOKING": {
        const bookingLink = findLink(bot.links, "BOOKING");
        if (bookingLink) {
          reply = `Here's the booking link: ${bookingLink.url}`;
          externalRedirectUrl = bookingLink.url;
          sourcedFrom.push("links:BOOKING");
        } else {
          missingData = true;
          missingDataTopics.push("BOOKING");
        }
        break;
      }

      case "PAYMENT": {
        const paymentLink = findLink(bot.links, "PAYMENT");
        if (paymentLink) {
          reply = `Here's the payment link: ${paymentLink.url}`;
          externalRedirectUrl = paymentLink.url;
          sourcedFrom.push("links:PAYMENT");
        } else {
          missingData = true;
          missingDataTopics.push("PAYMENT");
        }
        break;
      }

      case "OTHER":
      default: {
        break;
      }
    }

    if (reply) break;
  }

  if (!reply && !missingData) {
    missingData = true;
    missingDataTopics.push("OTHER");
  }

  if (missingData && !reply) {
    const contactInfo: string[] = [];
    if (bot.businessPhone) contactInfo.push(`phone: ${bot.businessPhone}`);
    if (bot.businessEmail) contactInfo.push(`email: ${bot.businessEmail}`);

    if (contactInfo.length > 0) {
      reply =
        bot.fallbackText ||
        `I don't have that information in my system. Please contact us at ${contactInfo.join(" or ")}.`;
      sourcedFrom.push(...(bot.businessPhone ? ["businessPhone"] : []));
      sourcedFrom.push(...(bot.businessEmail ? ["businessEmail"] : []));
    } else {
      reply =
        bot.fallbackText ||
        "I don't have that information in my system right now. Would you like to leave your contact info so someone can follow up?";
    }
  }

  const leadCaptureRequested = missingData && hasHighIntent(userMessage);

  if (reply.length > 500) {
    reply = reply.slice(0, 497) + "...";
  }

  return {
    reply,
    leadCaptureRequested,
    externalRedirectUrl,
    sourcedFrom: [...new Set(sourcedFrom)],
    missingData,
    missingDataTopics: [...new Set(missingDataTopics)],
  };
}

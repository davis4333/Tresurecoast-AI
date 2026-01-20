import { detectTopic, hasHighIntent } from "@/lib/public/topicDetect";
import type { TruthResult, TruthIntent, Topic, SuggestedAction } from "./types";

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

export interface BusinessPolicies {
  cancellationPolicy: string | null;
  depositPolicy: string | null;
  refundPolicy: string | null;
  serviceArea: string | null;
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
  policies?: BusinessPolicies;
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

function formatContactInfo(bot: TruthEngineInput["bot"]): string {
  const parts: string[] = [];
  if (bot.businessPhone) parts.push(`Phone: ${bot.businessPhone}`);
  if (bot.businessEmail) parts.push(`Email: ${bot.businessEmail}`);
  return parts.join(" | ");
}

export function runTruthEngine(input: TruthEngineInput): TruthResult {
  const { userMessage, bot } = input;
  const topicResult = detectTopic(userMessage);
  const topic = topicResult.topic;
  const services = parseServices(bot.services);
  const hours = parseHours(bot.hours);

  const sourcedFrom: string[] = [];
  const missingFields: string[] = [];
  const suggestedActions: SuggestedAction[] = [];
  let reply = "";
  let intent: TruthIntent = "ANSWERED_FROM_PROFILE";
  let confidence = topicResult.confidence;
  let requiresLeadCapture = false;

  switch (topic) {
    case "SERVICES": {
      if (services.length > 0) {
        const formatted = formatServices(services);
        if (formatted) {
          reply = `Here are the services we offer:\n${formatted}`;
          sourcedFrom.push("services");
          intent = "ANSWERED_FROM_PROFILE";
        } else {
          missingFields.push("services");
        }
      } else {
        missingFields.push("services");
      }
      break;
    }

    case "PRICING": {
      const withPrices = services.filter((s) => s.priceRange && s.active !== false);
      if (withPrices.length > 0) {
        const lines = withPrices.map((s) => `- ${s.name}: ${s.priceRange}`);
        reply = `Here's our pricing:\n${lines.join("\n")}`;
        sourcedFrom.push("services");
        intent = "ANSWERED_FROM_PROFILE";
      } else {
        missingFields.push("pricing");
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
          intent = "ANSWERED_FROM_PROFILE";
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
            intent = "ANSWERED_FROM_PROFILE";
          } else {
            missingFields.push("hours");
          }
        }
      } else {
        missingFields.push("hours");
      }
      break;
    }

    case "LOCATION": {
      const parts: string[] = [];
      if (bot.businessAddress) {
        parts.push(`We're located at: ${bot.businessAddress}`);
        sourcedFrom.push("businessAddress");
      }
      if (input.policies?.serviceArea) {
        parts.push(`Service area: ${input.policies.serviceArea}`);
        sourcedFrom.push("serviceArea");
      }
      if (parts.length > 0) {
        reply = parts.join("\n\n");
        intent = "ANSWERED_FROM_PROFILE";
      } else {
        missingFields.push("businessAddress");
        missingFields.push("serviceArea");
      }
      break;
    }

    case "CONTACT": {
      const contactInfo = formatContactInfo(bot);
      if (contactInfo) {
        reply = `You can reach us at:\n${contactInfo}`;
        if (bot.businessPhone) sourcedFrom.push("businessPhone");
        if (bot.businessEmail) sourcedFrom.push("businessEmail");
        intent = "ANSWERED_FROM_PROFILE";
        suggestedActions.push({
          type: "CONTACT",
          label: "Contact the team",
        });
      } else {
        missingFields.push("contact");
      }
      break;
    }

    case "BOOKING": {
      const bookingLink = findLink(bot.links, "BOOKING");
      if (bookingLink) {
        reply = `You can book here: ${bookingLink.url}\n\nIf you'd like, I can also take your details and have the team confirm availability.`;
        sourcedFrom.push("links[BOOKING]");
        intent = "BOOK_OR_PAY_REDIRECT";
        suggestedActions.push({
          type: "BOOK",
          url: bookingLink.url,
          label: bookingLink.label || "Book Now",
        });
        requiresLeadCapture = true;
      } else {
        missingFields.push("links[BOOKING]");
        requiresLeadCapture = true;
        const contactInfo = formatContactInfo(bot);
        reply = `I don't have a booking link in my system yet.${contactInfo ? `\n\n${contactInfo}` : ""}\n\nIf you want, leave your name + best contact and what you're trying to book — the team will follow up.`;
        intent = "MISSING_DATA";
        if (contactInfo) {
          suggestedActions.push({
            type: "CONTACT",
            label: "Contact the team",
          });
        }
      }
      break;
    }

    case "PAYMENT": {
      const paymentLink = findLink(bot.links, "PAYMENT");
      if (paymentLink) {
        reply = `You can pay here: ${paymentLink.url}\n\nIf you want, tell me what service you're paying for and I'll pass it to the team.`;
        sourcedFrom.push("links[PAYMENT]");
        intent = "BOOK_OR_PAY_REDIRECT";
        suggestedActions.push({
          type: "PAY",
          url: paymentLink.url,
          label: paymentLink.label || "Pay Now",
        });
        requiresLeadCapture = true;
      } else {
        missingFields.push("links[PAYMENT]");
        requiresLeadCapture = true;
        const contactInfo = formatContactInfo(bot);
        reply = `I don't have a payment link in my system yet.${contactInfo ? `\n\n${contactInfo}` : ""}\n\nLeave your name + contact info and what you're paying for — the team will follow up.`;
        intent = "MISSING_DATA";
        if (contactInfo) {
          suggestedActions.push({
            type: "CONTACT",
            label: "Contact the team",
          });
        }
      }
      break;
    }

    case "POLICIES": {
      const policies = input.policies;
      const policyParts: string[] = [];

      const lowerMsg = userMessage.toLowerCase();
      const asksCancellation = lowerMsg.includes("cancel");
      const asksDeposit = lowerMsg.includes("deposit");
      const asksRefund = lowerMsg.includes("refund") || lowerMsg.includes("money back");

      if (asksCancellation && policies?.cancellationPolicy) {
        policyParts.push(`**Cancellation Policy:** ${policies.cancellationPolicy}`);
        sourcedFrom.push("cancellationPolicy");
      } else if (asksCancellation) {
        missingFields.push("cancellationPolicy");
      }

      if (asksDeposit && policies?.depositPolicy) {
        policyParts.push(`**Deposit Policy:** ${policies.depositPolicy}`);
        sourcedFrom.push("depositPolicy");
      } else if (asksDeposit) {
        missingFields.push("depositPolicy");
      }

      if (asksRefund && policies?.refundPolicy) {
        policyParts.push(`**Refund Policy:** ${policies.refundPolicy}`);
        sourcedFrom.push("refundPolicy");
      } else if (asksRefund) {
        missingFields.push("refundPolicy");
      }

      if (!asksCancellation && !asksDeposit && !asksRefund) {
        if (policies?.cancellationPolicy) {
          policyParts.push(`**Cancellation Policy:** ${policies.cancellationPolicy}`);
          sourcedFrom.push("cancellationPolicy");
        }
        if (policies?.depositPolicy) {
          policyParts.push(`**Deposit Policy:** ${policies.depositPolicy}`);
          sourcedFrom.push("depositPolicy");
        }
        if (policies?.refundPolicy) {
          policyParts.push(`**Refund Policy:** ${policies.refundPolicy}`);
          sourcedFrom.push("refundPolicy");
        }
      }

      if (policyParts.length > 0) {
        reply = policyParts.join("\n\n");
        intent = "ANSWERED_FROM_PROFILE";
      } else {
        if (!policies?.cancellationPolicy) missingFields.push("cancellationPolicy");
        if (!policies?.depositPolicy) missingFields.push("depositPolicy");
        if (!policies?.refundPolicy) missingFields.push("refundPolicy");
      }
      break;
    }

    case "GENERAL":
    default: {
      break;
    }
  }

  if (!reply && missingFields.length > 0) {
    intent = "MISSING_DATA";
    const contactInfo = formatContactInfo(bot);
    if (contactInfo) {
      reply =
        bot.fallbackText ||
        `I don't have that information in my system. Please contact us at ${contactInfo}.`;
      if (bot.businessPhone) sourcedFrom.push("businessPhone");
      if (bot.businessEmail) sourcedFrom.push("businessEmail");
      suggestedActions.push({
        type: "CONTACT",
        label: "Contact the team",
      });
    } else {
      reply =
        bot.fallbackText ||
        "I'm not 100% sure from the info I have. Want to leave your name and number so the team can follow up?";
    }

    if (hasHighIntent(userMessage)) {
      requiresLeadCapture = true;
      intent = "LEAD_CAPTURE";
    }
  }

  if (!reply) {
    reply =
      bot.fallbackText ||
      "I'm not 100% sure from the info I have. Want to leave your name and number so the team can follow up?";
    intent = "MISSING_DATA";
    missingFields.push("general");
  }

  if (reply.length > 500) {
    reply = reply.slice(0, 497) + "...";
  }

  return {
    reply,
    intent,
    confidence,
    sourcedFrom: [...new Set(sourcedFrom)],
    requiresLeadCapture,
    missingFields: [...new Set(missingFields)],
    topic,
    suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
  };
}

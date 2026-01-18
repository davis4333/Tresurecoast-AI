import { LeadScoreInput, LeadScoreResult } from "@/lib/leads/scoreSchemas";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function scoreLead(input: LeadScoreInput): LeadScoreResult {
  const reasons: string[] = [];
  let score = 0;

  const name = (input.lead.name || "").trim();
  const email = (input.lead.email || "").trim();
  const phone = (input.lead.phone || "").trim();
  const service = (input.lead.service || "").trim();
  const preferredTime = (input.lead.preferredTime || "").trim();
  const message = (input.lead.message || "").trim();

  if (name) {
    score += 10;
    reasons.push("Has name (+10)");
  }
  if (email) {
    score += 15;
    reasons.push("Has email (+15)");
  }
  if (phone) {
    score += 20;
    reasons.push("Has phone (+20)");
  }

  if (service) {
    score += 15;
    reasons.push("Specified service (+15)");
  }
  if (preferredTime) {
    score += 10;
    reasons.push("Provided preferred time/date (+10)");
  }
  if (message.length >= 20) {
    score += 10;
    reasons.push("Provided details in message (+10)");
  } else if (message.length > 0) {
    score += 5;
    reasons.push("Provided short message (+5)");
  }

  const topic = input.signals?.topic;
  const requiresLeadCapture = input.signals?.requiresLeadCapture;
  const missingFields = input.signals?.missingFields || [];
  const suggestedActions = input.signals?.suggestedActions || [];

  if (topic === "BOOKING" || topic === "PAYMENT") {
    score += 15;
    reasons.push("High intent topic (booking/payment) (+15)");
  }
  if (topic === "PRICING") {
    score += 10;
    reasons.push("Pricing intent (+10)");
  }

  if (suggestedActions.some((a) => a.type === "BOOK" || a.type === "PAY")) {
    score += 10;
    reasons.push("Actionable CTA suggested (book/pay) (+10)");
  }

  if (requiresLeadCapture) {
    score += 5;
    reasons.push("Lead capture was triggered (+5)");
  }

  if (missingFields.length >= 2) {
    score -= 5;
    reasons.push("Multiple missing business fields (-5)");
  }

  score = clamp(score, 0, 100);

  let temperature: LeadScoreResult["temperature"] = "COLD";
  if (score >= 70) temperature = "HOT";
  else if (score >= 40) temperature = "WARM";

  reasons.push(`Final score: ${score} (${temperature})`);

  return { score, temperature, reasons };
}

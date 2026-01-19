import type { OnboardingFormData, BrandVoice, PrimaryGoal } from "./schemas";

export interface BotBlueprint {
  botName: string;
  greeting: string;
  fallbackText: string;
  systemPrompt: string;
  leadCaptureDefaults: {
    fields: string[];
    promptText: string;
  };
  recommendedFAQs: string[];
}

const VOICE_STYLES: Record<BrandVoice, { tone: string; adjectives: string }> = {
  professional: {
    tone: "formal and professional",
    adjectives: "knowledgeable, respectful, and precise",
  },
  friendly: {
    tone: "warm and approachable",
    adjectives: "helpful, cheerful, and conversational",
  },
  luxury: {
    tone: "elegant and sophisticated",
    adjectives: "refined, exclusive, and attentive",
  },
  bold: {
    tone: "confident and energetic",
    adjectives: "direct, enthusiastic, and dynamic",
  },
  chill: {
    tone: "relaxed and casual",
    adjectives: "easygoing, friendly, and laid-back",
  },
};

const GOAL_FOCUS: Record<PrimaryGoal, { objective: string; cta: string }> = {
  bookings: {
    objective: "help visitors book appointments or services",
    cta: "Would you like to schedule an appointment?",
  },
  leads: {
    objective: "capture contact information from interested visitors",
    cta: "I'd love to have someone follow up with you. May I get your contact info?",
  },
  faqs: {
    objective: "answer common questions about the business",
    cta: "Is there anything else you'd like to know?",
  },
  support: {
    objective: "provide helpful support and resolve visitor questions",
    cta: "How else can I assist you today?",
  },
};

export function buildBotBlueprint(input: OnboardingFormData): BotBlueprint {
  const { businessName, category, brandVoice, primaryGoal } = input;

  const voice = VOICE_STYLES[brandVoice];
  const goal = GOAL_FOCUS[primaryGoal];

  const botName = `${businessName} Assistant`;

  const greeting = buildGreeting(businessName, brandVoice);

  const fallbackText = buildFallback(businessName, brandVoice);

  const systemPrompt = buildSystemPrompt(input, voice, goal);

  const leadCaptureDefaults = {
    fields: ["name", "email", "phone"],
    promptText: buildLeadCapturePrompt(brandVoice),
  };

  const recommendedFAQs = buildRecommendedFAQs(category, primaryGoal);

  return {
    botName,
    greeting,
    fallbackText,
    systemPrompt,
    leadCaptureDefaults,
    recommendedFAQs,
  };
}

function buildGreeting(businessName: string, voice: BrandVoice): string {
  switch (voice) {
    case "professional":
      return `Welcome to ${businessName}. How may I assist you today?`;
    case "friendly":
      return `Hi there! Welcome to ${businessName}. How can I help you today?`;
    case "luxury":
      return `Welcome to ${businessName}. It's our pleasure to assist you. How may I be of service?`;
    case "bold":
      return `Hey! Welcome to ${businessName}. What can I help you with today?`;
    case "chill":
      return `Hey, welcome to ${businessName}! What's on your mind?`;
    default:
      return `Welcome to ${businessName}. How can I help you?`;
  }
}

function buildFallback(businessName: string, voice: BrandVoice): string {
  switch (voice) {
    case "professional":
      return `I don't have that information right now. Would you like me to connect you with our team at ${businessName}?`;
    case "friendly":
      return `Hmm, I'm not sure about that one! Let me get someone from ${businessName} to help you out.`;
    case "luxury":
      return `I want to ensure you receive the most accurate information. Allow me to connect you with our concierge team.`;
    case "bold":
      return `Great question! I don't have that answer yet, but let's get you connected with someone who does.`;
    case "chill":
      return `Not totally sure on that one. Want me to have someone from the team reach out?`;
    default:
      return `I don't have that information. Would you like to speak with someone from ${businessName}?`;
  }
}

function buildSystemPrompt(
  input: OnboardingFormData,
  voice: { tone: string; adjectives: string },
  goal: { objective: string; cta: string }
): string {
  const { businessName, category, websiteUrl, bookingUrl, phone, address, hours } = input;

  const parts: string[] = [
    `You are the AI assistant for ${businessName}, a ${category} business.`,
    `Your communication style is ${voice.tone}. You are ${voice.adjectives}.`,
    "",
    "CORE RULES (TRUTH MODE):",
    "1. Only answer questions using the verified business information provided below.",
    "2. If you don't have the information, say so honestly and offer to capture the visitor's contact info for follow-up.",
    "3. Never make up information about services, pricing, hours, or policies.",
    "4. Always be helpful and guide visitors toward their goals.",
    "",
    `PRIMARY OBJECTIVE: ${goal.objective}`,
    "",
    "BUSINESS INFORMATION:",
  ];

  if (phone) parts.push(`- Phone: ${phone}`);
  if (address) parts.push(`- Address: ${address}`);
  if (hours) parts.push(`- Hours: ${hours}`);
  if (websiteUrl) parts.push(`- Website: ${websiteUrl}`);
  if (bookingUrl) parts.push(`- Booking: ${bookingUrl}`);

  parts.push("");
  parts.push("LEAD CAPTURE:");
  parts.push("When a visitor shows interest in booking, getting a quote, or learning more:");
  parts.push("1. Politely offer to collect their contact information");
  parts.push("2. Ask for name, email, and phone (any combination is acceptable)");
  parts.push("3. Thank them and confirm someone will follow up");
  parts.push("");
  parts.push(`CLOSING: ${goal.cta}`);

  return parts.join("\n");
}

function buildLeadCapturePrompt(voice: BrandVoice): string {
  switch (voice) {
    case "professional":
      return "I'd be happy to have our team follow up with you. May I have your name, email, and phone number?";
    case "friendly":
      return "Awesome! I can have someone reach out to you. What's your name, email, and phone number?";
    case "luxury":
      return "It would be our pleasure to have a specialist contact you. May I have your preferred contact details?";
    case "bold":
      return "Let's make this happen! Drop your name, email, and phone and we'll be in touch.";
    case "chill":
      return "Cool, I'll get someone to reach out. What's your name and best way to contact you?";
    default:
      return "I can have someone follow up with you. What's your name, email, and phone?";
  }
}

function buildRecommendedFAQs(category: string, goal: PrimaryGoal): string[] {
  const baseFAQs = [
    `What services does your ${category.toLowerCase()} offer?`,
    "What are your hours of operation?",
    "How can I contact you?",
    "Where are you located?",
  ];

  if (goal === "bookings") {
    baseFAQs.push("How do I book an appointment?");
    baseFAQs.push("What's your cancellation policy?");
  } else if (goal === "leads") {
    baseFAQs.push("Can I get a quote?");
    baseFAQs.push("Do you offer free consultations?");
  } else if (goal === "support") {
    baseFAQs.push("How do I track my order?");
    baseFAQs.push("What's your return policy?");
  }

  return baseFAQs;
}

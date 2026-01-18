export type Topic =
  | "SERVICES"
  | "PRICING"
  | "HOURS"
  | "LOCATION"
  | "CONTACT"
  | "BOOKING"
  | "PAYMENT"
  | "OTHER";

const TOPIC_PATTERNS: Record<Topic, RegExp[]> = {
  SERVICES: [
    /\bservices?\b/i,
    /\bwhat do you (do|offer)\b/i,
    /\bwhat.*offer\b/i,
    /\btreatments?\b/i,
    /\bprocedures?\b/i,
    /\bpackages?\b/i,
    /\bmenu\b/i,
  ],
  PRICING: [
    /\bpric(e|es|ing)\b/i,
    /\bcost\b/i,
    /\bhow much\b/i,
    /\brates?\b/i,
    /\bfees?\b/i,
    /\bquote\b/i,
    /\bestimate\b/i,
    /\baffordable\b/i,
    /\bcheap\b/i,
    /\bexpensive\b/i,
  ],
  HOURS: [
    /\bhours?\b/i,
    /\bopen\b/i,
    /\bclose[ds]?\b/i,
    /\bwhen.*open\b/i,
    /\bwhat time\b/i,
    /\bschedule\b/i,
    /\bavailab(le|ility)\b/i,
    /\btoday\b/i,
    /\btomorrow\b/i,
    /\bmonday|tuesday|wednesday|thursday|friday|saturday|sunday\b/i,
    /\bweekend\b/i,
  ],
  LOCATION: [
    /\blocation\b/i,
    /\baddress\b/i,
    /\bwhere.*located\b/i,
    /\bdirections?\b/i,
    /\bfind you\b/i,
    /\bmap\b/i,
    /\bparking\b/i,
  ],
  CONTACT: [
    /\bcontact\b/i,
    /\bphone\b/i,
    /\bcall\b/i,
    /\bemail\b/i,
    /\breach\b/i,
    /\bget in touch\b/i,
    /\bspeak to\b/i,
    /\btalk to\b/i,
  ],
  BOOKING: [
    /\bbook(ing)?\b/i,
    /\bappointment\b/i,
    /\bschedule\b/i,
    /\breserv(e|ation)\b/i,
    /\bslot\b/i,
    /\bset up\b/i,
    /\bcome in\b/i,
  ],
  PAYMENT: [
    /\bpay(ment)?\b/i,
    /\bdeposit\b/i,
    /\bcheckout\b/i,
    /\binvoice\b/i,
    /\bbill\b/i,
    /\bcredit card\b/i,
    /\bvenmo\b/i,
    /\bzelle\b/i,
  ],
  OTHER: [],
};

export function detectTopics(message: string): Topic[] {
  const detected: Topic[] = [];
  const normalized = message.toLowerCase().trim();

  for (const [topic, patterns] of Object.entries(TOPIC_PATTERNS)) {
    if (topic === "OTHER") continue;

    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        detected.push(topic as Topic);
        break;
      }
    }
  }

  if (detected.length === 0) {
    detected.push("OTHER");
  }

  return detected;
}

export function hasHighIntent(message: string): boolean {
  const highIntentPatterns = [
    /\bbook\b/i,
    /\bschedule\b/i,
    /\bappointment\b/i,
    /\bpay\b/i,
    /\bdeposit\b/i,
    /\bpric(e|ing)\b/i,
    /\bhow much\b/i,
    /\bcost\b/i,
    /\bquote\b/i,
  ];

  return highIntentPatterns.some((p) => p.test(message));
}

import type { IndustryTemplate, TemplateKey } from "./types";
import { TEMPLATE_KEYS } from "./types";

const templates: Record<TemplateKey, IndustryTemplate> = {
  universal_blank: {
    key: "universal_blank",
    label: "Universal (Blank)",
    industry: "General",
    defaultBrandVoice: "friendly",
    defaultPrimaryGoal: "leads",
    botNamePattern: "{BusinessName} Assistant",
    greetingTemplate: "Welcome to {BusinessName}! How can I help you today?",
    fallbackTemplate:
      "I don't have that information right now. Would you like me to connect you with our team?",
    starterKnowledge: [],
  },

  barber_shop: {
    key: "barber_shop",
    label: "Barber Shop",
    industry: "Grooming & Personal Care",
    defaultBrandVoice: "chill",
    defaultPrimaryGoal: "bookings",
    botNamePattern: "{BusinessName} Assistant",
    greetingTemplate:
      "Hey, welcome to {BusinessName}! Looking to book a cut or have questions about our services?",
    fallbackTemplate:
      "Not sure about that one. Want me to have someone from the shop reach out?",
    starterKnowledge: [
      {
        title: "Template: Services & Pricing",
        contentTemplate: `{BusinessName} offers professional barbering services including haircuts, beard trims, fades, lineups, and hot towel shaves.

Contact us at {Phone} or visit {Address} for current pricing and availability.`,
      },
      {
        title: "Template: Hours & Location",
        contentTemplate: `{BusinessName} is located at {Address}.

Hours of operation: {Hours}

Walk-ins welcome, appointments preferred. Book online at {BookingUrl} or call {Phone}.`,
      },
      {
        title: "Template: Policies",
        contentTemplate: `Appointment Policy:
- Please arrive 5-10 minutes early
- Cancellations require 24-hour notice
- No-shows may be charged a fee

We accept cash, credit cards, and mobile payments.`,
      },
    ],
    recommendedLinks: [
      { label: "Book Appointment", urlPlaceholder: "{BookingUrl}", type: "booking" },
    ],
  },

  nail_salon: {
    key: "nail_salon",
    label: "Nail Salon",
    industry: "Beauty & Wellness",
    defaultBrandVoice: "friendly",
    defaultPrimaryGoal: "bookings",
    botNamePattern: "{BusinessName} Assistant",
    greetingTemplate:
      "Hi! Welcome to {BusinessName}. Ready to treat yourself? Ask about our services or book your appointment!",
    fallbackTemplate:
      "I'm not sure about that. Would you like me to have one of our nail technicians reach out to you?",
    starterKnowledge: [
      {
        title: "Template: Services & Pricing",
        contentTemplate: `{BusinessName} offers a full range of nail services including manicures, pedicures, gel polish, acrylics, nail art, and spa treatments.

For current pricing, contact us at {Phone} or visit {Website}.`,
      },
      {
        title: "Template: Hours & Location",
        contentTemplate: `Visit {BusinessName} at {Address}.

Hours: {Hours}

Walk-ins welcome! For guaranteed availability, book ahead at {BookingUrl} or call {Phone}.`,
      },
      {
        title: "Template: Policies",
        contentTemplate: `Salon Policies:
- Appointments recommended for weekends and holidays
- 24-hour cancellation notice appreciated
- We maintain strict hygiene and sanitation standards

We accept all major credit cards, cash, and gift cards.`,
      },
    ],
    recommendedLinks: [
      { label: "Book Now", urlPlaceholder: "{BookingUrl}", type: "booking" },
    ],
  },

  fitness_gym: {
    key: "fitness_gym",
    label: "Fitness / Gym",
    industry: "Health & Fitness",
    defaultBrandVoice: "bold",
    defaultPrimaryGoal: "leads",
    botNamePattern: "{BusinessName} Assistant",
    greetingTemplate:
      "Hey! Welcome to {BusinessName}. Ready to crush your fitness goals? Ask about memberships, classes, or book a tour!",
    fallbackTemplate:
      "Great question! I don't have that info yet, but let's get you connected with our team.",
    starterKnowledge: [
      {
        title: "Template: Memberships & Services",
        contentTemplate: `{BusinessName} offers flexible membership options including monthly, annual, and day pass access.

Amenities may include cardio equipment, free weights, group fitness classes, personal training, and more.

Contact us at {Phone} for current membership rates and promotions.`,
      },
      {
        title: "Template: Hours & Location",
        contentTemplate: `{BusinessName} is located at {Address}.

Hours: {Hours}

Stop by for a tour or call {Phone} to learn more about our facilities.`,
      },
      {
        title: "Template: Policies",
        contentTemplate: `Gym Policies:
- Valid membership required for facility access
- Guests must sign in and may require guest fees
- Please wipe down equipment after use
- Personal training sessions require 24-hour cancellation notice

We offer flexible cancellation policies on most memberships.`,
      },
    ],
    recommendedLinks: [
      { label: "Book a Tour", urlPlaceholder: "{BookingUrl}", type: "booking" },
    ],
  },

  dentist: {
    key: "dentist",
    label: "Dental Practice",
    industry: "Healthcare",
    defaultBrandVoice: "professional",
    defaultPrimaryGoal: "bookings",
    botNamePattern: "{BusinessName} Assistant",
    greetingTemplate:
      "Welcome to {BusinessName}. How may I assist you today? I can help you schedule an appointment or answer questions about our services.",
    fallbackTemplate:
      "I don't have that specific information. Would you like me to have our front desk team contact you?",
    starterKnowledge: [
      {
        title: "Template: Services",
        contentTemplate: `{BusinessName} provides comprehensive dental care including:
- Preventive care (cleanings, exams, x-rays)
- Restorative treatments (fillings, crowns, bridges)
- Cosmetic dentistry (whitening, veneers)
- Emergency dental services

Contact us at {Phone} to schedule an appointment.`,
      },
      {
        title: "Template: Hours & Location",
        contentTemplate: `{BusinessName} is located at {Address}.

Office Hours: {Hours}

New patients welcome. Schedule your appointment at {BookingUrl} or call {Phone}.`,
      },
      {
        title: "Template: Insurance & Payment",
        contentTemplate: `We accept most major dental insurance plans.

For patients without insurance, we offer flexible payment options and financing plans.

Contact our billing department at {Phone} for specific insurance questions.`,
      },
    ],
    recommendedLinks: [
      { label: "Schedule Appointment", urlPlaceholder: "{BookingUrl}", type: "booking" },
    ],
  },

  sober_living: {
    key: "sober_living",
    label: "Sober Living Facility",
    industry: "Recovery & Wellness",
    defaultBrandVoice: "professional",
    defaultPrimaryGoal: "leads",
    botNamePattern: "{BusinessName} Assistant",
    greetingTemplate:
      "Welcome to {BusinessName}. We're here to support your recovery journey. How can I help you today?",
    fallbackTemplate:
      "I want to make sure you get accurate information. May I have someone from our admissions team reach out to you?",
    starterKnowledge: [
      {
        title: "Template: Programs & Services",
        contentTemplate: `{BusinessName} provides structured sober living accommodations in a supportive, recovery-focused environment.

Our program includes:
- Safe, substance-free housing
- Peer support and accountability
- Life skills development
- Connection to outpatient services and 12-step programs

Contact our admissions team at {Phone} to learn about availability and program details.`,
      },
      {
        title: "Template: Location & Contact",
        contentTemplate: `{BusinessName} is located at {Address}.

Service Area: {ServiceArea}

For admissions inquiries or tours, contact us at {Phone} or visit {Website}.`,
      },
      {
        title: "Template: Admissions Process",
        contentTemplate: `Our admissions process:
1. Initial phone consultation
2. Assessment and interview
3. Review of program requirements
4. Move-in coordination

We work with individuals, families, and treatment centers. Contact us at {Phone} to begin the conversation.`,
      },
    ],
    recommendedLinks: [
      { label: "Contact Admissions", urlPlaceholder: "{Website}", type: "website" },
    ],
  },

  epoxy_flooring: {
    key: "epoxy_flooring",
    label: "Epoxy Flooring",
    industry: "Home Services & Construction",
    defaultBrandVoice: "professional",
    defaultPrimaryGoal: "leads",
    botNamePattern: "{BusinessName} Assistant",
    greetingTemplate:
      "Welcome to {BusinessName}! Looking for a free estimate or have questions about our epoxy flooring services?",
    fallbackTemplate:
      "I don't have that information on hand. Would you like a free consultation with one of our specialists?",
    starterKnowledge: [
      {
        title: "Template: Services",
        contentTemplate: `{BusinessName} specializes in professional epoxy flooring solutions for residential and commercial properties.

Our services include:
- Garage floor coatings
- Commercial and industrial flooring
- Decorative epoxy finishes
- Concrete repair and preparation
- Anti-slip and chemical-resistant options

Serving {ServiceArea}. Contact us at {Phone} for a free estimate.`,
      },
      {
        title: "Template: Process & Pricing",
        contentTemplate: `Our installation process:
1. Free on-site consultation and measurement
2. Surface preparation (grinding, crack repair)
3. Professional epoxy application
4. Quality inspection and walk-through

Pricing varies by square footage, condition of existing floor, and finish selection. Contact {Phone} for a customized quote.`,
      },
      {
        title: "Template: Warranty & Policies",
        contentTemplate: `{BusinessName} stands behind our work with industry-leading warranties.

All projects include:
- Written warranty on materials and labor
- Post-installation care instructions
- Responsive customer support

Request your free estimate at {BookingUrl} or call {Phone}.`,
      },
    ],
    recommendedLinks: [
      { label: "Get Free Quote", urlPlaceholder: "{BookingUrl}", type: "booking" },
    ],
  },
};

export function getTemplate(key: TemplateKey): IndustryTemplate {
  return templates[key];
}

export function listTemplates(): IndustryTemplate[] {
  return TEMPLATE_KEYS.map((key) => templates[key]);
}

export function isValidTemplateKey(key: string): key is TemplateKey {
  return TEMPLATE_KEYS.includes(key as TemplateKey);
}

export { TEMPLATE_KEYS };

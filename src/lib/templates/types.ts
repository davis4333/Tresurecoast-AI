import type { BrandVoice, PrimaryGoal } from "../onboarding/schemas";

export const TEMPLATE_KEYS = [
  "universal_blank",
  "barber_shop",
  "nail_salon",
  "fitness_gym",
  "dentist",
  "sober_living",
  "epoxy_flooring",
] as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

export interface StarterKnowledge {
  title: string;
  contentTemplate: string;
}

export interface RecommendedLink {
  label: string;
  urlPlaceholder: string;
  type: "booking" | "payment" | "website";
}

export interface IndustryTemplate {
  key: TemplateKey;
  label: string;
  industry: string;
  defaultBrandVoice: BrandVoice;
  defaultPrimaryGoal: PrimaryGoal;
  botNamePattern: string;
  greetingTemplate: string;
  fallbackTemplate: string;
  starterKnowledge: StarterKnowledge[];
  recommendedLinks?: RecommendedLink[];
}

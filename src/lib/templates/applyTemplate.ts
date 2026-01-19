import type { OnboardingFormData } from "../onboarding/schemas";
import type { BotBlueprint } from "../onboarding/botBlueprint";
import type { IndustryTemplate, TemplateKey } from "./types";
import { getTemplate, isValidTemplateKey } from "./registry";
import { replacePlaceholders, buildPlaceholderValues } from "./placeholders";

export interface TemplateApplicationInput {
  businessName: string;
  category: string;
  phone?: string;
  address?: string;
  hours?: string;
  websiteUrl?: string;
  bookingUrl?: string;
  paymentsUrl?: string;
  serviceArea?: string;
}

export interface GeneratedKnowledgeSource {
  title: string;
  content: string;
}

export function applyTemplateToBlueprint(
  blueprint: BotBlueprint,
  templateKey: string | undefined,
  input: TemplateApplicationInput
): BotBlueprint {
  if (!templateKey || templateKey === "universal_blank") {
    return blueprint;
  }

  if (!isValidTemplateKey(templateKey)) {
    return blueprint;
  }

  const template = getTemplate(templateKey);
  const placeholderValues = buildPlaceholderValues(input);

  const botName = replacePlaceholders(template.botNamePattern, placeholderValues);
  const greeting = replacePlaceholders(template.greetingTemplate, placeholderValues);
  const fallbackText = replacePlaceholders(template.fallbackTemplate, placeholderValues);

  return {
    ...blueprint,
    botName: botName || blueprint.botName,
    greeting: greeting || blueprint.greeting,
    fallbackText: fallbackText || blueprint.fallbackText,
  };
}

export function generateStarterKnowledge(
  templateKey: string | undefined,
  input: TemplateApplicationInput
): GeneratedKnowledgeSource[] {
  if (!templateKey || templateKey === "universal_blank") {
    return [];
  }

  if (!isValidTemplateKey(templateKey)) {
    return [];
  }

  const template = getTemplate(templateKey);
  const placeholderValues = buildPlaceholderValues(input);

  return template.starterKnowledge.map((kb) => ({
    title: kb.title,
    content: replacePlaceholders(kb.contentTemplate, placeholderValues),
  }));
}

export function getTemplateDefaults(
  templateKey: string | undefined
): { brandVoice: string; primaryGoal: string } | null {
  if (!templateKey || templateKey === "universal_blank") {
    return null;
  }

  if (!isValidTemplateKey(templateKey)) {
    return null;
  }

  const template = getTemplate(templateKey);
  return {
    brandVoice: template.defaultBrandVoice,
    primaryGoal: template.defaultPrimaryGoal,
  };
}

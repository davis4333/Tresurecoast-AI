export { TEMPLATE_KEYS, getTemplate, listTemplates, isValidTemplateKey } from "./registry";
export type { TemplateKey, IndustryTemplate, StarterKnowledge, RecommendedLink } from "./types";
export { replacePlaceholders, buildPlaceholderValues } from "./placeholders";
export type { PlaceholderValues } from "./placeholders";
export {
  applyTemplateToBlueprint,
  generateStarterKnowledge,
  getTemplateDefaults,
} from "./applyTemplate";
export type { TemplateApplicationInput, GeneratedKnowledgeSource } from "./applyTemplate";
export { seedTemplateKnowledge, isTemplateKnowledgeTitle } from "./seedKnowledge";
export type { SeedKnowledgeResult } from "./seedKnowledge";

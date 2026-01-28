import { z } from "zod";

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

export const BrandingSchema = z.object({
  whiteLabelEnabled: z.boolean(),
  brandCompanyName: z.string().max(80).nullable().or(z.literal("")),
  brandLogoUrl: z.string().url().nullable().or(z.literal("")),
  brandPrimaryColor: z.string().regex(hexColorRegex, "Must be a valid hex color (#RRGGBB)"),
  showPoweredBy: z.boolean(),
  widgetPosition: z.enum(["bottom-right", "bottom-left"]).optional().default("bottom-right"),
  customDomain: z.string().regex(domainRegex, "Must be a valid domain (e.g., example.com)").nullable().or(z.literal("")),
});

export type BrandingInput = z.infer<typeof BrandingSchema>;

export const BrandingResponseSchema = z.object({
  ok: z.literal(true),
  branding: BrandingSchema,
});

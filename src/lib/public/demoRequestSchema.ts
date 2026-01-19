import { z } from "zod";

export const DemoRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  businessName: z.string().min(1, "Business name is required").max(200, "Business name too long"),
  phone: z.string().max(30, "Phone number too long").optional().nullable(),
});

export type DemoRequestInput = z.infer<typeof DemoRequestSchema>;

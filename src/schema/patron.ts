import z from "zod";

export const patronBodySchema = z.object({
  name: z.string().min(2),
  role: z.string().min(2),
  quote: z.string().min(5),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
  sort_order: z.number().int().optional(),
});

export const createPatronSchema = z.object({
  body: patronBodySchema,
});

export const updatePatronSchema = z.object({
  body: patronBodySchema.partial(),
});

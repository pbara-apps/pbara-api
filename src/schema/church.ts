import z from "zod";

export const churchBodySchema = z.object({
  name: z.string().min(3),
  address: z.string().optional(),
  chapter: z.string().min(3),
  counsellor: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  image: z.string().optional(),
});

export const createChurchSchema = z.object({
  body: churchBodySchema,
});

export const createBulkChurchSchema = z.object({
  body: z.array(churchBodySchema),
});

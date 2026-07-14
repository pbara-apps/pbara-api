import { z } from "zod";

const objectId = /^[a-f\d]{24}$/i;
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format");
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const bankDetailsSchema = z.object({
  bankName: z.string().min(2),
  accountName: z.string().min(2),
  accountNumber: z.string().min(5),
});

const programBodyBase = z.object({
  title: z.string().min(3),
  slug: z
    .string()
    .regex(slugPattern, "Slug must be URL-safe (lowercase letters, numbers, hyphens)")
    .optional(),
  category: z.string().min(2),
  description: z.string().optional().nullable(),
  flyerImageUrl: z.string().optional().nullable(),
  amount: z.number().positive(),
  bankDetails: bankDetailsSchema,
  registrationMode: z.enum(["single", "bulk", "both"]),
  registrationDeadline: isoDate.optional().nullable(),
  isActive: z.boolean().optional(),
  termsAndConditions: z.string().optional().nullable(),
});

export const createProgramSchema = z.object({
  body: programBodyBase,
});

export const updateProgramSchema = z.object({
  params: z.object({
    id: z.string().regex(objectId, "Invalid id format"),
  }),
  body: programBodyBase.partial(),
});

export const programSlugParamSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>["body"];
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>["body"];

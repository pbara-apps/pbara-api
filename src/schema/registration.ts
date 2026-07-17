import { z } from "zod";

const objectId = /^[a-f\d]{24}$/i;

const entrySchema = z.object({
  name: z.string().min(2),
  rank: z.string().regex(objectId, "Invalid rank id"),
  church: z.string().regex(objectId, "Invalid church id"),
});

const registrationBodyBase = z.object({
  programId: z.string().regex(objectId, "Invalid program id"),
  registrantName: z.string().min(2),
  registrantPhone: z.string().min(7),
  proofOfPaymentUrl: z.string().min(1),
  registrationType: z.enum(["single", "bulk"]),
  entries: z.array(entrySchema).min(1),
});

export const createRegistrationSchema = z.object({
  body: registrationBodyBase.superRefine((data, ctx) => {
    if (data.registrationType === "single" && data.entries.length !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["entries"],
        message: "Single registration must have exactly one entry",
      });
    }
  }),
});

export const listRegistrationsQuerySchema = z.object({
  query: z.object({
    programId: z.string().regex(objectId, "Invalid program id").optional(),
    category: z.string().min(1).optional(),
    status: z.enum(["pending", "verified", "rejected"]).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
  }),
});

export const updateRegistrationStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(objectId, "Invalid id format"),
  }),
  body: z.object({
    status: z.enum(["verified", "rejected"]),
    adminNote: z.string().optional().nullable(),
  }),
});

export const addRegistrationEntriesSchema = z.object({
  params: z.object({
    id: z.string().regex(objectId, "Invalid id format"),
  }),
  body: z.object({
    entries: z.array(entrySchema).min(1),
  }),
});

export const updateRegistrationEntrySchema = z.object({
  params: z.object({
    id: z.string().regex(objectId, "Invalid id format"),
  }),
  body: z
    .object({
      registrationCode: z.string().min(3),
      name: z.string().min(2).optional(),
      rank: z.string().regex(objectId, "Invalid rank id").optional(),
      church: z.string().regex(objectId, "Invalid church id").optional(),
    })
    .refine(
      (data) =>
        data.name !== undefined ||
        data.rank !== undefined ||
        data.church !== undefined,
      { message: "Provide at least one field to update (name, rank, or church)" },
    ),
});

export type CreateRegistrationInput = z.infer<
  typeof createRegistrationSchema
>["body"];
export type UpdateRegistrationStatusInput = z.infer<
  typeof updateRegistrationStatusSchema
>["body"];
export type AddRegistrationEntriesInput = z.infer<
  typeof addRegistrationEntriesSchema
>["body"];
export type UpdateRegistrationEntryInput = z.infer<
  typeof updateRegistrationEntrySchema
>["body"];

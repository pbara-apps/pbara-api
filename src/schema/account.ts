import { ADMIN_ROLES } from "@/models/account";
import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const accountIdSchema = z.object({ params: z.object({ id: objectId }) });

/** Pick an executive (details come from their profile) or enter them by hand. */
export const createAdminAccountSchema = z.object({
  body: z
    .object({
      executiveId: objectId.optional().nullable(),
      name: z.string().trim().min(2).max(120).optional(),
      email: z.union([z.email("Enter a valid email address"), z.literal("")]).optional(),
      phone: z.string().trim().max(30).optional(),
      role: z.enum(ADMIN_ROLES),
      is_finance: z.boolean().optional(),
    })
    .refine((b) => b.executiveId || (b.name && b.email), {
      message: "Pick an executive, or enter a name and email",
    }),
});

export const updateAdminAccessSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    role: z.enum(ADMIN_ROLES).optional(),
    is_finance: z.boolean().optional(),
    active: z.boolean().optional(),
    executiveId: objectId.nullable().optional(),
  }),
});

import z from "zod";

/** Request validation for dues, bills and payments. */

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id format");
const idParam = z.object({ id: objectId });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD");

export const createDueSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(3, "Enter a title").max(120),
      description: z.string().trim().max(1000).optional().nullable(),
      type: z.enum(["due", "levy"]),
      billTo: z.enum(["chapter", "church"]),
      chargeBasis: z.enum(["flat", "per_member"]),
      amount: z.number().positive("Amount must be more than 0").max(100_000_000),
      period: z.string().trim().max(40).optional().nullable(),
      dueDate: isoDate,
      appliesTo: z.enum(["all", "selected"]),
      churchIds: z.array(objectId).max(500).optional(),
      chapterIds: z.array(objectId).max(1000).optional(),
    })
    .refine((d) => d.appliesTo === "all" || (d.churchIds?.length ?? 0) + (d.chapterIds?.length ?? 0) > 0, {
      message: "Select at least one church or chapter",
      path: ["appliesTo"],
    }),
});

export const dueIdSchema = z.object({ params: idParam });

export const adjustBillSchema = z.object({
  params: idParam,
  body: z.object({
    waived: z.boolean().optional(),
    amountDue: z.number().min(0).max(100_000_000).optional(),
    note: z.string().trim().min(3, "Give a reason").max(300),
  }),
});

export const paymentListSchema = z.object({
  query: z.object({ status: z.enum(["pending", "verified", "rejected"]).optional() }),
});

export const paymentIdSchema = z.object({ params: idParam });

export const rejectPaymentSchema = z.object({
  params: idParam,
  body: z.object({ note: z.string().trim().min(3, "Give a reason").max(300) }),
});

export const statementSchema = z.object({
  query: z.object({ chapterId: objectId.optional(), churchId: objectId.optional() }),
});

// Chapter portal
export const portalBillsSchema = z.object({
  query: z.object({ chapterId: objectId.optional() }),
});

export const submitPaymentSchema = z.object({
  body: z.object({
    billId: objectId,
    amount: z.number().positive("Enter the amount paid").max(100_000_000),
    paidOn: isoDate.refine((v) => new Date(v) <= new Date(), "Payment date can't be in the future"),
    reference: z.string().trim().max(100).optional().nullable(),
    proofUrl: z.string().trim().url("Upload the proof of payment"),
  }),
});

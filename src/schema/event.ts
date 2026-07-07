import z from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format");

// Plain object, no refine — keeps shape available for .partial()
const eventBodyBase = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  date: isoDate,
  endDate: isoDate.optional().nullable(),
  venue: z.string().min(3),
  description: z.string().min(10),
  image: z.string().optional().nullable(),
  status: z.enum(["open", "completed", "cancelled"]).optional(),
});

// Infer the type directly from the schema instead of writing it by hand
type EventBodyBase = z.infer<typeof eventBodyBase>;

// Reusable refine logic, typed against whatever shape is passed in
function dateOrderCheck(data: { date?: string; endDate?: string | null }) {
  return !data.endDate || data.endDate >= (data.date ?? "");
}

const refineOptions = {
  message: "End date must be on or after start date",
  path: ["endDate"],
};

// Full schema — required fields, refine applied
export const eventBodySchema = eventBodyBase.refine(dateOrderCheck, refineOptions);

export const createEventSchema = z.object({ body: eventBodySchema });

// Update schema — partial FIRST on the plain base, then refine
export const updateEventSchema = z.object({
  body: eventBodyBase.partial().refine(dateOrderCheck, refineOptions),
});

// Optional: export inferred types for use elsewhere in your app
export type CreateEventInput = z.infer<typeof createEventSchema>["body"];
export type UpdateEventInput = z.infer<typeof updateEventSchema>["body"];
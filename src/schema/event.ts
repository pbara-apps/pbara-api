import z from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format");

export const eventBodySchema = z
  .object({
    title: z.string().min(3),
    category: z.string().min(2),
    date: isoDate,
    endDate: isoDate.optional().nullable(),
    venue: z.string().min(3),
    description: z.string().min(10),
    image: z.string().optional().nullable(),
    status: z.enum(["open", "completed", "cancelled"]).optional(),
  })
  .refine(
    (data) => !data.endDate || data.endDate >= data.date,
    { message: "End date must be on or after start date", path: ["endDate"] },
  );

export const createEventSchema = z.object({ body: eventBodySchema });
export const updateEventSchema = z.object({ body: eventBodySchema.partial() });

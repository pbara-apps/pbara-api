import z from "zod";

export const eventBodySchema = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  date: z.string().min(3),
  venue: z.string().min(3),
  description: z.string().min(10),
  image: z.string().optional().nullable(),
  status: z.enum(["open", "completed", "cancelled"]).optional(),
});

export const createEventSchema = z.object({ body: eventBodySchema });
export const updateEventSchema = z.object({ body: eventBodySchema.partial() });

import z from "zod";

const directorDeskBodySchema = z.object({
  executive_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(10),
  current: z.boolean().default(false),
});

export const createDirectorDeskSchema = z.object({
  body: directorDeskBodySchema,
});

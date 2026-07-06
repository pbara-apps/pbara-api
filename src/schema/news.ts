import z from "zod";

export const newsBodySchema = z.object({
  title: z.string().min(3),
  slug: z.string().optional(),
  category: z.string().min(2),
  excerpt: z.string().min(10),
  content: z.string().optional(),
  image: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  read_time: z.number().min(1).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export const createNewsSchema = z.object({ body: newsBodySchema });
export const updateNewsSchema = z.object({ body: newsBodySchema.partial() });

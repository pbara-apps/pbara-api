import z from "zod";

const rankBody = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  category: z.string().min(2),
  image: z.string().optional().nullable(),
});

export const createRankSchema = z.object({
  body: rankBody,
});

export const createRankBulkSchema = z.object({
  body: z.array(rankBody).min(1),
});

export const updateRankSchema = z.object({
  body: rankBody.partial(),
});

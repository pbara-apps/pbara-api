import z from "zod";

const objectId = /^[a-f\d]{24}$/i;

const rankBody = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  category: z.string().min(2),
  image: z.string().optional().nullable(),
  /** Position in the rank ladder (1 = lowest). Optional: new ranks go to the end. */
  order: z.number().int().min(1).optional(),
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

/** Full list of rank ids in the new order, lowest rank first. */
export const reorderRanksSchema = z.object({
  body: z.object({
    ids: z
      .array(z.string().regex(objectId, "Invalid id format"))
      .min(1)
      .max(100),
  }),
});

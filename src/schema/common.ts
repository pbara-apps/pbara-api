import { z } from "zod";

const objectId = /^[a-f\d]{24}$/i;

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectId, "Invalid id format"),
  }),
});

export const bulkDeleteSchema = z.object({
  body: z.object({
    ids: z.array(z.string().regex(objectId, "Invalid id format")).min(1).max(100),
  }),
});

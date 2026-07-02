import { z } from "zod";

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const bulkDeleteSchema = z.object({
  body: z.object({
    ids: z.array(z.string().min(1)).min(1),
  }),
});

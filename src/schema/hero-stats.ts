import { z } from "zod";

const heroStatItemSchema = z.object({
  label: z.string().trim().min(1).max(60),
  end: z.number().int().min(0).max(1000000),
  suffix: z.string().trim().max(10).default("+"),
});

export const updateHeroStatsSchema = z.object({
  body: z.object({
    stats: z.array(heroStatItemSchema).min(1).max(4),
  }),
});

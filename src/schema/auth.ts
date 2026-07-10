import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    image: z.string().optional().nullable(),
    name: z.string().trim().min(3).optional(),
    email: z.union([z.string().email(), z.literal("")]).optional(),
    phone: z.string().trim().min(1).optional(),
    title: z.string().trim().optional(),
    description: z.string().trim().optional(),
    password: z.string().min(8).optional(),
  }),
});

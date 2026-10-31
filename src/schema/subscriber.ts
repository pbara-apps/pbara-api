import { z } from "zod";

export const subscribeSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(254),
    source: z.string().trim().max(50).optional(),
  }),
});

export const sendNewsletterSchema = z.object({
  body: z.object({
    subject: z.string().trim().min(3).max(150),
    content: z.string().min(1).max(100_000),
    // When set, sends a single test copy to this address instead of everyone.
    test_email: z.string().trim().email().optional(),
  }),
});

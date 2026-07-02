import { z } from "zod";

export const createMessageSchema = z.object({
  body: z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    subject: z.string().min(1),
    message: z.string().min(10),
  }),
});

export const markMessagesReadSchema = z.object({
  body: z.object({
    ids: z.array(z.string().min(1)).min(1),
  }),
});

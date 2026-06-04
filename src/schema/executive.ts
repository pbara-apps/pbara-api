import { z } from "zod";

const executivebodySchema = z.object({
  image: z.string().optional(),
  name: z.string().min(3),
  office_id: z.string().min(1),
  email: z.string().optional(),
  phone: z.string(),
  church_id: z.string().min(1),
  start_year: z.number().min(2000).or(z.string().min(4)),
  end_year: z.number().optional().or(z.string().optional()),
  status: z.enum(["active", "inactive", "completed"]),
  password: z.string().default("password"),
});

export const createExecutiveSchema = z.object({
  body: executivebodySchema,
});

import { z } from "zod";

const executivebodySchema = z.object({
  image: z.string().optional(),
  name: z.string().min(3),
  office_id: z.string().min(1),
  email: z.string().optional(),
  phone: z.string(),
  church_id: z.string().min(1),
  rank_id: z.string().min(1).optional().nullable(),
  start_year: z.number().min(2000).or(z.string().min(4)),
  end_year: z.number().optional().or(z.string().optional()),
  status: z.enum(["active", "inactive", "completed"]),
  password: z.string().min(8),
  title: z.string().optional(),
  description: z.string().optional(),
});

export const createExecutiveSchema = z.object({
  body: executivebodySchema,
});

export const updateExecutiveSchema = z.object({
  body: z.object({
    image: z.string().optional(),
    name: z.string().optional(),
    office_id: z.string().optional(),
    email: z.string().optional().optional(),
    phone: z.string().optional(),
    church_id: z.string().optional(),
    rank_id: z.string().min(1).optional().nullable(),
    start_year: z.number().min(2000).or(z.string().min(4)).optional(),
    end_year: z.number().optional().or(z.string().optional()).optional(),
    status: z.enum(["active", "inactive", "completed"]).optional(),
    password: z.string().min(8).optional(),
    title: z.string().optional().optional(),
    description: z.string().optional().optional(),
  }),
});

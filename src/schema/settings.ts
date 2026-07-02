import { z } from "zod";

export const updateExecutiveRoleSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    role: z.enum(["super_admin", "admin", "editor", "viewer"]),
  }),
});

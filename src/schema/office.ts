import z from "zod";

const officeBody = z.object({
  name: z.string().min(3),
  description: z.string().min(5),
});

export const createOfficeSchema = z.object({
  body: officeBody,
});

export const createOfficeBulkSchema = z.object({
  body: z.array(officeBody),
});

export const updateOfficeSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    description: z.string().min(5).optional(),
  }),
});

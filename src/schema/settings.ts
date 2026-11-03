import { z } from "zod";

export const paymentAccountSchema = z.object({
  body: z.object({
    bankName: z.string().trim().min(2, "Enter the bank name").max(100),
    accountName: z.string().trim().min(2, "Enter the account name").max(150),
    accountNumber: z.string().trim().regex(/^\d{10}$/, "Account number must be 10 digits"),
  }),
});

export const updateExecutiveRoleSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    role: z.enum(["super_admin", "admin", "editor", "finance", "viewer"]),
  }),
});

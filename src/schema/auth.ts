import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Enter a valid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().trim().email("Enter a valid email address") }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().regex(/^[a-f\d]{64}$/i, "Invalid reset link"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(100)
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/\d/, "Include at least one number"),
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

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(100)
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/\d/, "Include at least one number"),
  }),
});

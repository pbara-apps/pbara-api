import z from "zod";

/**
 * Request validation for the chapter portal (/chapter-portal) and the
 * association's chapter administration (/chapter-admin).
 */

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id format");
const optionalText = z.string().trim().max(200).optional().nullable();
const phone = z.string().trim().min(7, "Enter a valid phone number").max(20);

/** Name, email and phone of a counsellor, president or secretary. */
const accountDetails = z.object({
  name: z.string().trim().min(3, "Enter the full name").max(120),
  email: z.email("Enter a valid email address").max(160),
  phone,
});

/** A YYYY-MM-DD date that isn't in the future. Optional. */
const dateOfBirth = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date")
  .refine((value) => new Date(value) <= new Date(), "Date of birth can't be in the future")
  .optional()
  .nullable();

const memberFields = z.object({
  fullName: z.string().trim().min(3, "Enter the member's full name").max(120),
  rankId: objectId,
  dateOfBirth,
  photo: z.string().trim().max(500).optional().nullable(),
  phone: optionalText,
  guardianName: optionalText,
  guardianPhone: optionalText,
});

const idParam = z.object({ id: objectId });
const ids = z.array(objectId).min(1).max(200);

// ─── Portal auth ───────────────────────────────────────────────────────────

export const portalLoginSchema = z.object({
  body: z.object({
    email: z.email("Enter a valid email address"),
    password: z.string().min(1, "Password is required"),
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

// ─── Portal: members ───────────────────────────────────────────────────────

export const listMembersSchema = z.object({
  query: z.object({
    chapterId: objectId.optional(),
    view: z.enum(["active", "awaiting", "all"]).optional(),
    search: z.string().trim().max(100).optional(),
    rankId: objectId.optional(),
  }),
});

export const dashboardSchema = z.object({
  query: z.object({ chapterId: objectId.optional() }),
});

/** One to 200 members at a time (single form, multi-row form or Excel import). */
export const addMembersSchema = z.object({
  body: z.object({
    chapterId: objectId,
    members: z.array(memberFields).min(1).max(200),
  }),
});

export const updateMemberSchema = z.object({
  params: idParam,
  body: memberFields.partial(),
});

export const memberIdSchema = z.object({ params: idParam });

// ─── Portal: officers (counsellor only) ────────────────────────────────────

export const assignOfficerSchema = z.object({
  body: accountDetails.extend({
    chapterId: objectId,
    role: z.enum(["president", "secretary"]),
  }),
});

export const officerIdSchema = z.object({ params: idParam });

// ─── Admin: counsellors and recruitment board ──────────────────────────────

export const churchIdSchema = z.object({ params: idParam });

export const assignCounsellorSchema = z.object({
  params: idParam,
  body: accountDetails,
});

export const recruitmentListSchema = z.object({
  query: z.object({
    status: z.enum(["pending", "rejected"]).optional(),
    search: z.string().trim().max(100).optional(),
    churchId: objectId.optional(),
  }),
});

export const approveMembersSchema = z.object({
  body: z.object({ ids }),
});

export const reviewNoteSchema = z.object({
  body: z.object({
    ids,
    note: z.string().trim().min(3, "Please add a short reason").max(500),
  }),
});

// ─── New-chapter requests ──────────────────────────────────────────────────

export const createChapterRequestSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3, "Enter the chapter name").max(80),
    memberIds: z.array(objectId).min(1).max(500),
  }),
});

export const chapterRequestIdSchema = z.object({ params: idParam });

export const chapterRequestListSchema = z.object({
  query: z.object({ status: z.enum(["pending", "rejected"]).optional() }),
});

export const rejectChapterRequestSchema = z.object({
  params: idParam,
  body: z.object({ note: z.string().trim().min(3, "Please add a short reason").max(500) }),
});

export const adminChapterListSchema = z.object({
  query: z.object({ churchId: objectId.optional() }),
});

// ─── Rank progress ─────────────────────────────────────────────────────────

const optionalPastDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
  .refine((value) => new Date(value) <= new Date(), "Date can't be in the future")
  .optional()
  .nullable();

export const rankHistorySchema = z.object({
  params: idParam,
  body: z.object({
    entries: z
      .array(
        z.object({
          rankId: objectId,
          dateReached: optionalPastDate,
          proofUrl: z.string().trim().max(500).optional().nullable(),
        }),
      )
      .min(1, "Keep at least one rank")
      .max(50),
  }),
});

// ─── Uploads ───────────────────────────────────────────────────────────────

/** What a portal upload is for; decides the storage folder and allowed types. */
export const UPLOAD_PURPOSES = ["photo", "rank-proof", "achievement-proof", "payment-proof"] as const;

export const uploadPurposeSchema = z.object({
  params: z.object({ purpose: z.enum(UPLOAD_PURPOSES) }),
});

// ─── Program registration from the portal ──────────────────────────────────

export const registeredMembersSchema = z.object({
  params: idParam,
  query: z.object({ chapterId: objectId }),
});

export const portalRegistrationSchema = z.object({
  body: z.object({
    programId: objectId,
    chapterId: objectId,
    memberIds: z.array(objectId).min(1, "Pick at least one member").max(200),
    proofOfPaymentUrl: z.string().trim().url("Upload the proof of payment"),
  }),
});

export const portalRegistrationListSchema = z.object({
  query: z.object({ chapterId: objectId.optional() }),
});

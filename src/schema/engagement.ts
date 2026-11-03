import z from "zod";

/** Validation for announcements, meetings and the annual census. */

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id format");
const idParam = z.object({ id: objectId });
const pastDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
  .refine((v) => new Date(v) <= new Date(), "Date can't be in the future");

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, "Enter a title").max(150),
    body: z.string().trim().min(5, "Write the announcement").max(5000),
    audience: z.enum(["all", "selected"]),
    churchIds: z.array(objectId).max(500).optional(),
  }),
});

export const idOnlySchema = z.object({ params: idParam });

const meetingFields = z.object({
  date: pastDate,
  activity: z.string().trim().min(3, "Describe the meeting or activity").max(150),
  report: z.string().trim().max(3000).optional().nullable(),
  presentIds: z.array(objectId).max(1000),
  visitors: z.number().int().min(0).max(10000).optional(),
});

export const createMeetingSchema = z.object({ body: meetingFields.extend({ chapterId: objectId }) });
export const updateMeetingSchema = z.object({ params: idParam, body: meetingFields.partial() });
export const chapterQuerySchema = z.object({ query: z.object({ chapterId: objectId.optional() }) });
export const churchQuerySchema = z.object({ query: z.object({ churchId: objectId.optional() }) });

export const censusStatusSchema = z.object({
  query: z.object({ chapterId: objectId, year: z.coerce.number().int().min(2000).max(2100) }),
});

export const submitCensusSchema = z.object({
  body: z.object({
    chapterId: objectId,
    year: z.number().int().min(2000).max(2100),
    removed: z
      .array(z.object({ memberId: objectId, reason: z.string().trim().min(3, "Give a reason for each member").max(200) }))
      .max(1000),
  }),
});

export const censusYearSchema = z.object({
  query: z.object({ year: z.coerce.number().int().min(2000).max(2100).optional() }),
});

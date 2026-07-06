import z from "zod";

export const galleryBodySchema = z.object({
  title: z.string().min(2),
  alt: z.string().optional(),
  url: z.string().min(5),
  type: z.enum(["photo", "video"]).optional(),
  category: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  sort_order: z.number().optional(),
});

export const createGallerySchema = z.object({ body: galleryBodySchema });
export const createBulkGallerySchema = z.object({
  body: z.array(galleryBodySchema).min(1).max(50),
});
export const updateGallerySchema = z.object({ body: galleryBodySchema.partial() });

import GalleryDao from "@/dao/gallery";
import { AuditActor, logAudit } from "@/helpers/audit-logger";

type GalleryInput = {
  title: string;
  alt?: string;
  url: string;
  type?: "photo" | "video";
  category?: string;
  status?: "active" | "inactive";
  sort_order?: number;
};

const GalleryService = {
  async create(data: GalleryInput, actor?: AuditActor) {
    const item = await GalleryDao.create(data);
    await logAudit({
      action: "created",
      entityType: "gallery",
      entityId: String(item._id),
      entityTitle: item.title,
      actor,
      detail: item.type,
    });
    return item;
  },
  async getAll() {
    return await GalleryDao.findAll();
  },
  async getPublic(type?: "photo" | "video") {
    return await GalleryDao.findPublic(type);
  },
  async getById(id: string) {
    const item = await GalleryDao.findById(id);
    if (!item) {
      const err = new Error("Gallery item not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    return item;
  },
  async update(id: string, data: Partial<GalleryInput>, actor?: AuditActor) {
    const existing = await GalleryDao.findById(id);
    if (!existing) {
      const err = new Error("Gallery item not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    const updated = await GalleryDao.update(id, data);
    await logAudit({
      action: "updated",
      entityType: "gallery",
      entityId: id,
      entityTitle: updated?.title ?? existing.title,
      actor,
    });
    return updated;
  },
  async delete(id: string, actor?: AuditActor) {
    const existing = await GalleryDao.findById(id);
    if (!existing) {
      const err = new Error("Gallery item not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    await GalleryDao.delete(id);
    await logAudit({
      action: "deleted",
      entityType: "gallery",
      entityId: id,
      entityTitle: existing.title,
      actor,
    });
  },
  async deleteMany(ids: string[], actor?: AuditActor) {
    for (const id of ids) {
      const existing = await GalleryDao.findById(id);
      if (existing) {
        await logAudit({
          action: "deleted",
          entityType: "gallery",
          entityId: id,
          entityTitle: existing.title,
          actor,
        });
      }
    }
    return await GalleryDao.deleteMany(ids);
  },
  async countAll() {
    return await GalleryDao.countAll();
  },
  async countActive() {
    return await GalleryDao.countActive();
  },
};

export default GalleryService;

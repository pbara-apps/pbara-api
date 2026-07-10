import PatronDao from "@/dao/patron";
import { AuditActor, logAudit } from "@/helpers/audit-logger";
import { PatronTypes } from "@/types/_types";

const PatronService = {
  async create(data: PatronTypes, actor?: AuditActor) {
    const patron = await PatronDao.create(data);
    await logAudit({
      action: "created",
      entityType: "patron",
      entityId: String(patron._id),
      entityTitle: patron.name,
      actor,
      detail: patron.role,
    });
    return patron;
  },
  async getAll() {
    return await PatronDao.findAll();
  },
  async getPublic() {
    return await PatronDao.findPublic();
  },
  async getById(id: string) {
    const patron = await PatronDao.findById(id);
    if (!patron) {
      const err = new Error("Patron not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    return patron;
  },
  async update(id: string, data: Partial<PatronTypes>, actor?: AuditActor) {
    const existing = await PatronDao.findById(id);
    if (!existing) {
      const err = new Error("Patron not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    const updated = await PatronDao.update(id, data);
    await logAudit({
      action: "updated",
      entityType: "patron",
      entityId: id,
      entityTitle: updated?.name ?? existing.name,
      actor,
      detail: updated?.role ?? existing.role,
    });
    return updated;
  },
  async delete(id: string, actor?: AuditActor) {
    const existing = await PatronDao.findById(id);
    if (!existing) {
      const err = new Error("Patron not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    await PatronDao.delete(id);
    await logAudit({
      action: "deleted",
      entityType: "patron",
      entityId: id,
      entityTitle: existing.name,
      actor,
      detail: existing.role,
    });
    return existing;
  },
  async deleteMany(ids: string[], actor?: AuditActor) {
    const existing = await Promise.all(ids.map((id) => PatronDao.findById(id)));
    await PatronDao.deleteMany(ids);
    for (const patron of existing) {
      if (!patron) continue;
      await logAudit({
        action: "deleted",
        entityType: "patron",
        entityId: String(patron._id),
        entityTitle: patron.name,
        actor,
        detail: patron.role,
      });
    }
    return { deletedCount: ids.length };
  },
};

export default PatronService;

import EventDao from "@/dao/event";
import { AuditActor, logAudit } from "@/helpers/audit-logger";

type EventInput = {
  title: string;
  category: string;
  date: string;
  endDate?: string | null;
  venue: string;
  description: string;
  image?: string | null;
  status?: "open" | "completed" | "cancelled";
  registrationProgramId?: string | null;
};

const EventService = {
  async create(data: EventInput, actor?: AuditActor) {
    const event = await EventDao.create(data);
    await logAudit({
      action: "created",
      entityType: "event",
      entityId: String(event._id),
      entityTitle: event.title,
      actor,
      detail: event.status,
    });
    return event;
  },
  async getAll() {
    return await EventDao.findAll();
  },
  async getPublic() {
    return await EventDao.findPublic();
  },
  async getById(id: string) {
    const item = await EventDao.findById(id);
    if (!item) {
      const err = new Error("Event not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    return item;
  },
  async update(id: string, data: Partial<EventInput>, actor?: AuditActor) {
    const existing = await EventDao.findById(id);
    if (!existing) {
      const err = new Error("Event not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    const updated = await EventDao.update(id, data);
    await logAudit({
      action: "updated",
      entityType: "event",
      entityId: id,
      entityTitle: updated?.title ?? existing.title,
      actor,
    });
    return updated;
  },
  async delete(id: string, actor?: AuditActor) {
    const existing = await EventDao.findById(id);
    if (!existing) {
      const err = new Error("Event not found") as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    await EventDao.delete(id);
    await logAudit({
      action: "deleted",
      entityType: "event",
      entityId: id,
      entityTitle: existing.title,
      actor,
    });
  },
  async deleteMany(ids: string[], actor?: AuditActor) {
    for (const id of ids) {
      const existing = await EventDao.findById(id);
      if (existing) {
        await logAudit({
          action: "deleted",
          entityType: "event",
          entityId: id,
          entityTitle: existing.title,
          actor,
        });
      }
    }
    return await EventDao.deleteMany(ids);
  },
  async countAll() {
    return await EventDao.countAll();
  },
  async countUpcoming() {
    return await EventDao.countUpcoming();
  },
};

export default EventService;

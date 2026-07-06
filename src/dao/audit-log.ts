import AuditLogModel from "@/models/audit-log";
import type { AuditAction, AuditEntityType } from "@/helpers/audit-logger";

type AuditPayload = {
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id?: string | null;
  entity_title: string;
  actor_id?: string | null;
  actor_name?: string;
  detail?: string | null;
};

const AuditLogDao = {
  async create(entry: AuditPayload) {
    return await AuditLogModel.create(entry);
  },
  async findAll(limit = 100) {
    return await AuditLogModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  },
  async countAll() {
    return await AuditLogModel.countDocuments().exec();
  },
};

export default AuditLogDao;

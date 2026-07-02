import AuditLogModel from "@/models/audit-log";

type AuditPayload = {
  action: string;
  entity_type: string;
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
    return await AuditLogModel.find().sort({ createdAt: -1 }).limit(limit).exec();
  },
  async countAll() {
    return await AuditLogModel.countDocuments().exec();
  },
};

export default AuditLogDao;

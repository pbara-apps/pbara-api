import AuditLogDao from "@/dao/audit-log";

const AuditService = {
  async getLogs(limit = 100) {
    return await AuditLogDao.findAll(limit);
  },
  async countAll() {
    return await AuditLogDao.countAll();
  },
};

export default AuditService;

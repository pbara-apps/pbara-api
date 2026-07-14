import AuditLogDao from "@/dao/audit-log";

export type AuditAction = "created" | "updated" | "deleted";
export type AuditEntityType =
  | "news"
  | "event"
  | "gallery"
  | "executive"
  | "chapter"
  | "office"
  | "patron"
  | "program"
  | "registration";

export type AuditActor = {
  id?: string;
  name?: string;
};

export async function logAudit(params: {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  entityTitle?: string | null;
  actor?: AuditActor;
  detail?: string;
}) {
  await AuditLogDao.create({
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    entity_title: params.entityTitle ?? "Unknown",
    actor_id: params.actor?.id ?? null,
    actor_name: params.actor?.name ?? "System",
    detail: params.detail ?? null,
  });
}

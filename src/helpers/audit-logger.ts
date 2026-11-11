import type { ClientSession } from "mongoose";
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
  | "registration"
  | "member"
  | "portal_account"
  | "settings"
  | "chapter_request"
  | "achievement"
  | "due"
  | "payment"
  | "transfer"
  | "announcement"
  | "meeting"
  | "census";

export type AuditActor = {
  id?: string;
  name?: string;
};

/** Writes an audit entry. Pass `session` to make it part of a transaction. */
export async function logAudit(
  params: {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId?: string;
    entityTitle?: string | null;
    actor?: AuditActor;
    detail?: string;
  },
  session?: ClientSession,
) {
  await AuditLogDao.create(
    {
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      entity_title: params.entityTitle ?? "Unknown",
      actor_id: params.actor?.id ?? null,
      actor_name: params.actor?.name ?? "System",
      detail: params.detail ?? null,
    },
    session,
  );
}

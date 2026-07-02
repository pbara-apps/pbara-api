import { AuditActor } from "@/helpers/audit-logger";
import { Request } from "express";

export function getActor(req: Request): AuditActor {
  const user = (req as Request & { user?: { id?: string; name?: string } }).user;
  return {
    id: user?.id ? String(user.id) : undefined,
    name: user?.name ? String(user.name) : undefined,
  };
}

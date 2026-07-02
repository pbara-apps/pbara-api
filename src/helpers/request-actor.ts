import { getAuthUser } from "@/helpers/auth-user";
import { AuditActor } from "@/helpers/audit-logger";
import { Request } from "express";

export function getActor(req: Request): AuditActor {
  const user = getAuthUser(req);
  return {
    id: user?.id,
    name: user?.name,
  };
}

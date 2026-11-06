import type { PortalRole } from "@/models/portal-user";
import { Request } from "express";

/**
 * The logged-in chapter portal user, attached to the request by
 * `requirePortalAuth` after it has been re-checked against the database.
 */
export type PortalAuthUser = {
  id: string;
  name: string;
  email: string;
  role: PortalRole;
  churchId: string;
  /** Null for a counsellor (church-wide access). */
  chapterId: string | null;
  hasChangedPassword: boolean;
  /** Older ids of this person (see Account.aliases). */
  aliases?: string[];
};

type RequestWithPortalUser = Request & { portalUser?: PortalAuthUser };

export function setPortalUser(req: Request, user: PortalAuthUser) {
  (req as RequestWithPortalUser).portalUser = user;
}

/** Use only behind `requirePortalAuth`, which guarantees the user is set. */
export function getPortalUser(req: Request): PortalAuthUser {
  const user = (req as RequestWithPortalUser).portalUser;
  if (!user) throw new Error("getPortalUser used without requirePortalAuth");
  return user;
}

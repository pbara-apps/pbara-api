import type { AdminRole } from "@/models/account";
import { Request } from "express";

export type ExecutiveRole = AdminRole;

/**
 * The signed-in admin, attached by `requireAuth` after the account has been
 * re-checked against the database (so role changes apply immediately).
 */
export type AuthUser = {
  /** Account id. */
  id: string;
  name: string;
  role: ExecutiveRole;
  /** Financial Secretary / Treasurer. */
  isFinance: boolean;
  /** Linked executive profile, if any. */
  executiveId?: string;
  office?: string;
  church?: string;
  hasChangedPassword: boolean;
  /** Older ids of this person (see Account.aliases). */
  aliases: string[];
};

export function getAuthUser(req: Request): AuthUser | null {
  const decoded = (req as Request & { user?: { data?: Partial<AuthUser> & { id?: unknown } } }).user;
  if (!decoded?.data?.id) return null;

  return {
    id: String(decoded.data.id),
    name: String(decoded.data.name ?? ""),
    role: (decoded.data.role as ExecutiveRole) ?? "viewer",
    isFinance: decoded.data.isFinance === true,
    executiveId: decoded.data.executiveId,
    office: decoded.data.office ? String(decoded.data.office) : undefined,
    church: decoded.data.church ? String(decoded.data.church) : undefined,
    hasChangedPassword: decoded.data.hasChangedPassword !== false,
    aliases: decoded.data.aliases ?? [],
  };
}

export function setAuthUser(req: Request, user: AuthUser) {
  (req as Request & { user?: unknown }).user = { data: user };
}

export function isSuperAdmin(role?: string) {
  return role === "super_admin";
}

export function isAdminOrSuperAdmin(role?: string) {
  return role === "super_admin" || role === "admin";
}

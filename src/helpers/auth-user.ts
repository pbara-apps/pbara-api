import { Request } from "express";

export type ExecutiveRole = "super_admin" | "admin" | "editor" | "viewer";

export type AuthUser = {
  id: string;
  name: string;
  office?: string;
  church?: string;
  role: ExecutiveRole;
};

export function getAuthUser(req: Request): AuthUser | null {
  const decoded = (
    req as Request & { user?: { data?: Partial<AuthUser> & { id?: unknown } } }
  ).user;

  if (!decoded?.data?.id) return null;

  return {
    id: String(decoded.data.id),
    name: String(decoded.data.name ?? ""),
    office: decoded.data.office ? String(decoded.data.office) : undefined,
    church: decoded.data.church ? String(decoded.data.church) : undefined,
    role: (decoded.data.role as ExecutiveRole) ?? "viewer",
  };
}

export function isSuperAdmin(role?: string) {
  return role === "super_admin";
}

export function isAdminOrSuperAdmin(role?: string) {
  return role === "super_admin" || role === "admin";
}

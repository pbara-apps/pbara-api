import PortalUserDao from "@/dao/portal-user";
import { verifyToken } from "@/helpers/jw-token";
import {
  getPortalUser,
  PORTAL_TOKEN_KIND,
  setPortalUser,
} from "@/helpers/portal-auth-user";
import type { PortalRole } from "@/models/portal-user";
import { NextFunction, Request, Response } from "express";

/**
 * Chapter portal login check.
 *
 * Only accepts portal tokens, then reloads the account from the database
 * so that a replaced or removed officer loses access immediately, not
 * when their token expires.
 */
export async function requirePortalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized", status: false });
  }

  let userId: string | undefined;
  try {
    const decoded = verifyToken(token) as { data?: { kind?: string; id?: string } };
    if (decoded?.data?.kind !== PORTAL_TOKEN_KIND) throw new Error("Wrong token kind");
    userId = decoded.data.id;
  } catch {
    return res.status(401).json({ message: "Unauthorized", status: false });
  }

  try {
    const user = userId ? await PortalUserDao.findById(userId) : null;
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }
    setPortalUser(req, {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role as PortalRole,
      churchId: String(user.church),
      chapterId: user.chapter ? String(user.chapter) : null,
      hasChangedPassword: user.has_changed_password,
    });
    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * Blocks the portal until the one-time password has been replaced.
 * The portal app reacts to code PASSWORD_CHANGE_REQUIRED by showing
 * the change-password screen.
 */
export function requirePasswordChanged(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!getPortalUser(req).hasChangedPassword) {
    return res.status(403).json({
      message: "Please change your one-time password to continue",
      code: "PASSWORD_CHANGE_REQUIRED",
      status: false,
    });
  }
  return next();
}

/** Allows only the given portal roles, e.g. requirePortalRole(["counsellor"]). */
export function requirePortalRole(roles: PortalRole[]) {
  const allowed = new Set(roles);
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowed.has(getPortalUser(req).role)) {
      return res.status(403).json({
        message: "You are not allowed to perform this action",
        status: false,
      });
    }
    return next();
  };
}
